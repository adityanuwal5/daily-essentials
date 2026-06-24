"""Agent 4 — The Performance & Load Tester (load focus).

  * fires N concurrent GET /api/products/ requests and reports latency + errors
  * stress-tests checkout: many concurrent orders against a single product, then
    proves the database stayed consistent (no oversell, exact stock decrement)

The checkout stress test MUTATES data. The orchestrator re-seeds afterwards;
when run standalone, restore with:  python manage.py seed_db --flush
"""

import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

from .. import config
from ..http_client import api_url, auth_header, get_access_token
from ..reporting import AgentReport


def _percentile(values, pct):
    if not values:
        return 0.0
    s = sorted(values)
    k = max(0, min(len(s) - 1, int(round((pct / 100) * len(s)) - 1)))
    return s[k]


def _load_products(report, n):
    def one(_):
        start = time.perf_counter()
        try:
            r = requests.get(api_url("/products/"), timeout=config.HTTP_TIMEOUT)
            return r.status_code, (time.perf_counter() - start) * 1000
        except requests.RequestException:
            return None, (time.perf_counter() - start) * 1000

    latencies, statuses = [], []
    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=n) as pool:
        for status, ms in pool.map(one, range(n)):
            statuses.append(status)
            latencies.append(ms)
    wall = time.perf_counter() - started

    ok = sum(1 for s in statuses if s == 200)
    errors = sum(1 for s in statuses if s is None or s >= 500)

    report.add(
        f"{n} concurrent GET /products/ — no timeouts or 5xx",
        passed=errors == 0 and ok == n,
        severity="HIGH",
        detail="The server must serve a burst of reads without dropping requests.",
        evidence=(
            f"{ok}/{n} OK, {errors} errors, "
            f"wall={wall*1000:.0f}ms, "
            f"p50={_percentile(latencies,50):.0f}ms "
            f"p95={_percentile(latencies,95):.0f}ms "
            f"max={max(latencies):.0f}ms "
            f"throughput={n/wall:.0f} req/s"
        ),
    )


def _checkout_consistency(report, concurrency=25, qty_each=1):
    token = get_access_token(config.ADMIN_USERNAME, config.ADMIN_PASSWORD)
    if not token:
        report.skip("Checkout consistency", "could not authenticate to place orders")
        return
    hdr = auth_header(token)

    # Pick a product and read its starting stock.
    try:
        listing = requests.get(api_url("/products/"), timeout=config.HTTP_TIMEOUT).json()
        products = listing if isinstance(listing, list) else listing.get("results", [])
        if not products:
            report.skip("Checkout consistency", "no products available")
            return
        pid = products[0]["id"]
        detail = requests.get(api_url(f"/products/{pid}/"), timeout=config.HTTP_TIMEOUT).json()
        start_stock = int(detail["stock_quantity"])
    except (requests.RequestException, ValueError, KeyError) as e:
        report.skip("Checkout consistency", f"setup failed: {e}")
        return

    body = {
        "delivery_address": "Load Test Lane",
        "payment_method": "cod",
        "items_input": [{"product": pid, "quantity": qty_each}],
    }

    def one(_):
        try:
            r = requests.post(
                api_url("/orders/"), headers=hdr, json=body, timeout=config.HTTP_TIMEOUT
            )
            return r.status_code
        except requests.RequestException:
            return None

    results = []
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(one, i) for i in range(concurrency)]
        for f in as_completed(futures):
            results.append(f.result())

    created = sum(1 for s in results if s == 201)
    rejected = sum(1 for s in results if s == 400)  # graceful "insufficient stock"
    server_err = sum(1 for s in results if s is None or s >= 500)

    try:
        end_stock = int(
            requests.get(api_url(f"/products/{pid}/"), timeout=config.HTTP_TIMEOUT)
            .json()["stock_quantity"]
        )
    except (requests.RequestException, ValueError, KeyError) as e:
        report.skip("Checkout consistency", f"could not read final stock: {e}")
        return

    expected_end = start_stock - created * qty_each
    # Correctness: the atomic select_for_update decrement must never oversell,
    # regardless of how many requests the DB rejected. This is the property that
    # actually matters for data integrity.
    consistent = end_stock == expected_end and end_stock >= 0
    evidence = (
        f"product={pid} start={start_stock} created201={created} "
        f"rejected400={rejected} 5xx={server_err} "
        f"end={end_stock} expected={expected_end}"
    )
    report.add(
        "Checkout under concurrency keeps stock consistent (no oversell)",
        passed=consistent,
        severity="CRITICAL",
        detail=(
            "Final stock must equal start - (successful orders x qty) and never go "
            "negative — proves the row-locked decrement is race-free."
        ),
        evidence=evidence,
    )

    # Reliability: separately flag if the server returned 5xx under write load.
    # On SQLite this happens because writes are serialised ('database is locked');
    # it is a transport/robustness issue, not a data-corruption one.
    report.add(
        "Concurrent checkouts complete without server errors (no 5xx)",
        passed=server_err == 0,
        severity="HIGH",
        detail=(
            "5xx under concurrent writes = unhandled DB contention. On SQLite, "
            "enable WAL + busy_timeout, or move to PostgreSQL, for production write load."
        ),
        evidence=f"{server_err}/{concurrency} requests returned 5xx",
    )


def run(load_n=None, stress_checkout=True):
    report = AgentReport("Performance & Load Tester (Load)")
    n = load_n or config.LOAD_CONCURRENCY
    _load_products(report, n)
    if stress_checkout:
        _checkout_consistency(report)
    return report


if __name__ == "__main__":
    print(run().to_console())
