import { describe, expect, it, vi } from "vitest";
import type { CompanyTag, McqItem, MockSection, QuizItem } from "../../types";
import {
  pickCodingItemsForSection,
  pickItemsForSection,
  sectionPool,
} from "../mockPicker";
import { hashSeed, seededRng } from "../rng";

function mcq(
  id: string,
  track: McqItem["track"],
  topic: string,
  companies?: CompanyTag[],
): McqItem {
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
    ...(companies ? { companies } : {}),
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

  it("warns (no longer silent) and returns fewer items when the pool is short", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const greedy: MockSection = { ...section, questionCount: 99 };
    expect(pickItemsForSection(greedy, pool, () => 0)).toHaveLength(3);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("under-filled"));
    warn.mockRestore();
  });

  it("returns distinct items", () => {
    const ids = pickItemsForSection(section, pool, Math.random).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("excludes ids already used by earlier sections (cross-section dedupe)", () => {
    const used = new Set(["a-1", "a-2"]);
    const ids = pickItemsForSection(section, pool, () => 0, used).map((i) => i.id);
    expect(ids).not.toContain("a-1");
    expect(ids).not.toContain("a-2");
    expect(ids).toContain("a-3"); // the only remaining aptitude MCQ
  });
});

describe("sectionPool company filter", () => {
  const taggedPool: QuizItem[] = [
    mcq("g-1", "aptitude", "quant"), // untagged → generic, always eligible
    mcq("t-1", "aptitude", "quant", ["tcs"]),
    mcq("i-1", "aptitude", "quant", ["infosys"]),
    mcq("ti-1", "aptitude", "quant", ["tcs", "infosys"]),
  ];

  it("includes untagged + matching-company items, excludes other-company-only", () => {
    const section: MockSection = {
      id: "s",
      title: "S",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["quant"] },
      company: "tcs",
    };
    expect(sectionPool(section, taggedPool).map((i) => i.id)).toEqual([
      "g-1",
      "t-1",
      "ti-1",
    ]);
  });

  it("with no company set, all matching items are eligible", () => {
    const section: MockSection = {
      id: "s",
      title: "S",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    };
    expect(sectionPool(section, taggedPool)).toHaveLength(4);
  });
});

describe("seeded run pipeline (reproducible + no cross-section repeats)", () => {
  // A larger pool with overlapping section criteria so dedupe actually bites.
  const bigPool: QuizItem[] = Array.from({ length: 30 }, (_, i) =>
    mcq(`q-${i}`, "aptitude", i % 2 === 0 ? "quant" : "reasoning"),
  );
  const sections: MockSection[] = [
    { id: "s1", title: "S1", durationMinutes: 10, questionCount: 6, pickFrom: { track: "aptitude" } },
    { id: "s2", title: "S2", durationMinutes: 10, questionCount: 6, pickFrom: { track: "aptitude" } },
    { id: "s3", title: "S3", durationMinutes: 10, questionCount: 6, pickFrom: { track: "aptitude" } },
  ];

  function runOnce(runId: string): string[][] {
    const rng = seededRng(hashSeed("blueprint-x" + runId));
    const used = new Set<string>();
    return sections.map((sec) => {
      const picked = pickItemsForSection(sec, bigPool, rng, used);
      picked.forEach((p) => used.add(p.id));
      return picked.map((p) => p.id);
    });
  }

  it("is reproducible: same runId → identical picks", () => {
    expect(runOnce("run-A")).toEqual(runOnce("run-A"));
  });

  it("differs across runIds", () => {
    expect(runOnce("run-A")).not.toEqual(runOnce("run-B"));
  });

  it("never repeats an item across sections", () => {
    const picks = runOnce("run-A").flat();
    expect(new Set(picks).size).toBe(picks.length);
  });
});

describe("pickCodingItemsForSection", () => {
  const codingPool: QuizItem[] = [
    coding,
    { ...coding, id: "c-2", topic: "arrays", track: "dsa" },
    { ...coding, id: "c-3", topic: "strings", track: "python" },
  ];

  it("picks coding items by track/topic up to problemCount", () => {
    const picked = pickCodingItemsForSection(
      { durationMinutes: 30, problemCount: 5, pool: { track: "python" } },
      codingPool,
      () => 0,
    );
    expect(picked.map((i) => i.id).sort()).toEqual(["c-1", "c-3"]);
    expect(picked.every((i) => i.type === "coding")).toBe(true);
  });

  it("respects topic filter and exclusion set", () => {
    const picked = pickCodingItemsForSection(
      { durationMinutes: 30, problemCount: 5, pool: { track: "python" } },
      codingPool,
      () => 0,
      new Set(["c-1"]),
    );
    expect(picked.map((i) => i.id)).toEqual(["c-3"]);
  });
});
