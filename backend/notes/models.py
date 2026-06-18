from django.conf import settings
from django.db import models


class Category(models.Model):
    """A user-owned bucket for notes (e.g. "School", "Personal").

    Each category carries a color used to tint the notes that belong to it.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7)  # hex, e.g. "#3b82f6"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_category_per_user",
            ),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.user.email})"


class Note(models.Model):
    """A single note belonging to a user and filed under a category."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    title = models.CharField(max_length=255, blank=True, default="")
    content = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
            models.Index(fields=["category", "-updated_at"]),
        ]

    def __str__(self) -> str:
        return self.title or f"Untitled note ({self.pk})"
