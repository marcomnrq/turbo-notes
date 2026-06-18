"""
URL configuration for the core project.

Everything app-facing lives under /api/. The OpenAPI schema and Swagger UI
are exposed at /api/schema and /api/docs for convenience during development.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

api_patterns = [
    path("auth/", include("users.urls")),
    path("", include("notes.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_patterns)),
    # OpenAPI
    path("api/schema", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
