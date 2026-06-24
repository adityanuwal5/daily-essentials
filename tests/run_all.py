"""Test Orchestrator — run the full DailyEssentials agent suite.

Run as a module (the agents use package-relative imports):

    python -m tests.run_all                 # run everything
    python -m tests.run_all security auth   # run only named agents
    python -m tests.run_all --no-load       # skip the mutating load agent

Or via npm from the repo root:  npm run test:all

Exit code is 0 only if every executed agent passes (no blocking findings), so
the suite is CI-friendly. The load agent mutates data, so the orchestrator
re-seeds the catalog afterwards.
"""

import sys

from . import config, http_client
from .reporting import _C

AGENTS = {
    "security": ("Penetration Tester", lambda: _import("security.pentest").run()),
    "qa": ("Broken Link & Error Scout", lambda: _run_qa()),
    "auth": ("Unauthorized Access Guard", lambda: _import("auth.auth_guard").run()),
    "load": ("Performance & Load Tester", lambda: _import("load.load_test").run()),
}


def _import(modpath):
    import importlib

    return importlib.import_module(f"tests.{modpath}")


def _run_qa():
    """Agent 2 = API fuzzing + (optional) Playwright crawl, merged into one report."""
    from .reporting import AgentReport

    api = _import("qa.api_fuzz").run()
    crawl = _import("qa.crawl").run()
    merged = AgentReport("Broken Link & Error Scout (Reliability)")
    merged.checks = api.checks + crawl.checks
    return merged


def main(argv):
    selected = [a for a in argv if not a.startswith("-")]
    flags = [a for a in argv if a.startswith("-")]
    run_load = "--no-load" not in flags

    to_run = selected or list(AGENTS)
    unknown = [a for a in to_run if a not in AGENTS]
    if unknown:
        print(f"Unknown agent(s): {unknown}. Choose from {list(AGENTS)}")
        return 2

    print(f"{_C['BOLD']}DailyEssentials — Autonomous Test Suite{_C['RESET']}")
    print(f"  API      : {config.API_BASE}")
    print(f"  Frontend : {config.FRONTEND_URL}\n")

    # Pre-flight: the backend must be reachable for any agent to be meaningful.
    if not http_client.server_up():
        print(
            f"{_C['HIGH']}[X] Backend not reachable at {config.API_BASE}.{_C['RESET']}\n"
            f"  Start it with:  python manage.py runserver\n"
        )
        return 3
    if not http_client.frontend_up():
        print(
            f"{_C['MEDIUM']}[!] Frontend not reachable at {config.FRONTEND_URL} - "
            f"the crawl portion of the QA agent will skip.{_C['RESET']}\n"
        )

    reports = []
    for key in to_run:
        if key == "load" and not run_load:
            continue
        name, runner = AGENTS[key]
        print(f"{_C['BOLD']}> Running {name}...{_C['RESET']}")
        try:
            report = runner()
        except Exception as e:  # noqa: BLE001 — never let one agent kill the run
            print(f"  {_C['HIGH']}agent crashed: {e}{_C['RESET']}")
            continue
        reports.append(report)
        print(report.to_console())
        print()

    # The load agent mutated data — restore the seeded catalog.
    if "load" in to_run and run_load:
        ok = http_client.reseed_database()
        print(
            f"  {'(database re-seeded)' if ok else '[!] could not re-seed (run: python manage.py seed_db --flush)'}\n"
        )

    # --- consolidated verdict --------------------------------------------- #
    bar = "=" * 70
    print(f"{_C['BOLD']}{bar}{_C['RESET']}")
    print(f"{_C['BOLD']}  SUITE SUMMARY{_C['RESET']}")
    print(f"{_C['BOLD']}{bar}{_C['RESET']}")

    total_block = 0
    for r in reports:
        verdict = (
            f"{_C['PASS']}PASS{_C['RESET']}"
            if r.passed
            else f"{_C['HIGH']}FAIL ({len(r.blocking_failures)} blocking){_C['RESET']}"
        )
        ev = r.evaluated
        passed_n = len([c for c in ev if c.passed])
        print(f"  {verdict:<22} {r.agent}  ({passed_n}/{len(ev)} checks)")
        total_block += len(r.blocking_failures)

    overall = total_block == 0
    print()
    if overall:
        print(f"{_C['PASS']}{_C['BOLD']}[OK] ALL AGENTS PASSED - no blocking findings.{_C['RESET']}")
    else:
        print(
            f"{_C['HIGH']}{_C['BOLD']}[X] {total_block} blocking finding(s) across the suite. "
            f"See [FAIL] lines above.{_C['RESET']}"
        )
    return 0 if overall else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
