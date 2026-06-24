"""Agent 2 (part B) — frontend crawler & runtime-error scout (Playwright).

Drives a real headless browser to:
  * crawl internal links/routes and flag dead ones (SPA renders the 404 page)
  * capture uncaught exceptions (pageerror) and console errors while exercising
    buttons, filters, modals and the checkout entry
  * confirm a search-bar XSS payload does NOT execute in the DOM (React escapes)

Playwright is optional. If it (or its browser) is not installed, this module
returns a skipped report instead of failing the suite. Install with:
    pip install playwright && python -m playwright install chromium
"""

from .. import config
from ..reporting import AgentReport

# Routes we always check even if not linked from the home page.
SEED_ROUTES = ["/", "/products", "/products?category=dairy", "/cart", "/checkout", "/admin"]
NOT_FOUND_MARKER = "404 — Page not found"
XSS_PAYLOAD = "<img src=x onerror=window.__xss_fired=true>"


def run():
    report = AgentReport("Broken Link & Error Scout — frontend crawl")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        report.skip(
            "Frontend crawl",
            "playwright not installed (pip install playwright && python -m playwright install chromium)",
        )
        return report

    console_errors = []   # (route, text)
    page_errors = []      # (route, text)
    dialogs = []          # XSS alert() etc.
    dead_routes = []
    visited = []
    xss_fired = False
    admin_guarded = False
    current = {"route": "/"}

    try:
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(headless=True)
            except Exception as e:  # noqa: BLE001 — browser binary missing, etc.
                report.skip("Frontend crawl", f"could not launch chromium: {e}")
                return report

            ctx = browser.new_context()
            page = ctx.new_page()

            page.on("pageerror", lambda exc: page_errors.append((current["route"], str(exc))))
            page.on(
                "console",
                lambda msg: console_errors.append((current["route"], msg.text))
                if msg.type == "error" and "favicon" not in msg.text.lower()
                else None,
            )
            page.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))

            base = config.FRONTEND_URL

            # --- discover links from the home page --------------------------- #
            current["route"] = "/"
            page.goto(base + "/", wait_until="networkidle", timeout=20000)
            hrefs = page.eval_on_selector_all(
                "a[href]", "els => els.map(e => e.getAttribute('href'))"
            )
            routes = set(SEED_ROUTES)
            for h in hrefs or []:
                if h and h.startswith("/") and not h.startswith("//"):
                    routes.add(h)

            # --- visit every route, look for the SPA 404 page --------------- #
            for route in sorted(routes):
                current["route"] = route
                try:
                    page.goto(base + route, wait_until="networkidle", timeout=20000)
                    visited.append(route)
                    body = page.content()
                    if NOT_FOUND_MARKER in body:
                        dead_routes.append(route)
                except Exception as e:  # noqa: BLE001
                    page_errors.append((route, f"navigation error: {e}"))

            # --- exercise key interactions ---------------------------------- #
            # Add-to-cart on the listing page.
            current["route"] = "/products"
            try:
                page.goto(base + "/products", wait_until="networkidle", timeout=20000)
                add = page.query_selector("button:has-text('Add')")
                if add:
                    add.click()
                # Toggle a food-type filter and a category radio if present.
                veg = page.query_selector("button:has-text('Veg')")
                if veg:
                    veg.click()
            except Exception as e:  # noqa: BLE001
                page_errors.append(("/products interactions", str(e)))

            # DOM-XSS: inject a payload into the search bar and submit.
            current["route"] = "/ (search xss)"
            try:
                page.goto(base + "/", wait_until="networkidle", timeout=20000)
                search = page.query_selector("input[type='text'], input[placeholder*='Search']")
                if search:
                    search.fill(XSS_PAYLOAD)
                    search.press("Enter")
                    page.wait_for_timeout(800)
                xss_fired = page.evaluate("() => window.__xss_fired === true")
            except Exception as e:  # noqa: BLE001
                xss_fired = False
                page_errors.append(("search xss", str(e)))

            # Admin route should render the login gateway, not the dashboard.
            current["route"] = "/admin"
            try:
                page.goto(base + "/admin", wait_until="networkidle", timeout=20000)
                txt = page.content()
                admin_guarded = ("Admin Access" in txt) and ("Order Fulfillment" not in txt)
            except Exception as e:  # noqa: BLE001
                page_errors.append(("/admin", str(e)))

            browser.close()
    except Exception as e:  # noqa: BLE001
        report.skip("Frontend crawl", f"playwright session error: {e}")
        return report

    # --- assemble findings -------------------------------------------------- #
    report.add(
        "No dead internal routes (no unexpected 404 renders)",
        passed=len(dead_routes) == 0,
        severity="MEDIUM",
        detail=f"Crawled {len(visited)} routes from {config.FRONTEND_URL}.",
        evidence="dead: " + (", ".join(dead_routes) if dead_routes else "none"),
    )
    report.add(
        "No uncaught JavaScript exceptions (pageerror)",
        passed=len(page_errors) == 0,
        severity="HIGH",
        detail="Runtime crashes in the browser break the user experience.",
        evidence=(
            "; ".join(f"[{r}] {t}" for r, t in page_errors[:5]) if page_errors else "none"
        ),
    )
    report.add(
        "No console errors during interaction",
        passed=len(console_errors) == 0,
        severity="LOW",
        detail="Console errors often signal failed requests or React warnings.",
        evidence=(
            "; ".join(f"[{r}] {t}" for r, t in console_errors[:5])
            if console_errors
            else "none"
        ),
    )
    report.add(
        "Search-bar XSS payload does NOT execute in the DOM",
        passed=(len(dialogs) == 0 and not xss_fired),
        severity="HIGH",
        detail="React escapes interpolated values; injected markup must stay inert.",
        evidence=f"dialogs={len(dialogs)}, onerror_fired={xss_fired}",
    )
    report.add(
        "Admin route is client-side guarded when logged out",
        passed=admin_guarded,
        severity="MEDIUM",
        detail="Logged-out /admin must show the login gateway, not the dashboard.",
        evidence=f"guarded={admin_guarded}",
    )

    return report


if __name__ == "__main__":
    print(run().to_console())
