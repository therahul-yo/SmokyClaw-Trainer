// Smoke-tests for smokey.ts — the local coach.
//
// We exercise every advisory class that runSmokey can emit by constructing
// minimal but realistic SmokeyInput fixtures. The point isn't to cover every
// permutation — it's to pin the contract: given X state, advisory Y is
// present (or absent) at severity Z with a valid CTA.
//
// Advisory classes covered:
//   - cold-start      (info)    — total attempts < 5
//   - streak-risk     (alert)   — late in the day, streak >= 2, no solve today
//   - streak-win      (win)     — streak >= 3 and already active today
//   - slipping        (warn)    — recent accuracy < 50% on >= 3 attempts
//   - retention       (warn)    — old single-correct attempts that never came back
//   - avoidance       (info)    — lessons read for a track, no drills attempted
//   - mastery-win     (win)     — >= 4 attempts, >= 90% on a topic in last 14d
//   - speed-regression(warn)    — recent avg >= 1.5x historical, both > 2s

import { describe, it, expect } from "vitest";
import { runSmokey, type Advisory, type SmokeyInput } from "../smokey";
import type {
  Attempt,
  Lesson,
  McqItem,
  MockTestBlueprint,
  QuizItem,
} from "../../types";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── minimal factories ─────────────────────────────────────────────

function item(
  overrides: Partial<McqItem> & { id: string },
): QuizItem {
  const base: McqItem = {
    id: overrides.id,
    track: overrides.track ?? "dsa",
    topic: overrides.topic ?? "arrays",
    type: "mcq",
    difficulty: overrides.difficulty ?? "easy",
    question: overrides.question ?? "q?",
    options: overrides.options ?? ["a", "b", "c", "d"],
    answerIndex: overrides.answerIndex ?? 0,
    explanation: overrides.explanation ?? "",
    tags: overrides.tags ?? [],
  };
  if (overrides.pattern) (base as McqItem & { pattern?: string }).pattern = overrides.pattern;
  if (overrides.stage) (base as McqItem & { stage?: McqItem["stage"] }).stage = overrides.stage;
  if (overrides.estMinutes) (base as McqItem & { estMinutes?: number }).estMinutes = overrides.estMinutes;
  if (overrides.speedTargetSec) {
    (base as McqItem & { speedTargetSec?: number }).speedTargetSec = overrides.speedTargetSec;
  }
  return base;
}

function attempt(
  itemId: string,
  daysAgo: number,
  correct: boolean,
  extras: Partial<Attempt> = {},
): Attempt {
  return {
    itemId,
    correct,
    timeMs: extras.timeMs ?? 5000,
    attemptedAt: Date.now() - daysAgo * DAY_MS,
    ...(extras.hintsUsed !== undefined ? { hintsUsed: extras.hintsUsed } : {}),
    ...(extras.gaveUp !== undefined ? { gaveUp: extras.gaveUp } : {}),
  };
}

function lesson(id: string, track: "python" | "dsa" | "sql" | "aptitude" = "python"): Lesson {
  return {
    id,
    title: `L:${id}`,
    track,
    topic: "t",
    order: 0,
    estMinutes: 8,
    prerequisites: [],
    body: "",
  };
}

function baseInput(): SmokeyInput {
  return {
    attempts: [],
    items: [],
    lessons: [],
    completedLessonIds: [],
    reviewRecords: [],
    streak: { current: 0, longest: 0 },
    blueprints: [],
  };
}

function findAdvisory(advisories: Advisory[], id: string): Advisory | undefined {
  return advisories.find((a) => a.id === id);
}

// ── cold start ─────────────────────────────────────────────────────

describe("smokey / cold-start advisory", () => {
  it("emits a cold-start info advisory when total attempts < 5", () => {
    const input: SmokeyInput = {
      ...baseInput(),
      attempts: [attempt("i1", 1, true), attempt("i2", 1, false)],
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "cold-start");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("info");
    expect(a?.cta?.to).toMatch(/^\/track\//);
    expect(r.stats.total).toBe(2);
  });

  it("does NOT emit cold-start when total attempts >= 5", () => {
    const input: SmokeyInput = {
      ...baseInput(),
      attempts: Array.from({ length: 5 }, (_, i) => attempt(`i${i}`, 1, true)),
      items: Array.from({ length: 5 }, (_, i) => item({ id: `i${i}` })),
    };
    const r = runSmokey(input, Date.now());
    expect(findAdvisory(r.advisories, "cold-start")).toBeUndefined();
  });
});

// ── streak-risk vs streak-win ──────────────────────────────────────

describe("smokey / streak-risk advisory", () => {
  it("emits streak-risk when streak>=2, no solve today, late in day (>=19h local)", () => {
    // Pick a `now` at 23:00 local. The streak-risk branch gates on getHours()
    // returning >= 19. In TZ=America/Los_Angeles (per vitest.config), Date.now
    // is local-aware. Use a recent UTC instant — Date#getHours on the host
    // is what the code calls.
    const lateLocal = new Date(2026, 5, 15, 23, 0, 0).getTime();
    const input: SmokeyInput = {
      ...baseInput(),
      streak: { current: 3, longest: 5 },
      // 1 attempt, but it's 2 days ago, not "today"
      attempts: [attempt("i1", 2, true)],
      items: [item({ id: "i1" })],
    };
    const r = runSmokey(input, lateLocal);
    const a = findAdvisory(r.advisories, "streak-risk");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("alert");
    expect(a?.cta?.to).toBe("/review");
    expect(a?.text).toMatch(/streak/);
  });

  it("does NOT emit streak-risk if user already solved today (streak-win instead)", () => {
    const lateLocal = new Date(2026, 5, 15, 23, 0, 0).getTime();
    const input: SmokeyInput = {
      ...baseInput(),
      streak: { current: 4, longest: 4 },
      attempts: [attempt("i1", 0, true)],
      items: [item({ id: "i1" })],
    };
    const r = runSmokey(input, lateLocal);
    expect(findAdvisory(r.advisories, "streak-risk")).toBeUndefined();
    const win = findAdvisory(r.advisories, "streak-win");
    expect(win).toBeDefined();
    expect(win?.severity).toBe("win");
  });
});

// ── slipping topic ────────────────────────────────────────────────

describe("smokey / slipping-topic advisory", () => {
  it("emits slipping when >= 3 recent attempts on a topic are < 50% correct", () => {
    const i1 = item({ id: "i1", track: "dsa", topic: "dp", pattern: "dp" });
    const i2 = item({ id: "i2", track: "dsa", topic: "dp", pattern: "dp" });
    const i3 = item({ id: "i3", track: "dsa", topic: "dp", pattern: "dp" });
    const i4 = item({ id: "i4", track: "dsa", topic: "dp", pattern: "dp" });
    const input: SmokeyInput = {
      ...baseInput(),
      items: [i1, i2, i3, i4],
      attempts: [
        attempt("i1", 1, false),
        attempt("i2", 1, false),
        attempt("i3", 1, false),
        attempt("i4", 1, true),
      ],
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "slipping");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("warn");
    expect(a?.text.toLowerCase()).toContain("dp");
  });

  it("does NOT emit slipping when topic accuracy is healthy (>= 50%)", () => {
    const items = [item({ id: "i1", topic: "arrays" }), item({ id: "i2", topic: "arrays" })];
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [attempt("i1", 1, true), attempt("i2", 1, true)],
    };
    const r = runSmokey(input, Date.now());
    expect(findAdvisory(r.advisories, "slipping")).toBeUndefined();
  });
});

// ── retention risk ────────────────────────────────────────────────

describe("smokey / retention-risk advisory", () => {
  it("emits retention for items solved >= 8 days ago, never revisited (count<=2)", () => {
    const items = [item({ id: "i1", topic: "graphs", pattern: "graphs" })];
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [attempt("i1", 14, true)], // solved 14d ago, never revisited
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "retention");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("warn");
    expect(a?.cta?.to).toBe("/review");
  });

  it("does NOT emit retention for items solved recently (< 8d)", () => {
    const items = [item({ id: "i1", topic: "graphs" })];
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [attempt("i1", 2, true)],
    };
    const r = runSmokey(input, Date.now());
    expect(findAdvisory(r.advisories, "retention")).toBeUndefined();
  });
});

// ── avoidance ─────────────────────────────────────────────────────

describe("smokey / avoidance advisory", () => {
  it("emits avoidance when user completed lessons for a track but never drilled it", () => {
    const lessons = [lesson("L1", "sql"), lesson("L2", "sql")];
    const input: SmokeyInput = {
      ...baseInput(),
      lessons,
      completedLessonIds: ["L1", "L2"],
      attempts: [attempt("dsa-1", 1, true)],
      items: [item({ id: "dsa-1", track: "dsa" })],
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "avoidance");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("info");
    expect(a?.text.toLowerCase()).toContain("sql");
    expect(a?.cta?.to).toMatch(/^\/track\/sql$/);
  });

  it("does NOT emit avoidance if the user has drilled at least one item on every track they read", () => {
    const lessons = [lesson("L1", "sql")];
    const input: SmokeyInput = {
      ...baseInput(),
      lessons,
      completedLessonIds: ["L1"],
      attempts: [attempt("sql-1", 1, true)],
      items: [item({ id: "sql-1", track: "sql" })],
    };
    const r = runSmokey(input, Date.now());
    expect(findAdvisory(r.advisories, "avoidance")).toBeUndefined();
  });
});

// ── mastery win ───────────────────────────────────────────────────

describe("smokey / mastery-win advisory", () => {
  it("emits mastery-win for a topic with >= 4 attempts and >= 90% accuracy in last 14d", () => {
    const items = ["i1", "i2", "i3", "i4", "i5"].map((id) =>
      item({ id, track: "dsa", topic: "hashing", pattern: "hashing" }),
    );
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [
        attempt("i1", 1, true),
        attempt("i2", 2, true),
        attempt("i3", 3, true),
        attempt("i4", 5, true),
        attempt("i5", 5, false),
      ],
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "mastery-win");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("win");
  });
});

// ── speed regression ──────────────────────────────────────────────

describe("smokey / speed-regression advisory", () => {
  it("emits speed-regression when recent correct avg > 1.5x historical, both > 2s", () => {
    // Topic "dp": 3 historical correct (avg 3s), 2 recent correct (avg 6s).
    // 6s > 1.5 * 3s and both > 2s. ✓
    const items = ["h1", "h2", "h3", "r1", "r2"].map((id) =>
      item({ id, track: "dsa", topic: "dp", pattern: "dp" }),
    );
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [
        attempt("h1", 21, true, { timeMs: 3000 }),
        attempt("h2", 22, true, { timeMs: 3000 }),
        attempt("h3", 24, true, { timeMs: 3000 }),
        attempt("r1", 2, true, { timeMs: 6000 }),
        attempt("r2", 1, true, { timeMs: 6000 }),
      ],
    };
    const r = runSmokey(input, Date.now());
    const a = findAdvisory(r.advisories, "speed-regression");
    expect(a).toBeDefined();
    expect(a?.severity).toBe("warn");
    expect(a?.text.toLowerCase()).toContain("speed");
  });

  it("does NOT emit speed-regression when recent avg is comparable to historical", () => {
    const items = ["h1", "h2", "h3", "r1", "r2"].map((id) =>
      item({ id, track: "dsa", topic: "dp", pattern: "dp" }),
    );
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [
        attempt("h1", 21, true, { timeMs: 3000 }),
        attempt("h2", 22, true, { timeMs: 3000 }),
        attempt("h3", 24, true, { timeMs: 3000 }),
        attempt("r1", 2, true, { timeMs: 3200 }),
        attempt("r2", 1, true, { timeMs: 3100 }),
      ],
    };
    const r = runSmokey(input, Date.now());
    expect(findAdvisory(r.advisories, "speed-regression")).toBeUndefined();
  });
});

// ── report-level invariants ───────────────────────────────────────

describe("smokey / report invariants", () => {
  it("greeting is a non-empty string", () => {
    const r = runSmokey(baseInput(), Date.now());
    expect(typeof r.greeting).toBe("string");
    expect(r.greeting.length).toBeGreaterThan(0);
  });

  it("accuracy is 0 when there are no attempts", () => {
    const r = runSmokey(baseInput(), Date.now());
    expect(r.stats.accuracy).toBe(0);
    expect(r.stats.total).toBe(0);
  });

  it("advisories are emitted in stable severity order (alert, warn, win, info)", () => {
    // Build a state that produces multiple advisories of different severities.
    const items = [
      item({ id: "i1", track: "dsa", topic: "dp", pattern: "dp" }),
      item({ id: "i2", track: "dsa", topic: "hashing", pattern: "hashing" }),
    ];
    const input: SmokeyInput = {
      ...baseInput(),
      items,
      attempts: [
        attempt("i1", 1, false),
        attempt("i2", 1, true),
      ],
      // Avoidance: lessons read for `sql`, never drilled.
      lessons: [lesson("L1", "sql"), lesson("L2", "sql")],
      completedLessonIds: ["L1", "L2"],
    };
    const lateLocal = new Date(2026, 5, 15, 23, 0, 0).getTime();
    const r = runSmokey(input, lateLocal);
    const order = { alert: 0, warn: 1, win: 2, info: 3 } as const;
    const sevs = r.advisories.map((a) => order[a.severity]);
    // Non-decreasing order
    for (let i = 1; i < sevs.length; i++) {
      expect(sevs[i]).toBeGreaterThanOrEqual(sevs[i - 1]);
    }
  });

  it("readiness list mirrors the input blueprints", () => {
    const bp: MockTestBlueprint = {
      id: "tcs-nqt",
      title: "TCS NQT",
      subtitle: "",
      sections: [
        {
          id: "s1",
          title: "S1",
          durationMinutes: 30,
          questionCount: 5,
          pickFrom: { track: "aptitude" },
        },
      ],
    };
    const input: SmokeyInput = { ...baseInput(), blueprints: [bp] };
    const r = runSmokey(input, Date.now());
    expect(r.readiness).toHaveLength(1);
    expect(r.readiness[0]?.id).toBe("tcs-nqt");
  });
});
