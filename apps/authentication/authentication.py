"""JWT authentication that also accepts the access token from a cookie.

The browser SPA never stores tokens in JS-readable storage. Instead, the login
endpoint sets an HttpOnly access cookie (and a separate, path-scoped HttpOnly
refresh cookie). This authentication class lets DRF authenticate a request from
either the standard ``Authorization: Bearer`` header *or* that access cookie,
so the same backend serves both API clients and the cookie-based SPA.
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Prefer the standard Authorization header if present.
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated = self.get_validated_token(raw_token)
                return self.get_user(validated), validated

        # 2. Fall back to the HttpOnly access cookie used by the SPA.
        raw_token = request.COOKIES.get(settings.JWT_AUTH_ACCESS_COOKIE)
        if not raw_token:
            return None

        validated = self.get_validated_token(raw_token)
        return self.get_user(validated), validated
