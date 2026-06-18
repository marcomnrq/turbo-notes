from django.urls import include, path
from rest_framework.routers import DefaultRouter

from notes.views import CategoryListView, NoteViewSet

app_name = "notes"

# trailing_slash=False keeps every URL in this API slash-free, matching the
# auth/category routes and avoiding redirect loops through the Next.js rewrite
# proxy (which normalizes trailing slashes and would otherwise ping-pong with
# Django's APPEND_SLASH middleware).
router = DefaultRouter(trailing_slash=False)
router.register("notes", NoteViewSet, basename="note")

urlpatterns = [
    path("categories", CategoryListView.as_view(), name="category-list"),
    path("", include(router.urls)),
]
