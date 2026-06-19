from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView

from notes.models import Category, Note
from notes.serializers import CategorySerializer, NoteSerializer


class CategoryListView(ListCreateAPIView):
    """List the current user's categories with their note counts."""

    serializer_class = CategorySerializer

    def get_queryset(self):
        return (
            Category.objects.filter(user=self.request.user)
            .annotate(note_count=Count("notes"))
            .order_by("name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    """CRUD for notes, scoped to the authenticated user.

    Query params:
        category: filter to a single category id (e.g. ?category=3).
        search:   case-insensitive match on title or content (e.g. ?search=exam).
    """

    serializer_class = NoteSerializer
    search_fields = ("title", "content")  # wired by DRF's SearchFilter

    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user)

        category = self.request.query_params.get("category")
        if category:
            try:
                category = int(category)
            except (TypeError, ValueError):
                raise ValidationError(
                    {"category": "A valid integer is required."}
                ) from None
            queryset = queryset.filter(category_id=category)

        return queryset.select_related("category")

    def perform_create(self, serializer):
        """Assign the note to the current user.

        If no category is supplied, default to the user's first category
        (created by the signup signal) so the demo's "create blank note
        instantly" flow works without the user picking one first.

        Raises 400 if the user has zero categories (e.g. they were all
        deleted externally) instead of an unhandled IntegrityError.
        """
        category = serializer.validated_data.get("category")
        if not category:
            category = (
                Category.objects.filter(user=self.request.user).order_by("name").first()
            )
            if category is None:
                raise ValidationError(
                    {"category": "You must create a category before adding notes."}
                )
        serializer.save(user=self.request.user, category=category)

    @extend_schema(tags=["notes"])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
