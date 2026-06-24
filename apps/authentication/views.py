"""Authentication endpoints: login, cookie-based refresh, password change.

Token transport strategy
-------------------------
* The short-lived **access** token is returned in the JSON body (for header
  based API clients) *and* mirrored into an HttpOnly cookie (for the SPA).
* The long-lived **refresh** token is delivered *only* as an HttpOnly,
  path-scoped cookie. It is never placed in the response body, so browser
  scripts (and therefore XSS payloads) cannot read or exfiltrate it.
"""

from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserSerializer,
)


def _set_auth_cookies(response, access=None, refresh=None):
    """Attach the access/refresh tokens to the response as HttpOnly cookies."""
    common = {
        "httponly": True,
        "secure": settings.JWT_AUTH_COOKIE_SECURE,
        "samesite": settings.JWT_AUTH_COOKIE_SAMESITE,
    }
    if access is not None:
        response.set_cookie(
            settings.JWT_AUTH_ACCESS_COOKIE,
            access,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            path="/",
            **common,
        )
    if refresh is not None:
        response.set_cookie(
            settings.JWT_AUTH_REFRESH_COOKIE,
            refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            # Scope the refresh cookie tightly to the auth routes.
            path=settings.JWT_AUTH_REFRESH_COOKIE_PATH,
            **common,
        )
    return response


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — verify credentials and open a JWT session."""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken) as exc:
            raise InvalidToken(exc.args[0])

        data = serializer.validated_data
        # Pull the refresh token out of the body — it lives only in the cookie.
        refresh = data.pop("refresh")
        access = data["access"]

        response = Response(data, status=status.HTTP_200_OK)
        return _set_auth_cookies(response, access=access, refresh=refresh)


class CookieTokenRefreshView(APIView):
    """POST /api/auth/refresh/ — mint a new access token from the cookie.

    Reads the refresh token from the HttpOnly cookie (not the body), validates
    it, and returns a fresh access token. With rotation enabled, the refresh
    cookie is also reissued.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not raw_refresh:
            return Response(
                {"detail": "No refresh token cookie present."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(raw_refresh)
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access = str(refresh.access_token)
        body = {"access": access}

        new_refresh = None
        if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS"):
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()
            new_refresh = str(refresh)

        response = Response(body, status=status.HTTP_200_OK)
        return _set_auth_cookies(response, access=access, refresh=new_refresh)


class LogoutView(APIView):
    """POST /api/auth/logout/ — clear the auth cookies."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.JWT_AUTH_ACCESS_COOKIE, path="/")
        response.delete_cookie(
            settings.JWT_AUTH_REFRESH_COOKIE,
            path=settings.JWT_AUTH_REFRESH_COOKIE_PATH,
        )
        return response


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/change-password/ — update the caller's password.

    Protected: only an authenticated user may change *their own* password, and
    the new value must satisfy the strict password policy.
    """

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class MeView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — return the authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
