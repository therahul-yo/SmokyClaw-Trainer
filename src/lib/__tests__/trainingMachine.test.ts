// Tests for src/lib/trainingMachine.ts.
//
// `isMastered` is private — we exercise it through the public
// `getStageSummaries` API which surfaces the result via `mastered` and
// `masteryPct` on each stage summary.
//
// Hard difficulty is a special case in `isMastered`: when item.difficulty
// === "hard", BOTH the speed gate AND the hint gate are bypassed via the
// `||` short-circuit. That's an audit-flagged bug (C6) — a hard item with
// unlimited hints and slow time still counts as mastered. This test pins
// the buggy current behavior so any future fix will be an intentional diff.

import { describe, it, expect } from "vitest";
import {
  getStageSummaries,
  inferTrainingStage,
  defaultSpeedTargetSec,
  latestAttemptsByItem,
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

// ── isMastered behavior (via stage summaries) ────────────────────

describe("trainingMachine / isMastered (driven through stage summaries)", () => {
  function makePool(): QuizItem[] {
    return [
      // easy, fast, no hints → mastered
      item("easy-fast-clean", "dsa", "arrays", "easy"),
      // easy, slow, no hints → NOT mastered (speed gate fails)
      item("easy-slow-clean", "dsa", "arrays", "easy"),
      // hard, slow, many hints → currently BUGGY-counts-as-mastered (audit C6)
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
    const foundation = stages.find((s) => s.id === "foundation")!;
    // easy item goes to "foundation" via inferTrainingStage
    expect(foundation.mastered).toBe(1);
  });

  it("easy + correct + slow + no hints → NOT mastered (speed gate fails)", () => {
    const pool = makePool();
    const attempts = [att("easy-slow-clean", true, 1, { timeMs: 999_999, hintsUsed: 0 })];
    const stages = getStageSummaries(pool, attempts);
    const foundation = stages.find((s) => s.id === "foundation")!;
    expect(foundation.mastered).toBe(0);
  });

  it("hard + correct + slow + many hints → mastered (audit C6 short-circuit bug)", () => {
    // The current implementation:
    //   speedPass = latest.timeMs <= targetMs || item.difficulty === "hard"
    //   hintPass  = (latest.hintsUsed ?? 0) === 0 || item.difficulty === "hard"
    // → both gates pass via the `|| difficulty === "hard"` short-circuit
    // even though the time is way over the budget AND hints were used.
    // This test pins that bug. A fix would change the OR to AND-NOT-hard
    // and this test would have to be updated.
    const pool = makePool();
    const attempts = [
      att("hard-slow-manyhints", true, 1, { timeMs: 999_999, hintsUsed: 5 }),
    ];
    const stages = getStageSummaries(pool, attempts);
    // hard items go to advanced-patterns
    const advanced = stages.find((s) => s.id === "advanced-patterns")!;
    expect(advanced.mastered).toBe(1);
  });

  it("hard + correct + fast + no hints → mastered", () => {
    const pool = makePool();
    const attempts = [att("hard-fast-clean", true, 1, { timeMs: 5000, hintsUsed: 0 })];
    const stages = getStageSummaries(pool, attempts);
    const advanced = stages.find((s) => s.id === "advanced-patterns")!;
    expect(advanced.mastered).toBe(1);
  });

  it("gaveUp=true blocks mastery even if correct", () => {
    const pool = [item("x", "dsa", "arrays", "easy")];
    const attempts = [att("x", true, 1, { timeMs: 1000, gaveUp: true })];
    const stages = getStageSummaries(pool, attempts);
    const foundation = stages.find((s) => s.id === "foundation")!;
    expect(foundation.mastered).toBe(0);
  });

  it("incorrect attempt blocks mastery", () => {
    const pool = [item("x", "dsa", "arrays", "easy")];
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

  it("empty pool returns masteryPct=0 and gate=passed (0>=target trivially)", () => {
    const stages = getStageSummaries([], []);
    expect(stages[0]?.total).toBe(0);
    expect(stages[0]?.mastered).toBe(0);
    expect(stages[0]?.masteryPct).toBe(0);
    // previousPassed starts true, gate = 0 >= 85 ? passed : ... → passed
    expect(stages[0]?.gate).toBe("passed");
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
