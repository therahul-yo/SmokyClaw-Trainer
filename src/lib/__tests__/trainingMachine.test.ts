import { describe, expect, it } from "vitest";
import type { CodingItem, McqItem, SqlItem } from "../../types";
import { inferTrainingStage } from "../trainingMachine";

function coding(topic: string, difficulty: CodingItem["difficulty"]): CodingItem {
  return {
    id: `c-${topic}`,
    track: "dsa",
    topic,
    type: "coding",
    language: "python",
    difficulty,
    prompt: "p",
    starter: "s",
    entry: "f",
    tests: [],
    tags: [],
  };
}

function sql(topic: string, difficulty: SqlItem["difficulty"]): SqlItem {
  return {
    id: `s-${topic}`,
    track: "sql",
    topic,
    type: "sql",
    difficulty,
    prompt: "p",
    schema: "employees",
    expected: { columns: [], rows: [] },
    tags: [],
  };
}

function apt(difficulty: McqItem["difficulty"], topic = "quant"): McqItem {
  return {
    id: `a-${topic}-${difficulty}`,
    track: "aptitude",
    topic,
    type: "mcq",
    difficulty,
    question: "q",
    options: ["a", "b"],
    answerIndex: 0,
    explanation: "e",
    tags: [],
  };
}

describe("inferTrainingStage — canonical taxonomy alignment", () => {
  it("maps canonical DSA core topics to core-patterns", () => {
    // These canonical names (hashmap, prefix-sums) previously drifted vs the set.
    expect(inferTrainingStage(coding("hashmap", "easy"))).toBe("core-patterns");
    expect(inferTrainingStage(coding("two-pointer", "easy"))).toBe("core-patterns");
    expect(inferTrainingStage(coding("prefix-sums", "easy"))).toBe("core-patterns");
  });

  it("maps canonical DSA advanced topics (incl. greedy/heap/bit-manipulation) to advanced", () => {
    expect(inferTrainingStage(coding("greedy", "medium"))).toBe("advanced-patterns");
    expect(inferTrainingStage(coding("heap", "medium"))).toBe("advanced-patterns");
    expect(inferTrainingStage(coding("bit-manipulation", "medium"))).toBe("advanced-patterns");
    expect(inferTrainingStage(coding("math", "medium"))).toBe("advanced-patterns");
  });

  it("maps DSA intermediate topics correctly (stack, sorting, linked-list)", () => {
    expect(inferTrainingStage(coding("stack", "easy"))).toBe("intermediate-patterns");
    expect(inferTrainingStage(coding("sorting", "easy"))).toBe("intermediate-patterns");
    expect(inferTrainingStage(coding("linked-list", "easy"))).toBe("intermediate-patterns");
  });

  it("maps canonical SQL topics across stages", () => {
    expect(inferTrainingStage(sql("select", "easy"))).toBe("core-patterns");
    expect(inferTrainingStage(sql("joins", "easy"))).toBe("intermediate-patterns");
    expect(inferTrainingStage(sql("window-functions", "easy"))).toBe("advanced-patterns");
    expect(inferTrainingStage(sql("set-operations", "easy"))).toBe("advanced-patterns");
  });

  it("grades aptitude by difficulty (not topic)", () => {
    expect(inferTrainingStage(apt("easy"))).toBe("foundation");
    expect(inferTrainingStage(apt("medium"))).toBe("intermediate-patterns");
    expect(inferTrainingStage(apt("hard"))).toBe("advanced-patterns");
    expect(inferTrainingStage(apt("medium", "reasoning"))).toBe("intermediate-patterns");
  });

  it("respects an explicit item.stage override", () => {
    expect(inferTrainingStage({ ...coding("arrays", "easy"), stage: "machine-mode" })).toBe(
      "machine-mode",
    );
  });
});
