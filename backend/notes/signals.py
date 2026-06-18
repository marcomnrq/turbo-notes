from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from notes.models import Category

# The three categories every new user starts with, with their display colors.
DEFAULT_CATEGORIES = (
    ("Random Thoughts", "#EF9C66"),  # orange
    ("Personal", "#78ABA8"),  # green
    ("School", "#F3D68B"),  # yellow
)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_categories(sender, instance, created: bool, **kwargs):
    """Seed each new user with the default categories from the demo.

    The demo specifies Random Thoughts, School and Personal as the categories
    automatically created on signup. Skipping updates (`created` guard) keeps
    this idempotent and avoids firing on every user save.
    """
    if not created:
        return

    Category.objects.bulk_create(
        [
            Category(user=instance, name=name, color=color)
            for name, color in DEFAULT_CATEGORIES
        ]
    )
