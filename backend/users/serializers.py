from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public representation of the authenticated user."""

    class Meta:
        model = User
        fields = ("id", "email")


class SignupSerializer(serializers.ModelSerializer):
    """Create a user from email + password, running Django's validators."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("email", "password")

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )


class LoginSerializer(TokenObtainPairSerializer):
    """Extend simplejwt's login response with the user object.

    The stock TokenObtainPairView returns only {access, refresh}; the frontend
    needs the user too (to render the UI right after login without a follow-up
    /me request), so we add it here.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data

