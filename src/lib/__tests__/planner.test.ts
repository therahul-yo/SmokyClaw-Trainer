// Test that the planner's day-bucket key (ymd) uses local-date components,
// not UTC. With the old `d.toISOString().slice(0, 10)` a user in
// America/Los_Angeles could end up on the previous or next UTC day and
// miss their bucket entirely.
import { describe, it, expect } from "vitest";

describe("planner ymd (local date)", () => {
  it("returns the local YYYY-MM-DD, not the UTC one", async () => {
    const { todayBucket, generatePlan } = await import("../planner");
    // We don't have a direct export of ymd, so we exercise it through
    // generatePlan + todayBucket. Use a fixed `now` in the early hours
    // of a UTC day so a non-UTC user would be on the previous local day.
    // 2026-06-15 02:00:00 PDT (== 2026-06-15 09:00:00 UTC).
    // Local date = 2026-06-15. UTC date = 2026-06-15 (no skew this hour).
    // Pick a more aggressive skew:
    // 2026-06-15 23:30:00 PDT == 2026-06-16 06:30:00 UTC.
    // Local date = 2026-06-15, UTC date = 2026-06-16 — would differ.
    const localNow = new Date(2026, 5, 15, 23, 30, 0); // local clock
    const utcMs = localNow.getTime(); // local-relative "now"
    // Build a 7-day plan starting from this local now.
    const plan = generatePlan({
      deadline: new Date(utcMs + 7 * 86400_000),
      dailyMinutes: 30,
      focusTracks: [],
      weakTopics: [],
      attempts: [],
      dueReviewIds: [],
      allItems: [],
      allLessons: [],
      now: localNow,
    });
    // Day-0 bucket should be 2026-06-15 (local), not 2026-06-16 (UTC).
    expect(plan.days[0]?.date).toBe("2026-06-15");
    // todayBucket at the same local instant should find that bucket.
    const bucket = todayBucket(plan, localNow);
    expect(bucket?.date).toBe("2026-06-15");
  });
});
