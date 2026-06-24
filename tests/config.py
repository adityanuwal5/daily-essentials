"""Shared configuration for the DailyEssentials test-agent suite.

Everything is environment-overridable so the same agents run against local dev,
CI, or a staging box without code changes.
"""

import os
from pathlib import Path

# Repo root = parent of the tests/ directory.
REPO_ROOT = Path(__file__).resolve().parents[1]

# --- Targets --------------------------------------------------------------- #
API_BASE = os.environ.get("API_BASE_URL", "http://localhost:8000/api").rstrip("/")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# --- Credentials ----------------------------------------------------------- #
# Admin account (created during backend setup via createsuperuser).
ADMIN_USERNAME = os.environ.get("TEST_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASS", "Admin@12345")

# A standard (non-admin) account used to prove RBAC. Provisioned on demand via
# the Django ORM if it does not already exist (see http_client.ensure_customer).
CUSTOMER_USERNAME = os.environ.get("TEST_CUSTOMER_USER", "qa_customer")
CUSTOMER_PASSWORD = os.environ.get("TEST_CUSTOMER_PASS", "Customer123")

# --- Behaviour ------------------------------------------------------------- #
HTTP_TIMEOUT = float(os.environ.get("TEST_HTTP_TIMEOUT", "10"))
LOAD_CONCURRENCY = int(os.environ.get("TEST_LOAD_CONCURRENCY", "50"))

# Name of the HttpOnly refresh cookie the backend issues (see settings.py).
REFRESH_COOKIE = os.environ.get("TEST_REFRESH_COOKIE", "refresh_token")
ACCESS_COOKIE = os.environ.get("TEST_ACCESS_COOKIE", "access_token")


def venv_python():
    """Locate the backend virtualenv interpreter (for ORM-based provisioning)."""
    win = REPO_ROOT / "venv" / "Scripts" / "python.exe"
    nix = REPO_ROOT / "venv" / "bin" / "python"
    if win.exists():
        return str(win)
    if nix.exists():
        return str(nix)
    return None


def manage_py():
    return str(REPO_ROOT / "manage.py")
