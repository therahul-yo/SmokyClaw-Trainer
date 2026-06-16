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
    const ok = !err && deepEqual(got, t.expect, t.orderInsensitive ?? false);
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

// Structural deep-equality. When `orderInsensitive` is true, arrays compare as
// multisets (element order ignored) — for drills like "return the subsets" or
// "group the anagrams" where any ordering of the result is correct. The flag
// threads recursively, so nested arrays are also compared order-insensitively.
export function deepEqual(
  a: unknown,
  b: unknown,
  orderInsensitive = false,
): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (orderInsensitive) {
      // Sort both by a stable serialization, then compare pairwise. Equal
      // multisets sort to the same sequence, so a positional compare suffices.
      const key = (x: unknown) => JSON.stringify(x);
      const sa = [...a].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
      const sb = [...b].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
      return sa.every((v, i) => deepEqual(v, sb[i], orderInsensitive));
    }
    return a.every((v, i) => deepEqual(v, b[i], orderInsensitive));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
        orderInsensitive,
      ),
    );
  }
  return false;
}

export function compareSqlResult(
  expected: { columns: string[]; rows: unknown[][] },
  actual: { columns: string[]; rows: unknown[][] },
  opts: { orderInsensitive?: boolean } = {},
): boolean {
  if (actual.columns.length !== expected.columns.length) return false;
  if (
    !actual.columns.every(
      (c, i) => c.toLowerCase() === expected.columns[i].toLowerCase(),
    )
  ) {
    return false;
  }
  if (actual.rows.length !== expected.rows.length) return false;

  // When the reference query has no deterministic ORDER BY, compare row sets
  // independent of order: sort both by a stable serialization, then line up.
  let expRows = expected.rows;
  let actRows = actual.rows;
  if (opts.orderInsensitive) {
    const rowKey = (row: unknown[]) =>
      JSON.stringify(row.map(normalizeSqlValue));
    const byKey = (x: unknown[], y: unknown[]) => {
      const kx = rowKey(x);
      const ky = rowKey(y);
      return kx < ky ? -1 : kx > ky ? 1 : 0;
    };
    expRows = [...expected.rows].sort(byKey);
    actRows = [...actual.rows].sort(byKey);
  }

  return actRows.every(
    (row, i) =>
      row.length === expRows[i].length &&
      row.every((v, j) => cellsEqual(v, expRows[i][j])),
  );
}

function normalizeSqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}

// Numeric-aware cell comparison: if BOTH cells parse as finite numbers, compare
// numerically so `1.0 === 1` and `'01' === 1` (sql.js may return a numeric
// literal where the reference produced a string, or vice versa). Otherwise fall
// back to the NULL-normalized string compare (keeps text/NULL semantics exact).
function cellsEqual(a: unknown, b: unknown): boolean {
  const sa = normalizeSqlValue(a);
  const sb = normalizeSqlValue(b);
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (sa.trim() !== "" && sb.trim() !== "" && Number.isFinite(na) && Number.isFinite(nb)) {
    return na === nb;
  }
  return false;
}
