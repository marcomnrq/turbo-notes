from rest_framework import serializers

from notes.models import Category, Note


class CategorySerializer(serializers.ModelSerializer):
    """Category with the number of notes it contains.

    The view annotates `note_count` on the queryset so we avoid an N+1 when
    listing categories. Defaulting to 0 keeps the serializer safe to use on
    un-annotated instances (e.g. after a create).
    """

    note_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ("id", "name", "color", "note_count")
        read_only_fields = ("id",)


class NoteSerializer(serializers.ModelSerializer):
    """Note serialization.

    `category` is the category id (writable FK) but not required: the view's
    perform_create assigns a default category when none is supplied, so the
    demo's "create blank note instantly" flow works without a pick.
    """

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
    )

    class Meta:
        model = Note
        fields = ("id", "title", "content", "category", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_category(self, category):
        """Don't let a user file a note under someone else's category."""
        request = self.context.get("request")
        if request is not None and category.user_id != request.user.id:
            raise serializers.ValidationError("Category not found.")
        return category
