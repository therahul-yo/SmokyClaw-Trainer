import { describe, it, expect } from "vitest";
import type { QuizItem } from "../../types";
import { isMastered } from "../trainingMachine";

function makeItem(difficulty: QuizItem["difficulty"]): QuizItem {
  return {
    id: "test-item",
    track: "dsa",
    topic: "arrays",
    type: "mcq",
    difficulty,
    question: "q",
    options: ["a", "b"],
    answerIndex: 0,
    explanation: "x",
    tags: [],
  } as QuizItem;
}

describe("isMastered (regression: hard items should not short-circuit)", () => {
  it("returns false for a hard item that was correct but blew past the time target", () => {
    const item = makeItem("hard");
    const latest = {
      itemId: item.id,
      correct: true,
      timeMs: 99_999_999,
      attemptedAt: 0,
      hintsUsed: 0,
      gaveUp: false,
      count: 1,
    };
    expect(isMastered(item, latest)).toBe(false);
  });

  it("returns false for a hard item that was correct but used hints", () => {
    const item = makeItem("hard");
    const latest = {
      itemId: item.id,
      correct: true,
      timeMs: 1_000,
      attemptedAt: 0,
      hintsUsed: 99,
      gaveUp: false,
      count: 1,
    };
    expect(isMastered(item, latest)).toBe(false);
  });

  it("returns true for an easy/medium/hard item that was correct, fast, and hint-free", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const item = makeItem(difficulty);
      const latest = {
        itemId: item.id,
        correct: true,
        timeMs: 1_000,
        attemptedAt: 0,
        hintsUsed: 0,
        gaveUp: false,
        count: 1,
      };
      expect(isMastered(item, latest)).toBe(true);
    }
  });

  it("returns false when correct is false regardless of difficulty", () => {
    const item = makeItem("hard");
    const latest = {
      itemId: item.id,
      correct: false,
      timeMs: 1,
      attemptedAt: 0,
      hintsUsed: 0,
      gaveUp: false,
      count: 1,
    };
    expect(isMastered(item, latest)).toBe(false);
  });

  it("returns false when gaveUp is true regardless of difficulty", () => {
    const item = makeItem("easy");
    const latest = {
      itemId: item.id,
      correct: true,
      timeMs: 1,
      attemptedAt: 0,
      hintsUsed: 0,
      gaveUp: true,
      count: 1,
    };
    expect(isMastered(item, latest)).toBe(false);
  });

  it("returns false when latest is undefined", () => {
    expect(isMastered(makeItem("hard"), undefined)).toBe(false);
  });
});