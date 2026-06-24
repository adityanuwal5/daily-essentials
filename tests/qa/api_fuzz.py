"""Agent 2 (part A) — API resilience fuzzing.

Hits every endpoint with invalid / missing / malformed data and asserts the
backend degrades gracefully (4xx) instead of crashing (5xx). A 500 means an
unhandled exception leaked — that's the finding.
"""

import requests

from .. import config
from ..http_client import api_url, auth_header, get_access_token
from ..reporting import AgentReport

# Each case: (label, method, path, json-body, needs_admin)
CASES = [
    ("login: empty body", "POST", "/auth/login/", {}, False),
    ("login: missing password", "POST", "/auth/login/", {"username": "x"}, False),
    ("login: wrong types", "POST", "/auth/login/", {"username": 123, "password": []}, False),
    ("products: junk query types", "GET", "/products/?min_price=abc&max_price=xyz", None, False),
    ("products: detail 404", "GET", "/products/99999999/", None, False),
    ("orders: empty body", "POST", "/orders/", {}, True),
    ("orders: empty items", "POST", "/orders/", {"delivery_address": "x", "items_input": []}, True),
    ("orders: nonexistent product", "POST", "/orders/",
     {"delivery_address": "x", "items_input": [{"product": 99999999, "quantity": 1}]}, True),
    ("orders: negative quantity", "POST", "/orders/",
     {"delivery_address": "x", "items_input": [{"product": 1, "quantity": -5}]}, True),
    ("change-password: missing fields", "POST", "/auth/change-password/", {}, True),
    ("admin product: missing required name/price", "POST", "/admin/products/",
     {"category": "snacks"}, True),
    ("admin product: bad category choice", "POST", "/admin/products/",
     {"name": "x", "price": "1.00", "category": "not_a_category"}, True),
    ("admin product: price as text", "POST", "/admin/products/",
     {"name": "x", "price": "free", "category": "snacks"}, True),
]


def run():
    report = AgentReport("Broken Link & Error Scout — API resilience")
    admin_token = get_access_token(config.ADMIN_USERNAME, config.ADMIN_PASSWORD)

    for label, method, path, body, needs_admin in CASES:
        headers = auth_header(admin_token) if needs_admin else {}
        if needs_admin and not admin_token:
            report.skip(f"{label}", "admin token unavailable")
            continue
        try:
            r = requests.request(
                method, api_url(path), headers=headers, json=body,
                timeout=config.HTTP_TIMEOUT,
            )
            graceful = 400 <= r.status_code < 500
            report.add(
                f"{label} -> graceful 4xx",
                passed=graceful,
                severity="HIGH",
                detail="Invalid input must yield a 400-level error, never a 500 crash.",
                evidence=f"HTTP {r.status_code}"
                + (" (5xx = unhandled crash!)" if r.status_code >= 500 else ""),
            )
        except requests.RequestException as e:
            report.skip(f"{label}", f"request failed: {e}")

    return report


if __name__ == "__main__":
    print(run().to_console())
