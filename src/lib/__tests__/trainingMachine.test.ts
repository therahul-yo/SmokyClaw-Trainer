// Tests for src/lib/trainingMachine.ts.
//
// `isMastered` is exported so the hard-difficulty regression (audit C6) can
// be pinned directly: a hard item must pass BOTH the speed gate and the
// hint gate — difficulty no longer short-circuits either one. The rest of
// the suite exercises the public `getStageSummaries` API, which surfaces
// mastery via `mastered` and `masteryPct` on each stage summary.

import { describe, it, expect } from "vitest";
import {
  getStageSummaries,
  inferTrainingStage,
  defaultSpeedTargetSec,
  latestAttemptsByItem,
  isMastered,
} from "../trainingMachine";
import type { Attempt, McqItem, QuizItem } from "../../types";

function item(
  id: string,
  track: McqItem["track"],
  topic: string,
  diff: McqItem["difficulty"],
  extras: Partial<McqItem> = {},
): QuizItem {
  return {
    id,
    track,
    topic,
    type: "mcq",
    difficulty: diff,
    question: "q",
    options: ["a", "b"],
    answerIndex: 0,
    explanation: "",
    tags: [],
    ...extras,
  };
}

function att(
  itemId: string,
  correct: boolean,
  at: number,
  extras: Partial<Attempt> = {},
): Attempt {
  return {
    itemId,
    correct,
    timeMs: 1000,
    attemptedAt: at,
    ...extras,
  };
}

// ── isMastered direct regression (audit C6) ──────────────────────

describe("isMastered (regression: hard items must not short-circuit)", () => {
  it("returns false for a hard item that was correct but blew past the time target", () => {
    const hard = item("hard-slow", "dsa", "dp", "hard");
    const latest = {
      ...att(hard.id, true, 0, { timeMs: 99_999_999, hintsUsed: 0 }),
      count: 1,
    };
    expect(isMastered(hard, latest)).toBe(false);
  });

  it("returns false for a hard item that was correct but used hints", () => {
    const hard = item("hard-hints", "dsa", "dp", "hard");
    const latest = {
      ...att(hard.id, true, 0, { timeMs: 1_000, hintsUsed: 99 }),
      count: 1,
    };
    expect(isMastered(hard, latest)).toBe(false);
  });

  it("returns true for an easy/medium/hard item that was correct, fast, and hint-free", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const it = item(`clean-${difficulty}`, "dsa", "t", difficulty);
      const latest = {
        ...att(it.id, true, 0, { timeMs: 1_000, hintsUsed: 0 }),
        count: 1,
      };
      expect(isMastered(it, latest)).toBe(true);
    }
  });

  it("returns false when correct is false regardless of difficulty", () => {
    const hard = item("hard-wrong", "dsa", "dp", "hard");
    const latest = { ...att(hard.id, false, 0, { timeMs: 1 }), count: 1 };
    expect(isMastered(hard, latest)).toBe(false);
  });

  it("returns false when gaveUp is true regardless of difficulty", () => {
    const easy = item("easy-gaveup", "dsa", "t", "easy");
    const latest = {
      ...att(easy.id, true, 0, { timeMs: 1, gaveUp: true }),
      count: 1,
    };
    expect(isMastered(easy, latest)).toBe(false);
  });

  it("returns false when latest is undefined", () => {
    expect(isMastered(item("x", "dsa", "dp", "hard"), undefined)).toBe(false);
  });
});

// ── isMastered behavior (via stage summaries) ────────────────────

describe("trainingMachine / isMastered (driven through stage summaries)", () => {
  function makePool(): QuizItem[] {
    return [
      // easy, fast, no hints → mastered
      item("easy-fast-clean", "dsa", "arrays", "easy"),
      // easy, slow, no hints → NOT mastered (speed gate fails)
      item("easy-slow-clean", "dsa", "arrays", "easy"),
      // hard, slow, many hints → NOT mastered (both gates fail; audit C6 fix)
      item("hard-slow-manyhints", "dsa", "dp", "hard"),
      // hard, fast, no hints → mastered
      item("hard-fast-clean", "dsa", "dp", "hard"),
    ];
  }

  it("easy + correct + fast + no hints → mastered", () => {
    const pool = makePool();
    // easy mcq speed target = 60s for easy
    const attempts = [att("easy-fast-clean", true, 1, { timeMs: 5000, hintsUsed: 0 })];
    const stages = getStageSummaries(pool, attempts);
    // "arrays" topic routes easy items to core-patterns via inferTrainingStage
    const core = stages.find((s) => s.id === "core-patterns")!;
    expect(core.mastered).toBe(1);
  });

  it("easy + correct + slow + no hints → NOT mastered (speed gate fails)", () => {
    const pool = makePool();
    const attempts = [att("easy-slow-clean", true, 1, { timeMs: 999_999, hintsUsed: 0 })];
    const stages = getStageSummaries(pool, attempts);
    const core = stages.find((s) => s.id === "core-patterns")!;
    expect(core.mastered).toBe(0);
  });

  it("hard + correct + slow + many hints → NOT mastered (audit C6 fixed)", () => {
    const pool = makePool();
    const attempts = [
      att("hard-slow-manyhints", true, 1, { timeMs: 999_999, hintsUsed: 5 }),
    ];
    const stages = getStageSummaries(pool, attempts);
    // hard items go to advanced-patterns
    const advanced = stages.find((s) => s.id === "advanced-patterns")!;
    expect(advanced.mastered).toBe(0);
  });

  it("hard + correct + fast + no hints → mastered", () => {
    const pool = makePool();
    const attempts = [att("hard-fast-clean", true, 1, { timeMs: 5000, hintsUsed: 0 })];
    const stages = getStageSummaries(pool, attempts);
    const advanced = stages.find((s) => s.id === "advanced-patterns")!;
    expect(advanced.mastered).toBe(1);
  });

  it("gaveUp=true blocks mastery even if correct", () => {
    const pool = [item("x", "dsa", "t", "easy")];
    const attempts = [att("x", true, 1, { timeMs: 1000, gaveUp: true })];
    const stages = getStageSummaries(pool, attempts);
    const foundation = stages.find((s) => s.id === "foundation")!;
    expect(foundation.mastered).toBe(0);
  });

  it("incorrect attempt blocks mastery", () => {
    const pool = [item("x", "dsa", "t", "easy")];
    const attempts = [att("x", false, 1, { timeMs: 1000 })];
    const stages = getStageSummaries(pool, attempts);
    const foundation = stages.find((s) => s.id === "foundation")!;
    expect(foundation.mastered).toBe(0);
  });
});

// ── phase progression / stage gating ─────────────────────────────

describe("trainingMachine / phase progression", () => {
  // Build a pool with exactly N items per stage, all easy mcq. To force items
  // into non-foundation stages we tag them with an explicit `stage` field.
  function taggedPool(): QuizItem[] {
    const stages: Array<
      | "foundation"
      | "core-patterns"
      | "intermediate-patterns"
      | "advanced-patterns"
      | "interview-simulation"
      | "machine-mode"
    > = [
      "foundation",
      "core-patterns",
      "intermediate-patterns",
      "advanced-patterns",
      "interview-simulation",
      "machine-mode",
    ];
    return stages.flatMap((s) =>
      Array.from({ length: 3 }, (_, i) =>
        item(`${s}-${i}`, "dsa", "t", "easy", { stage: s }),
      ),
    );
  }

  it("each stage is locked until the previous one passes its target", () => {
    const pool = taggedPool();
    // Only master the foundation items
    const foundationIds = pool.filter((i) => i.stage === "foundation").map((i) => i.id);
    const attempts: Attempt[] = foundationIds.map((id, idx) => ({
      itemId: id,
      correct: true,
      timeMs: 1000,
      attemptedAt: 1000 + idx,
      hintsUsed: 0,
    }));
    const stages = getStageSummaries(pool, attempts);

    // Foundation 3/3 = 100% ≥ 85% target → passed
    expect(stages[0]?.gate).toBe("passed");
    // Core-patterns 0/3 = 0% < 80% target → train (but unlocked, since previousPassed=true)
    expect(stages[1]?.gate).toBe("train");
    expect(stages[1]?.unlocked).toBe(true);
    // All later stages are LOCKED because core-patterns hasn't passed
    for (let i = 2; i < stages.length; i++) {
      expect(stages[i]?.gate).toBe("locked");
      expect(stages[i]?.unlocked).toBe(false);
    }
  });

  it("a stage advances only after the previous stage hits its targetPct", () => {
    const pool = taggedPool();
    // Master ALL items in foundation + core-patterns, but not the rest.
    const masteredIds = pool
      .filter((i) => i.stage === "foundation" || i.stage === "core-patterns")
      .map((i) => i.id);
    const attempts: Attempt[] = masteredIds.map((id, idx) => ({
      itemId: id,
      correct: true,
      timeMs: 1000,
      attemptedAt: 1000 + idx,
      hintsUsed: 0,
    }));
    const stages = getStageSummaries(pool, attempts);

    expect(stages[0]?.gate).toBe("passed");
    expect(stages[1]?.gate).toBe("passed");
    // Intermediate is now unlocked but failing
    expect(stages[2]?.gate).toBe("train");
    expect(stages[2]?.unlocked).toBe(true);
    // Advanced is still locked
    expect(stages[3]?.gate).toBe("locked");
  });

  it("masteryPct is rounded to an integer", () => {
    const pool = [
      item("a", "dsa", "t", "easy", { stage: "foundation" }),
      item("b", "dsa", "t", "easy", { stage: "foundation" }),
      item("c", "dsa", "t", "easy", { stage: "foundation" }),
    ];
    const stages = getStageSummaries(
      pool,
      pool.slice(0, 1).map((i, idx) => ({
        itemId: i.id,
        correct: true,
        timeMs: 1000,
        attemptedAt: idx + 1,
        hintsUsed: 0,
      })),
    );
    const f = stages[0]!;
    expect(f.masteryPct).toBe(33); // 1/3 → 33.33 → rounded
    expect(Number.isInteger(f.masteryPct)).toBe(true);
  });

  it("empty stages pass their gate and never block later stages", () => {
    const stages = getStageSummaries([], []);
    for (const stage of stages) {
      expect(stage.total).toBe(0);
      expect(stage.mastered).toBe(0);
      expect(stage.masteryPct).toBe(0);
      // A stage with no items has nothing to master → passed, not a blocker.
      expect(stage.gate).toBe("passed");
      expect(stage.unlocked).toBe(true);
    }
  });
});

// ── inferTrainingStage inference ────────────────────────────────

describe("trainingMachine / inferTrainingStage", () => {
  it("explicit item.stage wins over topic inference", () => {
    const it = item("x", "dsa", "arrays", "easy", { stage: "advanced-patterns" });
    expect(inferTrainingStage(it)).toBe("advanced-patterns");
  });

  it("difficulty=hard → advanced-patterns", () => {
    const it = item("x", "dsa", "trees", "hard");
    expect(inferTrainingStage(it)).toBe("advanced-patterns");
  });

  it("unknown topic on a non-hard item → foundation", () => {
    const it = item("x", "dsa", "obscure-topic", "easy");
    expect(inferTrainingStage(it)).toBe("foundation");
  });

  it("arrays topic → core-patterns", () => {
    const it = item("x", "dsa", "arrays", "easy");
    expect(inferTrainingStage(it)).toBe("core-patterns");
  });

  it("recursion topic → intermediate-patterns", () => {
    const it = item("x", "dsa", "recursion", "easy");
    expect(inferTrainingStage(it)).toBe("intermediate-patterns");
  });

  it("topic containing 'dp' substring → advanced-patterns", () => {
    const it = item("x", "dsa", "dp-1d", "easy");
    expect(inferTrainingStage(it)).toBe("advanced-patterns");
  });
});

// ── defaultSpeedTargetSec ────────────────────────────────────────

describe("trainingMachine / defaultSpeedTargetSec", () => {
  it("uses item.speedTargetSec when set", () => {
    const it = item("x", "dsa", "t", "easy", { speedTargetSec: 42 });
    expect(defaultSpeedTargetSec(it)).toBe(42);
  });

  it("falls back to 60s for easy mcq", () => {
    expect(defaultSpeedTargetSec(item("x", "dsa", "t", "easy"))).toBe(60);
  });

  it("falls back to 120s for hard mcq", () => {
    expect(defaultSpeedTargetSec(item("x", "dsa", "t", "hard"))).toBe(120);
  });

  it("falls back to 360s for easy sql", () => {
    const it: QuizItem = {
      id: "x",
      track: "sql",
      topic: "t",
      type: "sql",
      difficulty: "easy",
      prompt: "p",
      schema: "employees",
      expected: { columns: [], rows: [] },
      tags: [],
    };
    expect(defaultSpeedTargetSec(it)).toBe(360);
  });
});

// ── latestAttemptsByItem ────────────────────────────────────────

describe("trainingMachine / latestAttemptsByItem", () => {
  it("counts all attempts and keeps the latest per item", () => {
    const map = latestAttemptsByItem([
      att("a", true, 1),
      att("a", false, 2),
      att("a", true, 3),
      att("b", false, 4),
    ]);
    expect(map.get("a")?.count).toBe(3);
    expect(map.get("a")?.correct).toBe(true);
    expect(map.get("b")?.count).toBe(1);
  });
});
