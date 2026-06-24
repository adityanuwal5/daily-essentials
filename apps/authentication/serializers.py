"""Serializers for authentication: login payload, profile, password change."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public-safe representation of a user account."""

    is_admin = serializers.BooleanField(source="is_admin_role", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone_number",
            "delivery_address",
            "role",
            "is_admin",
        )
        read_only_fields = ("id", "role", "is_admin")


class LoginSerializer(TokenObtainPairSerializer):
    """Issues the JWT pair and enriches the response with user context.

    The view extracts the refresh token from ``validated_data`` and moves it
    into an HttpOnly cookie before returning the body to the client.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed role in the token so coarse checks need no extra DB lookup.
        token["role"] = user.role
        token["username"] = user.username
        return token


class ChangePasswordSerializer(serializers.Serializer):
    """Validates a password change for the currently authenticated user.

    ``new_password`` is run through Django's full validation engine (length,
    common-password and letters+numbers rules) before being accepted.
    """

    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        # Raises serializers-friendly ValidationError listing every failed rule.
        validate_password(value, user)
        return value

    def validate(self, attrs):
        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "The new password must differ from the old one."}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
