// Tests for the adaptive study-plan generator.
//
// `generatePlan` is fully deterministic (no real RNG) so we can pin:
//   - mode is "cram" for <= 7 days, "thorough" otherwise
//   - days.length matches deadline math
//   - day.date is YYYY-MM-DD
//   - thorough plans place mock-test markers at floor(days/2),
//     floor(days*3/4), and days-1
//   - cram plans mark only the last day
//   - items appear in at most one day bucket
//   - todayBucket returns the matching day, or null past the deadline

import { describe, it, expect } from "vitest";
import { generatePlan, todayBucket } from "../planner";
import type { Lesson, QuizItem, TrackId, StudyPlan } from "../../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ── minimal fixtures ─────────────────────────────────────────────

function lesson(id: string, track: TrackId, topic = "t"): Lesson {
  return { id, title: id, track, topic, order: 0, estMinutes: 8, prerequisites: [], body: "" };
}

function item(
  id: string,
  track: TrackId,
  topic = "t",
  type: QuizItem["type"] = "mcq",
  estMinutes?: number,
): QuizItem {
  if (type === "mcq") {
    return {
      id,
      track,
      topic,
      type,
      difficulty: "easy",
      question: "q",
      options: ["a", "b"],
      answerIndex: 0,
      explanation: "",
      tags: [],
      ...(estMinutes !== undefined ? { estMinutes } : {}),
    };
  }
  // coding/sql won't actually be graded here — just need the shape for type compat
  return {
    id,
    track,
    topic,
    type,
    difficulty: "easy",
    ...(type === "coding"
      ? {
          language: "python" as const,
          prompt: "p",
          starter: "def f(): pass",
          entry: "f",
          tests: [{ args: [], expect: null }],
          tags: [],
        }
      : {
          schema: "employees" as const,
          prompt: "p",
          expected: { columns: [], rows: [] },
          tags: [],
        }),
    ...(estMinutes !== undefined ? { estMinutes } : {}),
  } as QuizItem;
}

function makeItems(n: number, track: TrackId, topic = "t"): QuizItem[] {
  return Array.from({ length: n }, (_, i) =>
    item(`it-${track}-${topic}-${i}`, track, topic, "mcq", 2),
  );
}

function makeLessons(n: number, track: TrackId): Lesson[] {
  return Array.from({ length: n }, (_, i) => lesson(`ls-${track}-${i}`, track));
}

function nowPlusDays(days: number): Date {
  return new Date(Date.UTC(2026, 5, 15, 12, 0, 0) + days * MS_PER_DAY);
}

// ── generatePlan basics ──────────────────────────────────────────

describe("planner / generatePlan basics", () => {
  it("chooses 'cram' mode when deadline is <= 7 days away", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(5),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(10, "dsa"),
      allLessons: makeLessons(3, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("cram");
    expect(plan.days.length).toBe(5);
  });

  it("chooses 'thorough' mode when deadline is > 7 days away", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(30),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(10, "dsa"),
      allLessons: makeLessons(3, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("thorough");
    expect(plan.days.length).toBe(30);
  });

  it("clamps a past-deadline input to at least 1 day", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(-3),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(5, "dsa"),
      allLessons: makeLessons(2, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.days.length).toBe(1);
  });

  it("formats day.date as YYYY-MM-DD", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(3),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(5, "dsa"),
      allLessons: makeLessons(2, "dsa"),
      now: nowPlusDays(0),
    });
    for (const d of plan.days) {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("dayIndex is 0-based and contiguous", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(4),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(5, "dsa"),
      allLessons: makeLessons(2, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.days.map((d) => d.dayIndex)).toEqual([0, 1, 2, 3]);
  });

  it("focuses on user-supplied focus tracks only", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(2),
      dailyMinutes: 60,
      focusTracks: ["sql"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: [...makeItems(5, "dsa"), ...makeItems(5, "sql")],
      allLessons: [...makeLessons(2, "dsa"), ...makeLessons(2, "sql")],
      now: nowPlusDays(0),
    });
    for (const d of plan.days) {
      // every placed lesson must be a sql lesson
      for (const lid of d.lessonIds) {
        expect(lid.startsWith("ls-sql-")).toBe(true);
      }
    }
  });
});

// ── mock-test markers ────────────────────────────────────────────

describe("planner / mock-test markers", () => {
  it("marks thorough plans at floor(days/2), floor(days*3/4), days-1", () => {
    // 20 days -> floor(20/2)=10, floor(60/4)=15, 19
    const plan = generatePlan({
      deadline: nowPlusDays(20),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(50, "dsa"),
      allLessons: makeLessons(10, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("thorough");
    const marked = plan.days
      .filter((d) => typeof d.note === "string")
      .map((d) => d.dayIndex)
      .sort((a, b) => a - b);
    expect(marked).toEqual([10, 15, 19]);
  });

  it("marks cram plans only on the last day", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(4),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(20, "dsa"),
      allLessons: makeLessons(5, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("cram");
    const marked = plan.days.filter((d) => typeof d.note === "string");
    expect(marked).toHaveLength(1);
    expect(marked[0]?.dayIndex).toBe(3);
  });

  it("exact-boundary: deadline == 7 days chooses cram", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(7),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(20, "dsa"),
      allLessons: makeLessons(5, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("cram");
  });

  it("exact-boundary: deadline == 8 days chooses thorough", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(8),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(20, "dsa"),
      allLessons: makeLessons(5, "dsa"),
      now: nowPlusDays(0),
    });
    expect(plan.mode).toBe("thorough");
  });
});

// ── no double-placement ──────────────────────────────────────────

describe("planner / item placement invariants", () => {
  it("does not place the same item in more than one day", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(5),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(30, "dsa"),
      allLessons: makeLessons(10, "dsa"),
      now: nowPlusDays(0),
    });
    const seen = new Set<string>();
    for (const d of plan.days) {
      for (const id of d.itemIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });

  it("does not place the same lesson in more than one day", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(5),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(30, "dsa"),
      allLessons: makeLessons(10, "dsa"),
      now: nowPlusDays(0),
    });
    const seen = new Set<string>();
    for (const d of plan.days) {
      for (const id of d.lessonIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });

  it("respects the dailyMinutes budget (estMinutes never exceeds it)", () => {
    const plan = generatePlan({
      deadline: nowPlusDays(5),
      dailyMinutes: 30,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(30, "dsa"),
      allLessons: makeLessons(10, "dsa"),
      now: nowPlusDays(0),
    });
    for (const d of plan.days) {
      // estMinutes is computed as dailyMinutes - budgetRemaining; never negative
      expect(d.estMinutes).toBeLessThanOrEqual(30);
      expect(d.estMinutes).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── todayBucket ──────────────────────────────────────────────────

describe("planner / todayBucket", () => {
  function planEnding(daysFromNow: number): StudyPlan {
    return generatePlan({
      deadline: nowPlusDays(daysFromNow),
      dailyMinutes: 60,
      focusTracks: ["dsa"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: makeItems(20, "dsa"),
      allLessons: makeLessons(5, "dsa"),
      now: nowPlusDays(0),
    });
  }

  it("returns the day whose date matches 'today'", () => {
    const plan = planEnding(5);
    const now = nowPlusDays(0);
    const bucket = todayBucket(plan, now);
    expect(bucket).not.toBeNull();
    expect(bucket?.date).toBe("2026-06-15"); // YYYY-MM-DD of `nowPlusDays(0)`
  });

  it("returns null when 'today' is past the plan deadline", () => {
    const plan = planEnding(3);
    const future = nowPlusDays(10);
    const bucket = todayBucket(plan, future);
    expect(bucket).toBeNull();
  });

  it("returns the matching day on a day other than day 0", () => {
    const plan = planEnding(5);
    const bucket = todayBucket(plan, nowPlusDays(2));
    expect(bucket).not.toBeNull();
    expect(bucket?.dayIndex).toBe(2);
  });
});

// ── weight / focus bias ───────────────────────────────────────────

describe("planner / focus bias", () => {
  it("first two practice slots of each day favor the day's track", () => {
    const dsaItems = makeItems(20, "dsa");
    const sqlItems = makeItems(20, "sql");
    const plan = generatePlan({
      deadline: nowPlusDays(3),
      dailyMinutes: 60,
      focusTracks: ["dsa", "sql"],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: [...dsaItems, ...sqlItems],
      allLessons: [...makeLessons(5, "dsa"), ...makeLessons(5, "sql")],
      now: nowPlusDays(0),
    });
    // For each day, the first two itemIds must come from the day's track
    for (let i = 0; i < plan.days.length; i++) {
      const d = plan.days[i]!;
      const trackForDay: TrackId = ["dsa", "sql"][i % 2] as TrackId;
      const firstTwo = d.itemIds.slice(0, 2);
      for (const id of firstTwo) {
        expect(id.startsWith(`it-${trackForDay}-`)).toBe(true);
      }
    }
  });
});
