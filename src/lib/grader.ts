import type { CodingItem, McqItem, SqlItem } from "../types";
import { runPython } from "./pyodide";
import { runSql } from "./sqljs";

export function gradeMcq(item: McqItem, selectedIndex: number | null): boolean {
  return selectedIndex !== null && selectedIndex === item.answerIndex;
}

// ────────── Code grading via Pyodide ──────────

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

export async function gradeCoding(
  item: CodingItem,
  userCode: string,
): Promise<CodingGradeResult> {
  const tests: CodingTestResult[] = [];

  // Build the harness Python: user code + a JSON-driven test runner.
  const harness = `
import json, traceback
${userCode}

__cases = ${JSON.stringify(item.tests)}
__results = []
for __i, __c in enumerate(__cases):
    try:
        __got = ${item.entry}(*__c["args"])
        __results.append({"i": __i, "got": __got, "err": None})
    except Exception:
        __results.append({"i": __i, "got": None, "err": traceback.format_exc().splitlines()[-1]})
print("__RESULT__" + json.dumps(__results, default=str))
`;

  const exec = await runPython(harness);

  if (exec.error) {
    return {
      ok: false,
      passed: 0,
      total: item.tests.length,
      tests: item.tests.map((t, i) => ({
        index: i,
        args: t.args,
        expected: t.expect,
        actual: null,
        pass: false,
        error: exec.error,
      })),
      stderr: exec.stderr,
    };
  }

  const marker = exec.stdout.indexOf("__RESULT__");
  if (marker === -1) {
    return {
      ok: false,
      passed: 0,
      total: item.tests.length,
      tests: item.tests.map((t, i) => ({
        index: i,
        args: t.args,
        expected: t.expect,
        actual: null,
        pass: false,
        error: "Harness did not return results",
      })),
      stderr: exec.stderr,
    };
  }
  let parsed: { i: number; got: unknown; err: string | null }[];
  try {
    parsed = JSON.parse(exec.stdout.slice(marker + "__RESULT__".length));
  } catch (e) {
    return {
      ok: false,
      passed: 0,
      total: item.tests.length,
      tests: [],
      stderr: `Failed to parse harness result: ${String(e)}`,
    };
  }

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

function deepEqual(a: unknown, b: unknown): boolean {
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

// ────────── SQL grading via sql.js ──────────

export type SqlGradeResult = {
  ok: boolean;
  expected: { columns: string[]; rows: unknown[][] };
  actual: { columns: string[]; rows: unknown[][] } | null;
  error?: string;
};

export async function gradeSql(
  item: SqlItem,
  userQuery: string,
): Promise<SqlGradeResult> {
  try {
    const actual = await runSql(item.schema, userQuery);
    if (!actual) {
      return { ok: false, expected: item.expected, actual: null, error: "Query returned no result" };
    }
    const ok =
      actual.columns.length === item.expected.columns.length &&
      actual.columns.every((c, i) =>
        c.toLowerCase() === item.expected.columns[i].toLowerCase(),
      ) &&
      actual.rows.length === item.expected.rows.length &&
      actual.rows.every((row, i) =>
        row.length === item.expected.rows[i].length &&
        row.every((v, j) => normalize(v) === normalize(item.expected.rows[i][j])),
      );
    return { ok, expected: item.expected, actual };
  } catch (e) {
    return { ok: false, expected: item.expected, actual: null, error: String(e) };
  }
}

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}
