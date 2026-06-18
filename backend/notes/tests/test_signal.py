import pytest

from notes.models import Category


@pytest.mark.django_db
class TestDefaultCategoriesSignal:
    def test_three_default_categories_created_on_signup(self, user):
        names = list(Category.objects.filter(user=user).values_list("name", "color"))
        # The demo's three categories with their colors.
        assert ("Random Thoughts", "#8b5cf6") in names
        assert ("School", "#3b82f6") in names
        assert ("Personal", "#ec4899") in names
        assert len(names) == 3

    def test_categories_not_duplicated_on_user_update(self, user):
        user.save()  # simulate a normal update
        assert Category.objects.filter(user=user).count() == 3

    def test_unique_name_per_user(self, user):
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            Category.objects.create(user=user, name="School", color="#000000")
