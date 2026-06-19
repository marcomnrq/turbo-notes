from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.serializers import SignupSerializer, UserSerializer


class SignupView(CreateAPIView):
    """Register a new user and immediately issue a JWT pair.

    Returning tokens on signup lets the frontend log the user in without a
    follow-up login request.
    """

    serializer_class = SignupSerializer
    permission_classes = (AllowAny,)

    @extend_schema(
        responses={201: OpenApiResponse(description="JWT pair + user")},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """Blacklist the supplied refresh token.

    With ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION enabled, blacklisting
    the refresh token invalidates the whole refresh chain for this session.
    The frontend sends the refresh token in the request body.
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {"refresh": {"type": "string"}},
            },
        },
        responses={205: None},
    )
    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(RetrieveAPIView):
    """The current user's own profile (read-only).

    The frontend only needs to read the authenticated user's data;
    updates or account deletion are not supported.
    """

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self) -> User:
        return self.request.user
