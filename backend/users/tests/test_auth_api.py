import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestSignup:
    url = "/api/auth/signup"

    def test_signup_creates_user_and_returns_tokens(self, api_client):
        resp = api_client.post(
            self.url,
            {"email": "new@example.com", "password": "Sup3rSecret!"},
            format="json",
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "access" in body and "refresh" in body
        assert body["user"]["email"] == "new@example.com"
        assert User.objects.filter(email="new@example.com").exists()

    def test_signup_creates_default_categories(self, api_client):
        api_client.post(
            self.url,
            {"email": "cats@example.com", "password": "Sup3rSecret!"},
            format="json",
        )
        u = User.objects.get(email="cats@example.com")
        names = set(u.categories.values_list("name", flat=True))
        assert names == {"Random Thoughts", "School", "Personal"}

    def test_signup_rejects_weak_password(self, api_client):
        resp = api_client.post(
            self.url,
            {"email": "weak@example.com", "password": "123"},
            format="json",
        )
        assert resp.status_code == 400
        assert not User.objects.filter(email="weak@example.com").exists()

    def test_signup_rejects_duplicate_email(self, api_client, user):
        resp = api_client.post(
            self.url,
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestLogin:
    url = "/api/auth/login"

    def test_login_returns_tokens(self, api_client, user):
        resp = api_client.post(
            self.url,
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access" in body and "refresh" in body
        # The custom login serializer also returns the user so the frontend
        # can render immediately without a follow-up /me request.
        assert body["user"] == {"id": user.id, "email": user.email}

    def test_login_invalid_credentials(self, api_client, user):
        resp = api_client.post(
            self.url,
            {"email": user.email, "password": "wrong"},
            format="json",
        )
        assert resp.status_code == 401


@pytest.mark.django_db
class TestRefresh:
    url = "/api/auth/refresh"

    def test_refresh_issues_new_access(self, api_client, user):
        login = api_client.post(
            "/api/auth/login",
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        ).json()
        resp = api_client.post(self.url, {"refresh": login["refresh"]}, format="json")
        assert resp.status_code == 200
        assert "access" in resp.json()

    def test_refresh_rotates_refresh_token(self, api_client, user):
        """ROTATE_REFRESH_TOKENS issues a new refresh on each refresh."""
        old_refresh = api_client.post(
            "/api/auth/login",
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        ).json()["refresh"]
        new_refresh = (
            api_client.post(self.url, {"refresh": old_refresh}, format="json")
            .json()
            .get("refresh")
        )
        assert new_refresh and new_refresh != old_refresh

    def test_refresh_rejects_blacklisted_token(self, api_client, user):
        """After rotation+blacklist, the old refresh can no longer be used."""
        old_refresh = api_client.post(
            "/api/auth/login",
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        ).json()["refresh"]
        # First refresh rotates and blacklists the old token.
        api_client.post(self.url, {"refresh": old_refresh}, format="json")
        # Reusing the old (now-blacklisted) refresh must fail.
        resp = api_client.post(self.url, {"refresh": old_refresh}, format="json")
        assert resp.status_code == 401


@pytest.mark.django_db
class TestLogout:
    url = "/api/auth/logout"

    def test_logout_requires_auth(self, api_client):
        assert api_client.post(self.url, {}, format="json").status_code == 401

    def test_logout_blacklists_refresh(self, auth_client, api_client, user):
        login = api_client.post(
            "/api/auth/login",
            {"email": user.email, "password": "Sup3rSecret!"},
            format="json",
        ).json()
        resp = auth_client.post(self.url, {"refresh": login["refresh"]}, format="json")
        assert resp.status_code == 205
        # Refresh should now be unusable.
        refresh_resp = api_client.post(
            "/api/auth/refresh", {"refresh": login["refresh"]}, format="json"
        )
        assert refresh_resp.status_code == 401


@pytest.mark.django_db
class TestMe:
    url = "/api/auth/me"

    def test_me_requires_auth(self, api_client):
        assert api_client.get(self.url).status_code == 401

    def test_me_returns_current_user(self, auth_client, user):
        resp = auth_client.get(self.url)
        assert resp.status_code == 200
        assert resp.json() == {"id": user.id, "email": user.email}

    def test_me_rejects_update(self, auth_client):
        """MeView is read-only; PUT/PATCH must return 405."""
        assert (
            auth_client.put(self.url, {"email": "x@y.com"}, format="json").status_code
            == 405
        )
        assert (
            auth_client.patch(self.url, {"email": "x@y.com"}, format="json").status_code
            == 405
        )

    def test_me_rejects_delete(self, auth_client):
        """MeView is read-only; DELETE must return 405."""
        assert auth_client.delete(self.url).status_code == 405
