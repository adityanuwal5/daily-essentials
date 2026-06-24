# DailyEssentials — Autonomous Test-Agent Suite

Four specialized testing agents that probe the full stack (Django REST API +
React/Vite frontend), plus a one-command orchestrator. Each agent emits a
consistent pass/fail report; the orchestrator aggregates them into a single
verdict and a CI-friendly exit code.

## Folder structure

```
tests/
├── config.py            # env-driven targets & credentials
├── reporting.py         # shared Check/AgentReport model + console rendering
├── http_client.py       # login, tokens, user provisioning, re-seeding
├── run_all.py           # ── Test Orchestrator ──
├── requirements.txt
├── security/
│   └── pentest.py       # Agent 1 — Penetration Tester
├── qa/
│   ├── api_fuzz.py      # Agent 2a — API resilience (graceful 4xx, never 5xx)
│   └── crawl.py         # Agent 2b — Playwright crawl + runtime-error scout
├── auth/
│   └── auth_guard.py    # Agent 3 — Unauthorized Access Guard
└── load/
    └── load_test.py     # Agent 4 — Performance & Load Tester
```

A root `package.json` exposes the `npm run test:*` scripts.

## Prerequisites

1. **Backend running**: `python manage.py runserver` (→ http://localhost:8000)
2. **Frontend running** (only for Agent 2's browser crawl): `cd daily-essential-frontend && npm run dev` (→ http://localhost:5173)
3. **An admin account** exists (default creds `admin` / `Admin@12345`; override via env).

## Setup (one-time)

```bash
# Install the test dependencies (into the backend venv or any Python 3.9+):
pip install -r tests/requirements.txt

# For Agent 2's browser crawl, download the headless browser:
python -m playwright install chromium
```

…or simply: `npm run test:setup`

## Running

```bash
npm run test:all          # all four agents + consolidated verdict
npm run test:security     # Agent 1 only
npm run test:qa           # Agent 2 only
npm run test:auth         # Agent 3 only
npm run test:load         # Agent 4 only
```

Equivalent direct invocation (agents use package-relative imports, so run as a
module from the repo root):

```bash
python -m tests.run_all
python -m tests.run_all security auth     # subset
python -m tests.run_all --no-load          # skip the data-mutating load agent
```

**Configuration** (all optional env vars): `API_BASE_URL`, `FRONTEND_URL`,
`TEST_ADMIN_USER`, `TEST_ADMIN_PASS`, `TEST_CUSTOMER_USER`, `TEST_CUSTOMER_PASS`,
`TEST_LOAD_CONCURRENCY`, `NO_COLOR`.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All executed agents passed (no CRITICAL/HIGH findings) |
| 1 | At least one blocking finding — see the `[FAIL]` lines |
| 2 | Unknown agent name passed |
| 3 | Backend unreachable (start `runserver` first) |

Findings are graded `CRITICAL > HIGH > MEDIUM > LOW > INFO`. Only **CRITICAL**
and **HIGH** fail the suite; MEDIUM/LOW are advisory. `[SKIP]` means a check
couldn't run (e.g. browser not installed) and is excluded from scoring.

---

## How to interpret each agent

### Agent 1 — Penetration Tester (`security/`)
Probes auth-less writes, SQL injection, XSS, and cookie hardening. **Non-destructive** — it deletes anything it creates and verifies the catalog row count is unchanged.

- **Unauthenticated POST/PUT/DELETE rejected** — every result must be `401/403`. A `2xx` here is **critical**: an anonymous user is mutating data.
- **SQL injection neutralised** — payloads must not cause a `500`, must not return more rows than exist, and must not log anyone in. A failure means raw SQL is being built somewhere instead of using the ORM.
- **Reflected/Stored XSS** — the API must return `application/json` with payloads encoded as data. (DOM execution is verified separately by Agent 2.) React escapes on render, so stored payloads stay inert.
- **Refresh cookie HttpOnly / SameSite / Secure** — `HttpOnly` (critical) and `SameSite=Lax/Strict` (high) must be present. **`Secure` is expected to FAIL in local dev** (DEBUG omits it so cookies work over `http://`); it must be present in production (HTTPS). This MEDIUM finding is informational locally.

### Agent 2 — Broken Link & Error Scout (`qa/`)
Two halves merged into one report.

- **API resilience** (always runs): every endpoint is hit with invalid/missing data. Each must return a **graceful 4xx**. A `5xx` is the finding — an unhandled exception leaked to the client.
- **Frontend crawl** (needs the dev server + `playwright install chromium`; otherwise `[SKIP]`):
  - *No dead internal routes* — links/routes shouldn't render the 404 page unexpectedly.
  - *No uncaught JS exceptions* (high) — a `pageerror` is a runtime crash.
  - *No console errors* (low) — often failed requests or React warnings; triage before treating as blocking.
  - *Search XSS does not execute* (high) — confirms the payload stays inert in the DOM.
  - *Admin route guarded* — logged-out `/admin` shows the login gateway, not the dashboard.

### Agent 3 — Unauthorized Access Guard (`auth/`)
The real security perimeter is the API (the React route guard is cosmetic).

- **anon → 401/403** on every protected endpoint. Auto-provisions a standard
  `customer` account (via the Django ORM) to prove **RBAC**: a valid non-admin
  token must get `403` on `/api/admin/*` but `200` on its own `/auth/me/`.
- **bad/garbage token → 401** exercises the same rejection path as an expired
  access token. If the customer account can't be provisioned (backend venv not
  found), that sub-check `[SKIP]`s rather than failing.

### Agent 4 — Performance & Load Tester (`load/`)
**Mutates data**; the orchestrator re-seeds afterward (or run `python manage.py seed_db --flush`).

- **50 concurrent GET /products/** — reports success rate + p50/p95/max latency and throughput. Any timeout or `5xx` fails it.
- **Checkout consistency (CRITICAL)** — fires concurrent orders at one product, then asserts `final_stock == start - successful×qty` and never negative. This proves the `select_for_update` decrement is race-free. *This is the data-integrity check that must always pass.*
- **Concurrent checkouts without 5xx (HIGH)** — separate from consistency: did any request return a server error? After the WAL hardening below this passes (0/25 5xx). If you revert that fix, expect ~20/25 to return `database is locked` → `500`.

---

## SQLite concurrency hardening (applied)

Early runs surfaced one blocking finding — *concurrent checkouts returned 5xx*
under load — because the project ships on SQLite. The checkout logic was already
correct (stock never oversold); the issue was purely SQLite write contention.
The fix has two parts, both applied:

1. **Connection-level WAL + busy timeout.** `core/settings.py` sets
   `OPTIONS = {"timeout": 20}`, and `apps/products/apps.py` enables WAL on every
   new connection via the `connection_created` signal
   (`PRAGMA journal_mode=WAL; synchronous=NORMAL; busy_timeout=20000`).
   *Note: the `init_command` OPTION is Django 5.1+ only — this project runs 5.0,
   hence the signal.*

2. **Write-first transactions** (`apps/orders/views.py`). The checkout's
   `@transaction.atomic` block now issues the order `INSERT` *before* the
   `SELECT ... FOR UPDATE`. Starting with a write takes SQLite's write lock up
   front, so concurrent checkouts queue on the busy timeout instead of hitting
   the read→write lock-upgrade deadlock (which bypasses `busy_timeout` and
   raises `database is locked` immediately). WAL alone does **not** fix that
   pattern — this reorder is what makes all 25 concurrent orders succeed.

For high production write volume, PostgreSQL remains the recommended engine; the
ORM-only schema means swapping `DATABASES` requires no model changes.
