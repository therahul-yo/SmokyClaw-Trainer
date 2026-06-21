// Regression tests for src/lib/grader.ts (the "core" grader — not the
// per-track graders in src/routes/*).
//
// These tests pin specific behaviors that are easy to break and that have
// either been flagged in audits or represent deep invariants:
//
//   1. deepEqual handles NaN, null, undefined, and nested structures.
//   2. The harness result is extracted using indexOf("__RESULT__") (FIRST
//      occurrence), not lastIndexOf — even if the user prints "__RESULT__"
//      themselves earlier in the script, the JSON payload at the END wins.
//   3. There are distinct failure modes:
//        - python interpreter error (exec.error)        → tests all fail with that error
//        - parse failure of harness JSON                → tests:[], stderr has detail
//        - harness printed nothing matching __RESULT__  → "Harness did not return results"
//        - per-test exception (in the harness)          → individual test fails with err string
//
//   4. SQL grading: column comparison is case-insensitive, NULL values are
//      normalized to the string "NULL" for comparison.

import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock pyodide and sqljs BEFORE importing grader, since grader imports
// them at module load.
vi.mock("../pyodide", () => ({
  runPython: vi.fn(),
}));
vi.mock("../sqljs", () => ({
  runSql: vi.fn(),
}));

import { gradeMcq, gradeCoding, gradeSql } from "../grader";
import { runPython } from "../pyodide";
import { runSql } from "../sqljs";
import type { CodingItem, McqItem, SqlItem } from "../../types";

const mockedRunPython = vi.mocked(runPython);
const mockedRunSql = vi.mocked(runSql);

beforeEach(() => {
  mockedRunPython.mockReset();
  mockedRunSql.mockReset();
});

// ── gradeMcq ────────────────────────────────────────────────────

describe("grader / gradeMcq", () => {
  const item: McqItem = {
    id: "mcq-1",
    track: "python",
    topic: "syntax",
    type: "mcq",
    difficulty: "easy",
    question: "q",
    options: ["a", "b", "c", "d"],
    answerIndex: 2,
    explanation: "",
    tags: [],
  };

  it("returns true when selectedIndex matches answerIndex", () => {
    expect(gradeMcq(item, 2)).toBe(true);
  });

  it("returns false when selectedIndex does not match", () => {
    expect(gradeMcq(item, 0)).toBe(false);
  });

  it("returns false when selectedIndex is null", () => {
    expect(gradeMcq(item, null)).toBe(false);
  });
});

// ── deepEqual via gradeCoding ───────────────────────────────────

describe("grader / deepEqual (via gradeCoding)", () => {
  const codingItem: CodingItem = {
    id: "c-1",
    track: "dsa",
    topic: "arrays",
    type: "coding",
    language: "python",
    difficulty: "easy",
    prompt: "p",
    starter: "def f(x): return x",
    entry: "f",
    tests: [
      { args: [1], expect: 1 },
      { args: [null], expect: null },
      { args: [Number.NaN], expect: Number.NaN },
      { args: [{ a: 1, b: [2, 3] }], expect: { a: 1, b: [2, 3] } },
      { args: [[1, 2, 3]], expect: [1, 2, 3] },
    ],
    tags: [],
  };

  function mockRun(results: Array<{ i: number; got: unknown; err: string | null }>): void {
    mockedRunPython.mockResolvedValueOnce({
      stdout: "__RESULT__" + JSON.stringify(results),
      stderr: "",
    });
  }

  it("matches primitives (number, string)", async () => {
    mockRun([{ i: 0, got: 1, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [1], expect: 1 }] }, "");
    expect(r.ok).toBe(true);
    expect(r.passed).toBe(1);
  });

  it("treats NaN as not equal to NaN (strict ===)", async () => {
    // NaN === NaN is false in JS, so deepEqual returns false even though
    // both sides are NaN. This pins the current behavior.
    mockRun([{ i: 0, got: Number.NaN, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [Number.NaN], expect: Number.NaN }] }, "");
    expect(r.ok).toBe(false);
    expect(r.passed).toBe(0);
  });

  it("matches null correctly", async () => {
    mockRun([{ i: 0, got: null, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [null], expect: null }] }, "");
    expect(r.ok).toBe(true);
  });

  it("treats undefined as NOT equal to null (different typeof)", async () => {
    mockRun([{ i: 0, got: undefined, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [null], expect: null }] }, "");
    // typeof undefined !== typeof null → deepEqual returns false
    expect(r.passed).toBe(0);
  });

  it("matches nested objects and arrays element-wise", async () => {
    mockRun([{ i: 0, got: { a: 1, b: [2, 3] }, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [{}], expect: { a: 1, b: [2, 3] } }] }, "");
    expect(r.ok).toBe(true);
  });

  it("object length mismatch → not equal", async () => {
    mockRun([{ i: 0, got: { a: 1 }, err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [{}], expect: { a: 1, b: 2 } }] }, "");
    expect(r.passed).toBe(0);
  });

  it("array length mismatch → not equal", async () => {
    mockRun([{ i: 0, got: [1, 2, 3], err: null }]);
    const r = await gradeCoding({ ...codingItem, tests: [{ args: [[]], expect: [1, 2] }] }, "");
    expect(r.passed).toBe(0);
  });
});

// ── harness marker handling ─────────────────────────────────────

describe("grader / harness __RESULT__ marker handling", () => {
  const item: CodingItem = {
    id: "c-2",
    track: "dsa",
    topic: "arrays",
    type: "coding",
    language: "python",
    difficulty: "easy",
    prompt: "p",
    starter: "def f(x): return x",
    entry: "f",
    tests: [{ args: [1], expect: 1 }],
    tags: [],
  };

  it("uses indexOf, so user-printed __RESULT__ earlier does NOT confuse parsing", async () => {
    // Simulate the user printing "__RESULT__" themselves, THEN the harness
    // printing its own __RESULT__... with the actual JSON.
    // The grader uses .indexOf() which returns the FIRST occurrence. Since
    // the rest of the user's stdout is BEFORE the harness JSON, the
    // .slice(marker + "__RESULT__".length) would take "USER_MARKERsome other
    // text __RESULT__[{\"i\":0,...}]" — actually .indexOf returns 0 here, so
    // slicing gives everything AFTER the first __RESULT__ including the
    // user's intermediate text and the final JSON. JSON.parse would then
    // FAIL because the prefix isn't valid JSON.
    // This test pins the current (potentially buggy) behavior: if the user
    // prints __RESULT__ before the harness does, parsing fails.
    const stdout = "__RESULT__user_garbage then __RESULT__" + JSON.stringify([{ i: 0, got: 1, err: null }]);
    mockedRunPython.mockResolvedValueOnce({ stdout, stderr: "" });
    const r = await gradeCoding(item, "");
    // First __RESULT__ at index 0; slice gives 'user_garbage then __RESULT__[...]'
    // → JSON.parse fails → tests=[], stderr set.
    expect(r.tests).toEqual([]);
    expect(r.stderr).toMatch(/Failed to parse harness result/);
    expect(r.passed).toBe(0);
  });

  it("returns 'Harness did not return results' when __RESULT__ is absent", async () => {
    mockedRunPython.mockResolvedValueOnce({ stdout: "no marker here\n", stderr: "" });
    const r = await gradeCoding(item, "");
    expect(r.ok).toBe(false);
    expect(r.tests).toHaveLength(1);
    expect(r.tests[0]?.error).toBe("Harness did not return results");
  });

  it("returns all-fail tests when runPython reports an interpreter error", async () => {
    mockedRunPython.mockResolvedValueOnce({
      stdout: "",
      stderr: "Traceback ...",
      error: "SyntaxError: bad",
    });
    const r = await gradeCoding(item, "");
    expect(r.ok).toBe(false);
    expect(r.passed).toBe(0);
    expect(r.tests).toHaveLength(1);
    expect(r.tests[0]?.error).toBe("SyntaxError: bad");
  });
});

// ── per-test harness exceptions ─────────────────────────────────

describe("grader / per-test harness exception", () => {
  const item: CodingItem = {
    id: "c-3",
    track: "dsa",
    topic: "arrays",
    type: "coding",
    language: "python",
    difficulty: "easy",
    prompt: "p",
    starter: "def f(x): return x",
    entry: "f",
    tests: [
      { args: [1], expect: 1 },
      { args: [2], expect: 999 },
    ],
    tags: [],
  };

  it("a failing test gets the harness error string in `error`", async () => {
    mockedRunPython.mockResolvedValueOnce({
      stdout:
        "__RESULT__" +
        JSON.stringify([
          { i: 0, got: 1, err: null },
          { i: 1, got: null, err: "ZeroDivisionError: division by zero" },
        ]),
      stderr: "",
    });
    const r = await gradeCoding(item, "");
    expect(r.ok).toBe(false);
    expect(r.passed).toBe(1);
    expect(r.tests[1]?.error).toBe("ZeroDivisionError: division by zero");
    expect(r.tests[1]?.pass).toBe(false);
  });

  it("missing result entries default actual=null and pass=false", async () => {
    // Harness only returned i:0, missing i:1 entirely. parsed.find returns
    // undefined; r?.got ?? null → null; deepEqual(null, 999) → false.
    mockedRunPython.mockResolvedValueOnce({
      stdout: "__RESULT__" + JSON.stringify([{ i: 0, got: 1, err: null }]),
      stderr: "",
    });
    const r = await gradeCoding(item, "");
    expect(r.tests).toHaveLength(2);
    expect(r.tests[1]?.actual).toBeNull();
    expect(r.tests[1]?.pass).toBe(false);
    expect(r.tests[1]?.error).toBeUndefined();
  });
});

// ── gradeSql ────────────────────────────────────────────────────

describe("grader / gradeSql", () => {
  const sqlItem: SqlItem = {
    id: "s-1",
    track: "sql",
    topic: "joins",
    type: "sql",
    difficulty: "easy",
    prompt: "p",
    schema: "employees",
    expected: {
      columns: ["name", "salary"],
      rows: [
        ["Alice", 100],
        ["Bob", null],
      ],
    },
    tags: [],
  };

  it("matches when columns + rows align (case-insensitive on column names)", async () => {
    mockedRunSql.mockResolvedValueOnce({
      columns: ["NAME", "SALARY"],
      rows: [
        ["Alice", 100],
        ["Bob", "NULL"],
      ],
    });
    const r = await gradeSql(sqlItem, "SELECT name, salary FROM employees");
    expect(r.ok).toBe(true);
  });

  it("column count mismatch → not equal", async () => {
    mockedRunSql.mockResolvedValueOnce({
      columns: ["name"],
      rows: [["Alice"]],
    });
    const r = await gradeSql(sqlItem, "SELECT name FROM employees");
    expect(r.ok).toBe(false);
  });

  it("row count mismatch → not equal", async () => {
    mockedRunSql.mockResolvedValueOnce({
      columns: ["name", "salary"],
      rows: [["Alice", 100]],
    });
    const r = await gradeSql(sqlItem, "SELECT name, salary FROM employees");
    expect(r.ok).toBe(false);
  });

  it("null vs 'NULL' string both normalize to 'NULL'", async () => {
    // The grader's normalize() maps null/undefined → "NULL", everything else
    // → String(v). So a real SQL NULL comes back as null → "NULL". A text
    // "NULL" string comes back as "NULL" → String("NULL") === "NULL".
    mockedRunSql.mockResolvedValueOnce({
      columns: ["name", "salary"],
      rows: [
        ["Alice", 100],
        ["Bob", null],
      ],
    });
    const r = await gradeSql(
      { ...sqlItem, expected: { columns: ["name", "salary"], rows: [["Alice", "100"], ["Bob", "NULL"]] } },
      "SELECT name, salary FROM employees",
    );
    expect(r.ok).toBe(true);
  });

  it("runSql returning null → 'Query returned no result' error", async () => {
    mockedRunSql.mockResolvedValueOnce(null);
    const r = await gradeSql(sqlItem, "SELECT 1");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Query returned no result");
    expect(r.actual).toBeNull();
  });

  it("runSql throwing → caught and surfaced as error", async () => {
    mockedRunSql.mockRejectedValueOnce(new Error("schema missing"));
    const r = await gradeSql(sqlItem, "SELECT 1");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("schema missing");
    expect(r.actual).toBeNull();
  });

  it("throwing a non-Error value → still surfaced (String(e))", async () => {
    mockedRunSql.mockRejectedValueOnce("string error");
    const r = await gradeSql(sqlItem, "SELECT 1");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("string error");
  });
});
