"""Shared result model + console reporting for all test agents.

Every agent produces an ``AgentReport`` made of ``Check`` results. A check that
``passed`` means the system behaved correctly/securely; a failed check is a
finding. Severity drives the orchestrator's exit code.
"""

import os
import sys
from dataclasses import dataclass, field
from typing import List

# Make output Windows-safe: force UTF-8 and never crash on an un-encodable char.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

# Severities that should fail the build when a check does NOT pass.
BLOCKING = {"CRITICAL", "HIGH"}

# ANSI colours — only when writing to a real terminal (clean ASCII in pipes/CI).
_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
_C = {
    "CRITICAL": "\033[41;97m",
    "HIGH": "\033[91m",
    "MEDIUM": "\033[93m",
    "LOW": "\033[94m",
    "INFO": "\033[90m",
    "PASS": "\033[92m",
    "RESET": "\033[0m",
    "BOLD": "\033[1m",
}
if not _COLOR:
    _C = {k: "" for k in _C}


@dataclass
class Check:
    name: str
    passed: bool
    severity: str = "MEDIUM"  # only meaningful when not passed
    detail: str = ""
    evidence: str = ""
    # When True the check could not be evaluated (e.g. server down, optional
    # dependency missing) and is excluded from pass/fail accounting.
    skipped: bool = False


@dataclass
class AgentReport:
    agent: str
    checks: List[Check] = field(default_factory=list)

    # --- builders --------------------------------------------------------- #
    def add(self, name, passed, severity="MEDIUM", detail="", evidence=""):
        self.checks.append(
            Check(name, passed, severity, detail, evidence)
        )

    def skip(self, name, detail=""):
        self.checks.append(Check(name, True, "INFO", detail, skipped=True))

    # --- accounting ------------------------------------------------------- #
    @property
    def evaluated(self):
        return [c for c in self.checks if not c.skipped]

    @property
    def failures(self):
        return [c for c in self.evaluated if not c.passed]

    @property
    def blocking_failures(self):
        return [c for c in self.failures if c.severity in BLOCKING]

    @property
    def passed(self):
        return len(self.blocking_failures) == 0

    # --- rendering -------------------------------------------------------- #
    def to_console(self):
        lines = []
        bar = "=" * 70
        lines.append(f"{_C['BOLD']}{bar}{_C['RESET']}")
        lines.append(f"{_C['BOLD']}  AGENT: {self.agent}{_C['RESET']}")
        lines.append(f"{_C['BOLD']}{bar}{_C['RESET']}")

        for c in self.checks:
            if c.skipped:
                tag = f"{_C['INFO']}[SKIP]{_C['RESET']}"
            elif c.passed:
                tag = f"{_C['PASS']}[PASS]{_C['RESET']}"
            else:
                col = _C.get(c.severity, "")
                tag = f"{col}[FAIL·{c.severity}]{_C['RESET']}"
            lines.append(f"  {tag} {c.name}")
            if c.detail:
                lines.append(f"         {c.detail}")
            if c.evidence:
                lines.append(f"         -> {c.evidence}")

        ev = self.evaluated
        passed_n = len([c for c in ev if c.passed])
        verdict = (
            f"{_C['PASS']}PASS{_C['RESET']}"
            if self.passed
            else f"{_C['HIGH']}FAIL{_C['RESET']}"
        )
        lines.append(
            f"  -- {passed_n}/{len(ev)} checks passed | "
            f"{len(self.blocking_failures)} blocking | verdict: {verdict}"
        )
        return "\n".join(lines)
