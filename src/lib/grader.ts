import type { CodingItem, McqItem, SqlItem, SqlSchemaName } from "../types";
import { runPython } from "./pyodide";
import { runSql } from "./sqljs";
import {
  buildCodingHarness,
  compareSqlResult,
  evaluateCodingRun,
  type CodingGradeResult,
  type PythonRunResult,
  type SqlRunResult,
} from "./graderCore";

export type { CodingGradeResult, CodingTestResult } from "./graderCore";
export { deepEqual } from "./graderCore";

// Runner indirection lets Node-side tooling (vitest, scripts/validate-content)
// grade with the exact same semantics using the npm pyodide/sql.js builds.
export type PythonRunner = (code: string) => Promise<PythonRunResult>;
export type SqlRunner = (
  schema: SqlSchemaName,
  query: string,
) => Promise<SqlRunResult>;

export function gradeMcq(item: McqItem, selectedIndex: number | null): boolean {
  return selectedIndex !== null && selectedIndex === item.answerIndex;
}

// ────────── Code grading via Pyodide ──────────

export async function gradeCoding(
  item: CodingItem,
  userCode: string,
  runner: PythonRunner = runPython,
): Promise<CodingGradeResult> {
  const exec = await runner(buildCodingHarness(item, userCode));
  return evaluateCodingRun(item, exec);
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
  runner: SqlRunner = runSql,
): Promise<SqlGradeResult> {
  try {
    const actual = await runner(item.schema, userQuery);
    if (!actual) {
      return { ok: false, expected: item.expected, actual: null, error: "Query returned no result" };
    }
    const ok = compareSqlResult(item.expected, actual, {
      orderInsensitive: item.orderInsensitive ?? false,
    });
    return { ok, expected: item.expected, actual };
  } catch (e) {
    return { ok: false, expected: item.expected, actual: null, error: String(e) };
  }
}
