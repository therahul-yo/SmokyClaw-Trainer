// Pure grading semantics — no browser, Vite, or loader dependencies.
// Both the in-app grader (src/lib/grader.ts, via Pyodide/sql.js CDN builds)
// and Node tooling (scripts/validate-content.ts, vitest) run through these
// exact functions, so "passes in CI" and "passes in the app" cannot drift.

import type { CodingItem } from "../types";

export type PythonRunResult = {
  stdout: string;
  stderr: string;
  error?: string;
};

export type SqlRunResult = { columns: string[]; rows: unknown[][] } | null;

export type CodingTestResult = {
  index: number;
  args: unknown[];
  expected: unknown;
  actual: unknown;
  pass: boolean;
  error?: string;
};

export type CodingGradeResult = {
  ok: boolean;
  passed: number;
  total: number;
  tests: CodingTestResult[];
  stderr?: string;
};

const RESULT_MARKER = "__RESULT__";

// Build the harness Python: user code + a JSON-driven test runner.
// Generators/iterators are materialized to lists so generator-based
// solutions (e.g. `yield`-style drills) compare by value, not by repr.
//
// Test cases are embedded as a JSON *string* and parsed with json.loads —
// NOT spliced in as a Python literal — so JSON true/false/null become real
// Python True/False/None instead of NameErrors (e.g. boolean-returning
// drills like is-anagram, or null cells like [5, null]).
export function buildCodingHarness(item: CodingItem, userCode: string): string {
  return `
import json, traceback
import collections.abc as __abc
${userCode}

__cases = json.loads(${JSON.stringify(JSON.stringify(item.tests))})
__results = []
for __i, __c in enumerate(__cases):
    try:
        __got = ${item.entry}(*__c["args"])
        if isinstance(__got, __abc.Iterator):
            __got = list(__got)
        __results.append({"i": __i, "got": __got, "err": None})
    except Exception:
        __results.append({"i": __i, "got": None, "err": traceback.format_exc().splitlines()[-1]})
print("${RESULT_MARKER}" + json.dumps(__results, default=str))
`;
}

export function evaluateCodingRun(
  item: CodingItem,
  exec: PythonRunResult,
): CodingGradeResult {
  const failAll = (error: string): CodingGradeResult => ({
    ok: false,
    passed: 0,
    total: item.tests.length,
    tests: item.tests.map((t, i) => ({
      index: i,
      args: t.args,
      expected: t.expect,
      actual: null,
      pass: false,
      error,
    })),
    stderr: exec.stderr,
  });

  if (exec.error) return failAll(exec.error);

  const marker = exec.stdout.indexOf(RESULT_MARKER);
  if (marker === -1) return failAll("Harness did not return results");

  let parsed: { i: number; got: unknown; err: string | null }[];
  try {
    parsed = JSON.parse(exec.stdout.slice(marker + RESULT_MARKER.length));
  } catch (e) {
    return {
      ok: false,
      passed: 0,
      total: item.tests.length,
      tests: [],
      stderr: `Failed to parse harness result: ${String(e)}`,
    };
  }

  const tests: CodingTestResult[] = [];
  let passed = 0;
  for (let i = 0; i < item.tests.length; i += 1) {
    const t = item.tests[i];
    const r = parsed.find((p) => p.i === i);
    const got = r?.got ?? null;
    const err = r?.err ?? undefined;
    const ok = !err && deepEqual(got, t.expect);
    if (ok) passed += 1;
    tests.push({
      index: i,
      args: t.args,
      expected: t.expect,
      actual: got,
      pass: ok,
      error: err,
    });
  }

  return {
    ok: passed === item.tests.length,
    passed,
    total: item.tests.length,
    tests,
    stderr: exec.stderr,
  };
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    );
  }
  return false;
}

export function compareSqlResult(
  expected: { columns: string[]; rows: unknown[][] },
  actual: { columns: string[]; rows: unknown[][] },
): boolean {
  return (
    actual.columns.length === expected.columns.length &&
    actual.columns.every(
      (c, i) => c.toLowerCase() === expected.columns[i].toLowerCase(),
    ) &&
    actual.rows.length === expected.rows.length &&
    actual.rows.every(
      (row, i) =>
        row.length === expected.rows[i].length &&
        row.every((v, j) => normalizeSqlValue(v) === normalizeSqlValue(expected.rows[i][j])),
    )
  );
}

function normalizeSqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}
