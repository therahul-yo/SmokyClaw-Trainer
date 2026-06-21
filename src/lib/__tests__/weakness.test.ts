// Tests for src/lib/weakness.ts.
//
// Three exports:
//   - topicScores(attempts, items): per-(track,topic) aggregation using the
//     LATEST attempt per item. correctRate defaults to 1 when no attempts.
//   - weakestTopics(attempts, items, limit?): topics with attempts >= 2,
//     sorted by weakness desc.
//   - itemWeight(item, scores, userWeakTopics): ranking weight. Untested
//     topics get 0.3 baseline; user-declared weak topics add +0.5.

import { describe, it, expect } from "vitest";
import { topicScores, weakestTopics, itemWeight } from "../weakness";
import type { Attempt, McqItem, QuizItem, TrackId } from "../../types";

function item(
  id: string,
  track: TrackId,
  topic: string,
  extras: Partial<McqItem> = {},
): QuizItem {
  return {
    id,
    track,
    topic,
    type: "mcq",
    difficulty: "easy",
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

// ── topicScores ──────────────────────────────────────────────────

describe("weakness / topicScores", () => {
  it("returns empty array when there are no attempts", () => {
    const out = topicScores([], [item("i1", "dsa", "arrays")]);
    expect(out).toEqual([]);
  });

  it("returns correctRate=1 for topics with zero attempts (untested → not weak)", () => {
    // No attempts, but include the item — `topicScores` only emits buckets
    // for topics that have at least one attempt in this implementation.
    // Untested-topic default of 1 is exercised by itemWeight, not here.
    const out = topicScores([], []);
    expect(out).toEqual([]);
  });

  it("computes correctRate = correct/total for a topic with multiple attempts", () => {
    const i1 = item("i1", "dsa", "arrays");
    const i2 = item("i2", "dsa", "arrays");
    const i3 = item("i3", "dsa", "arrays");
    const out = topicScores(
      [att("i1", true, 100), att("i2", true, 200), att("i3", false, 300)],
      [i1, i2, i3],
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.attempts).toBe(3);
    expect(out[0]?.correct).toBe(2);
    expect(out[0]?.correctRate).toBeCloseTo(2 / 3, 5);
    expect(out[0]?.weakness).toBeCloseTo(1 / 3, 5);
    expect(out[0]?.track).toBe("dsa");
    expect(out[0]?.topic).toBe("arrays");
  });

  it("uses only the LATEST attempt per item (retries don't double-count)", () => {
    const i1 = item("i1", "dsa", "arrays");
    const out = topicScores(
      // 3 attempts on i1, last one wrong → effective correctRate = 0
      [att("i1", true, 1), att("i1", true, 2), att("i1", false, 3)],
      [i1],
    );
    expect(out[0]?.attempts).toBe(1);
    expect(out[0]?.correct).toBe(0);
    expect(out[0]?.correctRate).toBe(0);
    expect(out[0]?.weakness).toBe(1);
  });

  it("groups by (track, topic) — same topic across tracks stays separate", () => {
    const a = item("a", "dsa", "joins");
    const b = item("b", "sql", "joins");
    const out = topicScores(
      [att("a", true, 1), att("b", false, 2)],
      [a, b],
    );
    expect(out).toHaveLength(2);
    const byKey = new Map(out.map((s) => [`${s.track}::${s.topic}`, s]));
    expect(byKey.get("dsa::joins")?.correctRate).toBe(1);
    expect(byKey.get("sql::joins")?.correctRate).toBe(0);
  });

  it("ignores attempts whose itemId is not in the items list", () => {
    const out = topicScores(
      [att("ghost", true, 1)],
      [item("real", "dsa", "arrays")],
    );
    expect(out).toEqual([]);
  });
});

// ── weakestTopics ────────────────────────────────────────────────

describe("weakness / weakestTopics", () => {
  it("requires attempts >= 2 before flagging weak", () => {
    const i1 = item("i1", "dsa", "arrays");
    const out = weakestTopics([att("i1", false, 1)], [i1]);
    expect(out).toEqual([]); // only 1 attempt — ignored
  });

  it("ranks by weakness desc, capped at `limit`", () => {
    const items = {
      weak: item("w1", "dsa", "dp"),
      medium: item("m1", "dsa", "graphs"),
      strong: item("s1", "dsa", "arrays"),
    };
    const out = weakestTopics(
      [
        att("w1", false, 1),
        att("w1", false, 2),
        att("m1", true, 1),
        att("m1", false, 2),
        att("s1", true, 1),
        att("s1", true, 2),
      ],
      [items.weak, items.medium, items.strong],
      5,
    );
    expect(out.map((s) => s.topic)).toEqual(["dp", "graphs", "arrays"]);
  });

  it("respects the limit parameter", () => {
    const items = ["a", "b", "c", "d"].map((t) =>
      item(`i-${t}`, "dsa", t),
    );
    const attempts = items.flatMap((it, idx) => [
      att(it.id, idx % 2 === 0, 1),
      att(it.id, idx % 2 === 0, 2),
    ]);
    const out = weakestTopics(attempts, items, 2);
    expect(out).toHaveLength(2);
  });
});

// ── itemWeight ───────────────────────────────────────────────────

describe("weakness / itemWeight", () => {
  it("untested topic gets weight 0.3", () => {
    const it = item("i1", "dsa", "dp");
    // No scores for this topic at all.
    expect(itemWeight(it, [], [])).toBe(0.3);
  });

  it("tested topic uses score.weakness as the base", () => {
    const it = item("i1", "dsa", "dp");
    const scores = [
      { track: "dsa" as TrackId, topic: "dp", attempts: 4, correct: 1, correctRate: 0.25, weakness: 0.75 },
    ];
    expect(itemWeight(it, scores, [])).toBeCloseTo(0.75, 5);
  });

  it("adds 0.5 when the user declared the topic weak", () => {
    const it = item("i1", "dsa", "dp");
    const scores = [
      { track: "dsa" as TrackId, topic: "dp", attempts: 4, correct: 1, correctRate: 0.25, weakness: 0.75 },
    ];
    expect(itemWeight(it, scores, ["dp"])).toBeCloseTo(1.25, 5);
  });

  it("declared-weak bonus stacks on the 0.3 untested default", () => {
    const it = item("i1", "dsa", "dp");
    expect(itemWeight(it, [], ["dp"])).toBeCloseTo(0.8, 5);
  });

  it("declared-weak only matches the exact topic string", () => {
    const it = item("i1", "dsa", "dp");
    const scores = [
      { track: "dsa" as TrackId, topic: "dp", attempts: 4, correct: 1, correctRate: 0.25, weakness: 0.75 },
    ];
    // "dp-advanced" is NOT a match for "dp"
    expect(itemWeight(it, scores, ["dp-advanced"])).toBeCloseTo(0.75, 5);
  });

  it("uses the (track, topic) pair — same topic on a different track doesn't leak", () => {
    const it = item("i1", "dsa", "joins");
    const scores = [
      { track: "sql" as TrackId, topic: "joins", attempts: 10, correct: 1, correctRate: 0.1, weakness: 0.9 },
    ];
    // No match for (dsa, joins) — fall back to 0.3
    expect(itemWeight(it, scores, [])).toBe(0.3);
  });
});
