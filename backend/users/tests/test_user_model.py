import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestEmailUser:
    def test_create_user_normalizes_email_and_hashes_password(self):
        user = User.objects.create_user(
            email="Test@EXAMPLE.com", password="Sup3rSecret!"
        )
        assert (
            user.email == "Test@example.com"
        )  # normalized local part stays, domain lowercased
        assert user.check_password("Sup3rSecret!")
        assert user.username is None

    def test_email_is_required(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="x")

    def test_email_is_unique(self):
        User.objects.create_user(email="dup@example.com", password="Sup3rSecret!")
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            User.objects.create_user(email="dup@example.com", password="Sup3rSecret!")

    def test_create_superuser_sets_flags(self):
        su = User.objects.create_superuser(
            email="root@example.com", password="Sup3rSecret!"
        )
        assert su.is_staff and su.is_superuser
