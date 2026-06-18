from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.serializers import LoginSerializer
from users.views import LogoutView, MeView, SignupView

app_name = "users"


class LoginView(TokenObtainPairView):
    """Login endpoint using the custom serializer that also returns the user."""

    serializer_class = LoginSerializer


urlpatterns = [
    path("signup", SignupView.as_view(), name="signup"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", TokenRefreshView.as_view(), name="refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("me", MeView.as_view(), name="me"),
]
