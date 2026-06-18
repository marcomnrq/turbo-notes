import pytest

from notes.models import Category, Note


@pytest.fixture
def categories(user):
    """The three default categories created by the signal."""
    cats = list(Category.objects.filter(user=user).order_by("name"))
    assert len(cats) == 3, "signal should have created default categories"
    return {c.name: c for c in cats}


@pytest.mark.django_db
class TestCategoryList:
    url = "/api/categories"

    def test_requires_auth(self, api_client):
        assert api_client.get(self.url).status_code == 401

    def test_lists_user_categories_with_counts(self, auth_client, user, categories):
        # Two notes in School, one in Personal.
        Note.objects.create(user=user, category=categories["School"], title="a")
        Note.objects.create(user=user, category=categories["School"], title="b")
        Note.objects.create(user=user, category=categories["Personal"], title="c")

        resp = auth_client.get(self.url)
        assert resp.status_code == 200
        body = resp.json()
        by_name = {c["name"]: c for c in body}
        assert by_name["School"]["note_count"] == 2
        assert by_name["Personal"]["note_count"] == 1
        assert by_name["Random Thoughts"]["note_count"] == 0

    def test_only_returns_own_categories(self, auth_client, other_user):
        Category.objects.create(user=other_user, name="Bob's Cat", color="#111111")
        resp = auth_client.get("/api/categories")
        assert resp.status_code == 200
        names = {c["name"] for c in resp.json()}
        assert "Bob's Cat" not in names
