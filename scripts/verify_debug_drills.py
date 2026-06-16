#!/usr/bin/env python3
"""Ground-truth check for debugging drills.

The content validator (`pnpm validate`) only executes each item's `optimal.code`.
For a debugging drill that is not enough: we must also confirm the buggy `starter`
genuinely fails at least one test (otherwise there is no bug to find). This script
replicates the in-app grader harness (graderCore.ts: buildCodingHarness + deepEqual,
including orderInsensitive) and asserts, for every item in debugging-drills.json:

  * optimal.code  passes ALL tests, and
  * starter       fails AT LEAST ONE test.

Pure-CPython execution is faithful here because these drills use only the stdlib;
the in-browser Pyodide build and the validator's npm-pyodide build run the same code.
"""
import json
import sys
import traceback
from pathlib import Path

PACK = Path(__file__).resolve().parent.parent / "src/data/quizzes/debugging-drills.json"


def canon(v):
    """Round-trip through JSON the way the grader does (json.dumps default=str)."""
    return json.loads(json.dumps(v, default=str))


def deep_equal(a, b, order_insensitive=False):
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return False
        if order_insensitive:
            ka = sorted(a, key=lambda x: json.dumps(x, sort_keys=True))
            kb = sorted(b, key=lambda x: json.dumps(x, sort_keys=True))
            return all(deep_equal(x, y, order_insensitive) for x, y in zip(ka, kb))
        return all(deep_equal(x, y, order_insensitive) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        if set(a) != set(b):
            return False
        return all(deep_equal(a[k], b[k], order_insensitive) for k in a)
    # Number-aware: 1 == 1.0 (mirrors JS ===-after-Number semantics in the grader).
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) \
            and not isinstance(a, bool) and not isinstance(b, bool):
        return a == b
    return a == b


def run_candidate(code, entry, tests):
    """Return list of bools: did each test pass?

    Mirrors buildCodingHarness exactly: the user code (function) is defined ONCE
    and then called for every test case in the SAME namespace. This is essential
    for bugs that only manifest across calls (e.g. a mutable default argument that
    accumulates state). Each case's args are freshly parsed from JSON so the
    arguments themselves are independent objects, just as the harness does.
    """
    import collections.abc as abc
    ns = {}
    try:
        exec(code, ns)
    except Exception:
        return [False] * len(tests)
    results = []
    for t in tests:
        try:
            got = ns[entry](*[json.loads(json.dumps(a)) for a in t["args"]])
            if isinstance(got, abc.Iterator):
                got = list(got)
            got = canon(got)
            results.append(deep_equal(got, t["expect"], t.get("orderInsensitive", False)))
        except Exception:
            results.append(False)
    return results


def main():
    items = json.loads(PACK.read_text())
    failures = []
    for it in items:
        iid = it["id"]
        entry = it["entry"]
        tests = it["tests"]
        opt = it["optimal"]["code"]
        starter = it["starter"]

        opt_pass = run_candidate(opt, entry, tests)
        bug_pass = run_candidate(starter, entry, tests)

        opt_ok = all(opt_pass)
        bug_breaks = not all(bug_pass)

        status = "OK" if (opt_ok and bug_breaks) else "BAD"
        print(f"[{status}] {iid:32s} optimal {sum(opt_pass)}/{len(tests)} pass | "
              f"buggy {sum(bug_pass)}/{len(tests)} pass")

        if not opt_ok:
            failures.append(f"{iid}: optimal.code FAILS {len(tests) - sum(opt_pass)}/{len(tests)} tests")
        if not bug_breaks:
            failures.append(f"{iid}: buggy starter PASSES all tests — no real bug to find")

    print()
    if failures:
        print("FAIL:")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print(f"PASS: {len(items)} debugging drills verified "
          f"(optimal passes all; buggy starter fails ≥1).")


if __name__ == "__main__":
    main()
