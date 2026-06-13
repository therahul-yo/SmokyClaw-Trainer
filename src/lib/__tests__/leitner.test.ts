import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  bucketDays,
  dueRecords,
  isDue,
  newRecord,
} from "../leitner";
import type { LeitnerBucket } from "../../types";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe("leitner", () => {
  it("new records are due immediately", () => {
    const r = newRecord("item-1", NOW);
    expect(r.bucket).toBe(0);
    expect(isDue(r, NOW)).toBe(true);
  });

  it("correct answers climb one bucket and schedule the right interval", () => {
    let r = newRecord("item-1", NOW);
    const expectedDays = [1, 3, 7, 14, 30];
    for (let i = 0; i < expectedDays.length; i++) {
      r = applyAttempt(r, true, NOW);
      expect(r.bucket).toBe(Math.min(5, i + 1));
      expect(r.nextDueAt).toBe(NOW + expectedDays[i] * DAY);
    }
  });

  it("caps at bucket 5", () => {
    let r = newRecord("item-1", NOW);
    for (let i = 0; i < 10; i++) r = applyAttempt(r, true, NOW);
    expect(r.bucket).toBe(5);
  });

  it("a wrong answer drops straight to bucket 1, not 0", () => {
    let r = newRecord("item-1", NOW);
    for (let i = 0; i < 4; i++) r = applyAttempt(r, true, NOW);
    expect(r.bucket).toBe(4);
    r = applyAttempt(r, false, NOW);
    expect(r.bucket).toBe(1);
    expect(r.nextDueAt).toBe(NOW + 1 * DAY);
  });

  it("tracks attempt counts", () => {
    let r = newRecord("item-1", NOW);
    r = applyAttempt(r, true, NOW);
    r = applyAttempt(r, false, NOW);
    expect(r.totalAttempts).toBe(2);
    expect(r.correctAttempts).toBe(1);
  });

  it("dueRecords filters by nextDueAt", () => {
    const due = { ...newRecord("a", NOW), nextDueAt: NOW - 1 };
    const notDue = { ...newRecord("b", NOW), nextDueAt: NOW + DAY };
    expect(dueRecords([due, notDue], NOW).map((r) => r.itemId)).toEqual(["a"]);
  });

  it("bucketDays matches the documented schedule", () => {
    const schedule: Record<LeitnerBucket, number> = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
    for (const [bucket, days] of Object.entries(schedule)) {
      expect(bucketDays(Number(bucket) as LeitnerBucket)).toBe(days);
    }
  });
});
