"""HTTP helpers shared by the agents: login, token handling, user provisioning."""

import subprocess

import requests

from . import config


def api_url(path):
    return f"{config.API_BASE}/{path.lstrip('/')}"


def login_raw(username, password):
    """POST /auth/login/ and return the raw requests.Response (cookies intact)."""
    return requests.post(
        api_url("/auth/login/"),
        json={"username": username, "password": password},
        timeout=config.HTTP_TIMEOUT,
    )


def get_access_token(username, password):
    """Return the access token string, or None on failure."""
    try:
        r = login_raw(username, password)
        if r.status_code == 200:
            return r.json().get("access")
    except requests.RequestException:
        pass
    return None


def auth_header(token):
    return {"Authorization": f"Bearer {token}"} if token else {}


def server_up():
    """True if the backend answers on the public products feed."""
    try:
        return requests.get(api_url("/products/"), timeout=config.HTTP_TIMEOUT).ok
    except requests.RequestException:
        return False


def frontend_up():
    try:
        return requests.get(config.FRONTEND_URL, timeout=config.HTTP_TIMEOUT).ok
    except requests.RequestException:
        return False


def ensure_customer():
    """Make sure a standard (non-admin) account exists; return (user, pass).

    First tries to log in with the configured customer creds. If that fails,
    best-effort provisions the account through the Django ORM using the backend
    virtualenv. Returns (None, None) if provisioning is not possible.
    """
    if get_access_token(config.CUSTOMER_USERNAME, config.CUSTOMER_PASSWORD):
        return config.CUSTOMER_USERNAME, config.CUSTOMER_PASSWORD

    py = config.venv_python()
    if not py:
        return None, None

    snippet = (
        "from django.contrib.auth import get_user_model;"
        "U=get_user_model();"
        f"u,_=U.objects.get_or_create(username='{config.CUSTOMER_USERNAME}',"
        "defaults={'role':'customer'});"
        "u.role='customer';u.is_staff=False;u.is_superuser=False;"
        f"u.set_password('{config.CUSTOMER_PASSWORD}');u.save();"
        "print('ok')"
    )
    try:
        out = subprocess.run(
            [py, config.manage_py(), "shell", "-c", snippet],
            cwd=str(config.REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if "ok" in out.stdout:
            return config.CUSTOMER_USERNAME, config.CUSTOMER_PASSWORD
    except (subprocess.SubprocessError, OSError):
        pass
    return None, None


def reseed_database():
    """Restore the catalog to its pristine seeded state (used after load tests)."""
    py = config.venv_python()
    if not py:
        return False
    try:
        out = subprocess.run(
            [py, config.manage_py(), "seed_db", "--flush"],
            cwd=str(config.REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=120,
        )
        return out.returncode == 0
    except (subprocess.SubprocessError, OSError):
        return False
