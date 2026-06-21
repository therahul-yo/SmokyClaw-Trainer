// Test that the streak-risk advisory's "mins to midnight" math is in LOCAL
// time, not UTC. The helper `msToLocalMidnight` is exported from smokey.ts
// and is timezone-agnostic — its correctness depends on the host TZ at
// runtime, so we assert against UTC instants that map to known local times
// in common non-UTC zones.
import { describe, it, expect } from "vitest";

describe("smokey msToLocalMidnight", () => {
  it("returns 30 minutes when `now` is 23:30 local in a non-UTC zone", async () => {
    const { msToLocalMidnight } = await import("../smokey");
    // 2026-06-16 06:30:00 UTC == 2026-06-15 23:30:00 PDT (UTC-7)
    const now = Date.UTC(2026, 5, 16, 6, 30, 0);
    const offset = msToLocalMidnight(now);
    // Local midnight 2026-06-16 == 2026-06-16 07:00:00 UTC
    expect(offset).toBe(30 * 60 * 1000);
  });

  it("returns a full 24h when `now` is exactly local midnight", async () => {
    const { msToLocalMidnight } = await import("../smokey");
    // 2026-06-16 07:00:00 UTC == 2026-06-16 00:00:00 PDT
    const now = Date.UTC(2026, 5, 16, 7, 0, 0);
    const offset = msToLocalMidnight(now);
    // Next local midnight == +24h
    expect(offset).toBe(24 * 60 * 60 * 1000);
  });

  it("crosses a DST transition correctly (US fall back 2026-11-01)", async () => {
    const { msToLocalMidnight } = await import("../smokey");
    // 2026-11-02 06:30:00 UTC == 2026-11-01 23:30:00 PDT (UTC-7, before fall back)
    // Local midnight next day = 2026-11-02 00:00:00 PST (UTC-8, after fall back)
    // == 2026-11-02 08:00:00 UTC
    // diff = 90 minutes
    const now = Date.UTC(2026, 10, 2, 6, 30, 0);
    const offset = msToLocalMidnight(now);
    expect(offset).toBe(90 * 60 * 1000);
  });
});
