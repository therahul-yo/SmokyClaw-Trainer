import { describe, expect, it } from "vitest";
import type { CodingItem } from "../../types";
import {
  buildCodingHarness,
  compareSqlResult,
  deepEqual,
  evaluateCodingRun,
} from "../graderCore";

const item: CodingItem = {
  id: "t-1",
  track: "dsa",
  topic: "arrays",
  type: "coding",
  language: "python",
  difficulty: "easy",
  prompt: "p",
  starter: "def f(x):\n    pass\n",
  entry: "f",
  tests: [
    { args: [1], expect: 2 },
    { args: [2], expect: 4 },
  ],
  tags: [],
};

describe("deepEqual", () => {
  it("compares primitives, arrays, and objects structurally", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(1, "1")).toBe(false);
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual({ a: 1, b: [2] }, { a: 1, b: [2] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, 0)).toBe(false);
  });

  it("compares arrays as multisets when orderInsensitive is set", () => {
    expect(deepEqual([1, 2, 3], [3, 1, 2], true)).toBe(true);
    expect(deepEqual([1, 2, 2], [2, 1, 2], true)).toBe(true);
    expect(deepEqual([1, 2, 2], [1, 1, 2], true)).toBe(false); // multiset, not set
    // nested order-insensitivity threads recursively
    expect(deepEqual([[2, 1], [3]], [[3], [1, 2]], true)).toBe(true);
    // still length-strict and value-strict
    expect(deepEqual([1, 2], [1, 2, 3], true)).toBe(false);
  });
});

describe("buildCodingHarness", () => {
  it("embeds the user code, entry point, and test cases", () => {
    const harness = buildCodingHarness(item, "def f(x):\n    return 2 * x");
    expect(harness).toContain("def f(x):");
    expect(harness).toContain("f(*__c[\"args\"])");
    // Tests are embedded as a json.loads'd string, not a raw Python literal.
    expect(harness).toContain("json.loads(");
    expect(harness).toContain(JSON.stringify(JSON.stringify(item.tests)));
  });

  it("parses JSON booleans/null via json.loads, not as bare Python names", () => {
    const boolItem: CodingItem = {
      ...item,
      tests: [{ args: ["abc", "cba"], expect: true }, { args: ["a", "b"], expect: false }],
    };
    const harness = buildCodingHarness(boolItem, "def f(a, b): return sorted(a) == sorted(b)");
    // The embedded payload must NOT contain a bare `true`/`false` token that
    // Python would try to resolve as a name — they live inside a JSON string.
    expect(harness).not.toMatch(/__cases = \[/);
    expect(harness).toContain("json.loads(");
  });

  it("materializes generators before comparing", () => {
    const harness = buildCodingHarness(item, "code");
    expect(harness).toContain("isinstance(__got, __abc.Iterator)");
    expect(harness).toContain("__got = list(__got)");
  });
});

describe("evaluateCodingRun", () => {
  const stdoutFor = (results: { i: number; got: unknown; err: string | null }[]) =>
    `__RESULT__${JSON.stringify(results)}`;

  it("passes when all results match", () => {
    const res = evaluateCodingRun(item, {
      stdout: stdoutFor([
        { i: 0, got: 2, err: null },
        { i: 1, got: 4, err: null },
      ]),
      stderr: "",
    });
    expect(res.ok).toBe(true);
    expect(res.passed).toBe(2);
  });

  it("fails mismatched results and reports actual values", () => {
    const res = evaluateCodingRun(item, {
      stdout: stdoutFor([
        { i: 0, got: 2, err: null },
        { i: 1, got: 5, err: null },
      ]),
      stderr: "",
    });
    expect(res.ok).toBe(false);
    expect(res.passed).toBe(1);
    expect(res.tests[1].actual).toBe(5);
  });

  it("treats per-test python errors as failures", () => {
    const res = evaluateCodingRun(item, {
      stdout: stdoutFor([
        { i: 0, got: null, err: "NameError: g" },
        { i: 1, got: 4, err: null },
      ]),
      stderr: "",
    });
    expect(res.ok).toBe(false);
    expect(res.tests[0].error).toContain("NameError");
  });

  it("fails everything on interpreter-level errors", () => {
    const res = evaluateCodingRun(item, {
      stdout: "",
      stderr: "boom",
      error: "SyntaxError",
    });
    expect(res.ok).toBe(false);
    expect(res.passed).toBe(0);
    expect(res.tests).toHaveLength(2);
  });

  it("fails when the marker never appears (e.g. infinite print loop output)", () => {
    const res = evaluateCodingRun(item, { stdout: "hello", stderr: "" });
    expect(res.ok).toBe(false);
    expect(res.tests[0].error).toContain("did not return results");
  });

  it("ignores user prints before the marker", () => {
    const res = evaluateCodingRun(item, {
      stdout:
        "debug noise\n" +
        stdoutFor([
          { i: 0, got: 2, err: null },
          { i: 1, got: 4, err: null },
        ]),
      stderr: "",
    });
    expect(res.ok).toBe(true);
  });
});

describe("compareSqlResult", () => {
  const expected = { columns: ["name"], rows: [["Carol"], ["Alice"]] };

  it("matches identical results, case-insensitive on column names", () => {
    expect(
      compareSqlResult(expected, { columns: ["NAME"], rows: [["Carol"], ["Alice"]] }),
    ).toBe(true);
  });

  it("is order-sensitive on rows", () => {
    expect(
      compareSqlResult(expected, { columns: ["name"], rows: [["Alice"], ["Carol"]] }),
    ).toBe(false);
  });

  it("rejects extra or missing rows and columns", () => {
    expect(compareSqlResult(expected, { columns: ["name"], rows: [["Carol"]] })).toBe(false);
    expect(
      compareSqlResult(expected, {
        columns: ["name", "salary"],
        rows: [["Carol", 1], ["Alice", 2]],
      }),
    ).toBe(false);
  });

  it("normalizes NULLs and stringifies values", () => {
    expect(
      compareSqlResult(
        { columns: ["x"], rows: [[null], [1]] },
        { columns: ["x"], rows: [[null], ["1"]] },
      ),
    ).toBe(true);
  });

  it("compares numeric cells by value (1.0 === 1, '01' === 1)", () => {
    expect(
      compareSqlResult(
        { columns: ["avg"], rows: [[1.0]] },
        { columns: ["avg"], rows: [["1"]] },
      ),
    ).toBe(true);
    expect(
      compareSqlResult(
        { columns: ["n"], rows: [[1]] },
        { columns: ["n"], rows: [["01"]] },
      ),
    ).toBe(true);
    // genuinely different numbers still fail
    expect(
      compareSqlResult(
        { columns: ["n"], rows: [[1]] },
        { columns: ["n"], rows: [[2]] },
      ),
    ).toBe(false);
    // text that isn't numeric is not coerced
    expect(
      compareSqlResult(
        { columns: ["s"], rows: [["alice"]] },
        { columns: ["s"], rows: [["Alice"]] },
      ),
    ).toBe(false);
  });

  it("matches unordered rows when orderInsensitive is set", () => {
    expect(
      compareSqlResult(expected, { columns: ["name"], rows: [["Alice"], ["Carol"]] }, {
        orderInsensitive: true,
      }),
    ).toBe(true);
    // still rejects a genuinely different set
    expect(
      compareSqlResult(expected, { columns: ["name"], rows: [["Alice"], ["Bob"]] }, {
        orderInsensitive: true,
      }),
    ).toBe(false);
  });
});
