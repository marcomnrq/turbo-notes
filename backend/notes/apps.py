from django.apps import AppConfig


class NotesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notes"

    def ready(self) -> None:
        # Import signals so the post_save receiver for default categories
        # is registered at startup.
        from notes import signals  # noqa: F401
