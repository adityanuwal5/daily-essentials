"""
Django settings for the DailyEssentials backend (project: core).

The configuration is intentionally environment-aware: secrets and toggles are
read from the process environment so the same code runs in local development
and production. Sensible development defaults are provided so the project boots
out of the box against a local SQLite database.
"""

import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name, default=False):
    """Read a boolean-ish environment variable ('1', 'true', 'yes')."""
    return os.environ.get(name, str(default)).lower() in {"1", "true", "yes", "on"}


# --------------------------------------------------------------------------- #
# Core security
# --------------------------------------------------------------------------- #
# SECURITY WARNING: a generated key is used for local development. In any real
# deployment, set DJANGO_SECRET_KEY in the environment.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-4l3m0p4oo^1htek!6k(+my@v+3gacou)cck9c!v-&tm6!j5pz4",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool("DJANGO_DEBUG", default=True)

ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS",
    "localhost,127.0.0.1,daily-essentials-vert.vercel.app",
).split(",")


# --------------------------------------------------------------------------- #
# Application definition
# --------------------------------------------------------------------------- #
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_filters",
    # Local apps
    "apps.authentication",
    "apps.products",
    "apps.orders",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files (incl. the Django admin UI) in
    # production. It must come directly after SecurityMiddleware.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # CORS must sit as high as possible, and before CommonMiddleware, so the
    # appropriate Access-Control headers are attached to every response.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


# --------------------------------------------------------------------------- #
# Database — environment-aware.
#
# * Local development: file-based SQLite (no setup needed — works out of box).
# * Production (Vercel): set the DATABASE_URL environment variable to a cloud
#   PostgreSQL connection string (Neon/Supabase) and the project switches to it
#   automatically. The schema is ORM-only, so no model or migration changes are
#   needed to move between engines.
# --------------------------------------------------------------------------- #
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # --- Production: cloud PostgreSQL parsed from one connection string ---- #
    # dj_database_url turns "postgres://user:pass@host:5432/dbname" into the
    # dict Django expects. Imported here so local SQLite-only setups don't
    # need the package installed.
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,         # reuse connections instead of reconnecting
            conn_health_checks=True,  # transparently drop dead connections
            ssl_require=True,         # Neon/Supabase require TLS
        )
    }
else:
    # --- Local development: SQLite ---------------------------------------- #
    # `timeout` makes a blocked writer wait (up to 20s) for the lock instead of
    # immediately raising "database is locked" under concurrent checkouts. WAL
    # journal mode is enabled via a `connection_created` signal (see
    # apps/products/apps.py) — that signal is a no-op on PostgreSQL, so the
    # production path above is unaffected.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "OPTIONS": {
                "timeout": 20,
            },
        }
    }


# --------------------------------------------------------------------------- #
# Custom user model
# --------------------------------------------------------------------------- #
AUTH_USER_MODEL = "authentication.CustomUser"


# --------------------------------------------------------------------------- #
# Password validation — strict regulation engine.
# Enforces minimum length, blocks common/numeric-only passwords, and (via the
# custom validator) requires a mix of letters and numbers.
# --------------------------------------------------------------------------- #
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
    {
        "NAME": "apps.authentication.validators.LetterNumberValidator",
    },
]


# --------------------------------------------------------------------------- #
# Internationalization
# --------------------------------------------------------------------------- #
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True


# --------------------------------------------------------------------------- #
# Static files — served by WhiteNoise in production.
# `collectstatic` gathers everything (including the Django admin assets) into
# STATIC_ROOT during the Vercel build; WhiteNoise then serves them with
# compression + far-future caching. The compressed/manifest storage is used
# only when DEBUG is off so local `runserver` keeps serving static files
# directly without needing a collectstatic run first.
# --------------------------------------------------------------------------- #
# Leading slash is important: it makes generated static URLs absolute
# (/static/...) so the admin's CSS resolves correctly from any page depth
# (e.g. /django-admin/) instead of being treated as relative.
STATIC_URL = "/static/"
# Collected into staticfiles_build/static — the path Vercel's static build
# serves (see vercel.json). os.path.join keeps it explicit for the build.
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles_build", "static")

# Django 5.0 configures storage backends via STORAGES (the modern replacement
# for the deprecated STATICFILES_STORAGE — setting both would raise
# ImproperlyConfigured). WhiteNoise's compressed/manifest storage is used in
# production; plain storage locally so `runserver` needs no collectstatic.
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
            if not DEBUG
            else "django.contrib.staticfiles.storage.StaticFilesStorage"
        ),
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --------------------------------------------------------------------------- #
# Django REST Framework
# --------------------------------------------------------------------------- #
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # Custom JWT auth that can also read the access token from a cookie.
        "apps.authentication.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}


# --------------------------------------------------------------------------- #
# Simple JWT — short-lived access tokens, long-lived refresh tokens.
# The refresh token is delivered to the browser only inside an HttpOnly cookie
# (see the auth views), so client-side scripts can never read it.
# --------------------------------------------------------------------------- #
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": SECRET_KEY,
}

# Name and behaviour of the HttpOnly refresh cookie.
JWT_AUTH_REFRESH_COOKIE = "refresh_token"
# Mirror the access token into a cookie too, so the SPA can stay authenticated
# without storing anything in JS-readable localStorage.
JWT_AUTH_ACCESS_COOKIE = "access_token"
# Secure=True requires HTTPS; disabled in local dev where DEBUG is on.
JWT_AUTH_COOKIE_SECURE = not DEBUG
JWT_AUTH_COOKIE_SAMESITE = "Lax"
# Path scoping: the refresh cookie is only sent to the refresh endpoint.
JWT_AUTH_REFRESH_COOKIE_PATH = "/api/auth/"


# --------------------------------------------------------------------------- #
# CORS — Module 1.
# Only the local React (Vite) dev server may call this API in the browser, and
# credentials (cookies) are allowed so the HttpOnly refresh cookie round-trips.
# --------------------------------------------------------------------------- #
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins — required for the admin login form to POST over HTTPS.
# Includes the local dev origins plus the production domain by default.
CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    "https://daily-essentials-vert.vercel.app,http://localhost:5173,http://127.0.0.1:5173",
).split(",")


# --------------------------------------------------------------------------- #
# Production security hardening — only applied when DEBUG is off.
# Vercel terminates TLS at its edge and forwards the original scheme in the
# X-Forwarded-Proto header, so SECURE_PROXY_SSL_HEADER lets Django correctly
# detect HTTPS (required for secure cookies and the SSL redirect to work).
# --------------------------------------------------------------------------- #
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True