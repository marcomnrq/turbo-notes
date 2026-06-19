import pytest

from notes.models import Category, Note


def make_note(user, category, **kwargs):
    return Note.objects.create(user=user, category=category, **kwargs)


# The router is configured with trailing_slash=False so every API URL is
# slash-free (consistent with the auth/category routes and friendly to the
# Next.js rewrite proxy, which normalizes trailing slashes).
NOTES = "/api/notes"


@pytest.mark.django_db
class TestNotesAuth:
    def test_list_requires_auth(self, api_client):
        assert api_client.get(NOTES).status_code == 401


@pytest.mark.django_db
class TestNotesCreate:
    def test_create_assigns_default_category_when_none_given(self, auth_client, user):
        """Demo flow: clicking "New note" creates a blank note instantly."""
        resp = auth_client.post(NOTES, {"title": "", "content": ""}, format="json")
        assert resp.status_code == 201
        note = Note.objects.get(id=resp.json()["id"])
        assert note.user_id == user.id
        assert note.category is not None  # got a default category
        assert resp.json()["category"] == note.category_id

    def test_create_with_explicit_category(self, auth_client, categories):
        resp = auth_client.post(
            NOTES,
            {"title": "HW", "content": "do it", "category": categories["School"].id},
            format="json",
        )
        assert resp.status_code == 201
        assert resp.json()["category"] == categories["School"].id

    def test_create_fails_when_no_categories_exist(self, auth_client, user):
        """If all categories are deleted, creating a note must 400 gracefully."""
        user.categories.all().delete()
        resp = auth_client.post(NOTES, {"title": "orphan"}, format="json")
        assert resp.status_code == 400
        assert "category" in resp.json()


@pytest.mark.django_db
class TestNotesList:
    def test_lists_own_notes_ordered_by_updated_desc(
        self, auth_client, user, categories, other_user
    ):
        make_note(user, categories["School"], title="mine")
        make_note(
            other_user, Category.objects.filter(user=other_user).first(), title="theirs"
        )
        resp = auth_client.get(NOTES)
        assert resp.status_code == 200
        titles = [n["title"] for n in resp.json()]
        assert titles == ["mine"]

    def test_filter_by_category(self, auth_client, user, categories):
        make_note(user, categories["School"], title="s1")
        make_note(user, categories["Personal"], title="p1")
        resp = auth_client.get(NOTES, {"category": categories["School"].id})
        titles = {n["title"] for n in resp.json()}
        assert titles == {"s1"}

    def test_filter_by_non_integer_category_returns_400(self, auth_client):
        """A non-integer ?category must 400 (clean validation), not crash with 500."""
        resp = auth_client.get(NOTES, {"category": "abc"})
        assert resp.status_code == 400
        assert "category" in resp.json()

    def test_filter_by_whitespace_category_returns_400(self, auth_client):
        """Whitespace-only ?category must also 400, matching any non-integer."""
        resp = auth_client.get(NOTES, {"category": " "})
        assert resp.status_code == 400
        assert "category" in resp.json()

    def test_search_matches_title_or_content(self, auth_client, user, categories):
        make_note(
            user, categories["School"], title="Math homework", content="chapter 3"
        )
        make_note(user, categories["Personal"], title="groceries", content="buy eggs")
        resp = auth_client.get(NOTES, {"search": "egg"})
        titles = {n["title"] for n in resp.json()}
        assert titles == {"groceries"}

    def test_search_is_case_insensitive(self, auth_client, user, categories):
        make_note(user, categories["School"], title="BIOLOGY 101", content="")
        resp = auth_client.get(NOTES, {"search": "biology"})
        assert {n["title"] for n in resp.json()} == {"BIOLOGY 101"}


@pytest.mark.django_db
class TestNotesRetrieveUpdate:
    def _detail(self, note_id: int) -> str:
        return f"{NOTES}/{note_id}"

    def test_retrieve_own_note(self, auth_client, user, categories):
        note = make_note(user, categories["School"], title="t", content="c")
        resp = auth_client.get(self._detail(note.id))
        assert resp.status_code == 200
        assert resp.json()["title"] == "t"

    def test_retrieve_other_users_note_returns_404(
        self, auth_client, other_user, categories
    ):
        note = make_note(
            other_user, Category.objects.filter(user=other_user).first(), title="x"
        )
        resp = auth_client.get(self._detail(note.id))
        assert resp.status_code == 404

    def test_update_title_and_content(self, auth_client, user, categories):
        note = make_note(user, categories["School"], title="old", content="old")
        resp = auth_client.patch(
            self._detail(note.id),
            {"title": "new", "content": "new"},
            format="json",
        )
        assert resp.status_code == 200
        note.refresh_from_db()
        assert note.title == "new" and note.content == "new"

    def test_update_category(self, auth_client, user, categories):
        note = make_note(user, categories["School"], title="t")
        resp = auth_client.patch(
            self._detail(note.id),
            {"category": categories["Personal"].id},
            format="json",
        )
        assert resp.status_code == 200
        note.refresh_from_db()
        assert note.category_id == categories["Personal"].id

    def test_cannot_update_other_users_note(self, auth_client, other_user):
        note = make_note(
            other_user,
            Category.objects.filter(user=other_user).first(),
            title="theirs",
        )
        resp = auth_client.patch(
            self._detail(note.id), {"title": "hacked"}, format="json"
        )
        assert resp.status_code == 404
        note.refresh_from_db()
        assert note.title == "theirs"


@pytest.mark.django_db
class TestNotesDelete:
    def _detail(self, note_id: int) -> str:
        return f"{NOTES}/{note_id}"

    def test_delete_own_note(self, auth_client, user, categories):
        note = make_note(user, categories["School"], title="bye")
        resp = auth_client.delete(self._detail(note.id))
        assert resp.status_code == 204
        assert not Note.objects.filter(id=note.id).exists()

    def test_cannot_delete_other_users_note(self, auth_client, other_user):
        note = make_note(
            other_user,
            Category.objects.filter(user=other_user).first(),
            title="safe",
        )
        resp = auth_client.delete(self._detail(note.id))
        assert resp.status_code == 404
        assert Note.objects.filter(id=note.id).exists()
