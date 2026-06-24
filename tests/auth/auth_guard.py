"""Agent 3 — The Unauthorized Access Guard (auth focus).

Proves the restricted area is genuinely restricted at the API boundary (the
real security perimeter — the React /admin route guard is only cosmetic):
  * logged-out access to /api/admin/* and other protected endpoints
  * access as a standard (non-admin) user -> RBAC 403
  * access with an invalid / malformed (expired-equivalent) access token
"""

import requests

from .. import config
from ..http_client import (
    api_url,
    auth_header,
    ensure_customer,
    get_access_token,
)
from ..reporting import AgentReport

# Endpoints that require authentication; the admin ones additionally require the
# admin role.
ADMIN_ONLY = [
    ("GET", "/admin/dashboard-metrics/"),
    ("GET", "/admin/products/"),
    ("POST", "/admin/products/"),
]
AUTH_REQUIRED = [
    ("GET", "/auth/me/"),
    ("GET", "/orders/"),
    ("POST", "/orders/"),
]

# A structurally-valid but bogus JWT — exercises the same rejection path as an
# expired/tampered access token.
BOGUS_JWT = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxMDAwMDAwMDAwLCJ1c2VyX2lkIjo5OTk5fQ."
    "thissignatureisnotvalidatall_0000000000000000000000000"
)


def _expect(report, method, path, headers, allowed, *, role, severity="HIGH"):
    try:
        r = requests.request(
            method, api_url(path), headers=headers, json={}, timeout=config.HTTP_TIMEOUT
        )
        ok = r.status_code in allowed
        report.add(
            f"{role}: {method} {path} -> {'/'.join(map(str, allowed))}",
            passed=ok,
            severity=severity,
            detail="Restricted endpoints must deny unauthorized callers.",
            evidence=f"HTTP {r.status_code} (expected one of {allowed})",
        )
    except requests.RequestException as e:
        report.skip(f"{role}: {method} {path}", f"request failed: {e}")


def run():
    report = AgentReport("Unauthorized Access Guard (Auth)")

    # --- 1. Completely logged out ----------------------------------------- #
    for method, path in ADMIN_ONLY + AUTH_REQUIRED:
        _expect(report, method, path, headers={}, allowed=(401, 403),
                role="anon", severity="CRITICAL")

    # --- 2. Authenticated but NOT admin (RBAC) ---------------------------- #
    cust_user, cust_pass = ensure_customer()
    if cust_user:
        token = get_access_token(cust_user, cust_pass)
        if token:
            hdr = auth_header(token)
            # Standard user must be blocked from admin endpoints (403)...
            for method, path in ADMIN_ONLY:
                _expect(report, method, path, hdr, allowed=(403,),
                        role="customer", severity="CRITICAL")
            # ...but allowed on their own authenticated endpoints (sanity: not 401/403).
            try:
                r = requests.get(
                    api_url("/auth/me/"), headers=hdr, timeout=config.HTTP_TIMEOUT
                )
                report.add(
                    "customer: GET /auth/me/ is permitted (200)",
                    passed=r.status_code == 200,
                    severity="MEDIUM",
                    detail="A valid non-admin token should still access its own profile.",
                    evidence=f"HTTP {r.status_code}",
                )
            except requests.RequestException as e:
                report.skip("customer: GET /auth/me/", str(e))
        else:
            report.skip("RBAC (standard user)", "could not log in as the customer account")
    else:
        report.skip(
            "RBAC (standard user)",
            "no customer account and could not auto-provision one (backend venv not found)",
        )

    # --- 3. Invalid / expired-equivalent token ---------------------------- #
    bad_hdr = {"Authorization": f"Bearer {BOGUS_JWT}"}
    _expect(report, "GET", "/admin/dashboard-metrics/", bad_hdr, allowed=(401,),
            role="bad-token", severity="CRITICAL")
    _expect(report, "GET", "/auth/me/", bad_hdr, allowed=(401,),
            role="bad-token", severity="CRITICAL")

    # Garbage (non-JWT) Authorization header.
    _expect(report, "GET", "/auth/me/", {"Authorization": "Bearer not.a.jwt"},
            allowed=(401,), role="garbage-token", severity="HIGH")

    return report


if __name__ == "__main__":
    print(run().to_console())
