import { describe, expect, it } from "vitest";
import type { McqItem, MockSection, QuizItem } from "../../types";
import { pickItemsForSection, sectionPool } from "../mockPicker";

function mcq(id: string, track: McqItem["track"], topic: string): McqItem {
  return {
    id,
    track,
    topic,
    type: "mcq",
    difficulty: "easy",
    question: "q",
    options: ["a", "b"],
    answerIndex: 0,
    explanation: "e",
    tags: [],
  };
}

const coding: QuizItem = {
  id: "c-1",
  track: "python",
  topic: "functions",
  type: "coding",
  language: "python",
  difficulty: "easy",
  prompt: "p",
  starter: "s",
  entry: "f",
  tests: [{ args: [], expect: null }],
  tags: [],
};

const pool: QuizItem[] = [
  mcq("a-1", "aptitude", "quant"),
  mcq("a-2", "aptitude", "quant"),
  mcq("a-3", "aptitude", "verbal"),
  mcq("p-1", "python", "functions"),
  mcq("d-1", "dsa", "arrays"),
  coding,
];

describe("sectionPool", () => {
  it("filters by track and topics, MCQs only", () => {
    const section: MockSection = {
      id: "s",
      title: "S",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    };
    expect(sectionPool(section, pool).map((i) => i.id)).toEqual(["a-1", "a-2"]);
  });

  it("supports multi-criteria pickFrom (union)", () => {
    const section: MockSection = {
      id: "s",
      title: "S",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    };
    expect(sectionPool(section, pool).map((i) => i.id)).toEqual(["p-1", "d-1"]);
  });

  it("never returns coding items even when type is unconstrained", () => {
    const section: MockSection = {
      id: "s",
      title: "S",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: { track: "python" },
    };
    expect(sectionPool(section, pool).map((i) => i.id)).toEqual(["p-1"]);
  });
});

describe("pickItemsForSection", () => {
  const section: MockSection = {
    id: "s",
    title: "S",
    durationMinutes: 10,
    questionCount: 2,
    pickFrom: { track: "aptitude" },
  };

  it("caps the result at questionCount", () => {
    expect(pickItemsForSection(section, pool, () => 0)).toHaveLength(2);
  });

  it("is deterministic for a fixed rng", () => {
    let calls = 0;
    const rng = () => [0.1, 0.9, 0.5, 0.3][calls++ % 4];
    calls = 0;
    const first = pickItemsForSection(section, pool, rng).map((i) => i.id);
    calls = 0;
    const second = pickItemsForSection(section, pool, rng).map((i) => i.id);
    expect(first).toEqual(second);
  });

  it("returns fewer items than requested when the pool is short (silent under-fill)", () => {
    // Documents current engine behavior — Phase 4 adds loud shortfall warnings.
    const greedy: MockSection = { ...section, questionCount: 99 };
    expect(pickItemsForSection(greedy, pool, () => 0)).toHaveLength(3);
  });

  it("returns distinct items", () => {
    const ids = pickItemsForSection(section, pool, Math.random).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
