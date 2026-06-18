"""Shared pytest fixtures for the Turbo Notes backend."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def user_factory(db):
    """Return a factory that creates a user (and its default categories)."""
    counter = [0]

    def _make(email: str | None = None, password: str = "Sup3rSecret!") -> User:
        counter[0] += 1
        email = email or f"user{counter[0]}@example.com"
        return User.objects.create_user(email=email, password=password)

    return _make


@pytest.fixture
def user(db, user_factory) -> User:
    return user_factory(email="alice@example.com")


@pytest.fixture
def other_user(db, user_factory) -> User:
    return user_factory(email="bob@example.com")


@pytest.fixture
def api_client() -> APIClient:
    """Unauthenticated DRF API client."""
    return APIClient()


@pytest.fixture
def auth_client(api_client, user) -> APIClient:
    """API client authenticated as `user` via a real JWT access token."""
    from rest_framework_simplejwt.tokens import RefreshToken

    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client
