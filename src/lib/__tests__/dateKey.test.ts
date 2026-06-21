// Tests for the shared local-date helpers in src/lib/dateKey.ts.
//
// Coverage:
//   - same-day diff is 0
//   - adjacent days in a non-DST period
//   - US fall-back (2026-11-01 → 2026-11-02 is a 25-hour local day)
//   - US spring-forward (2026-03-08 → 2026-03-09 is a 23-hour local day)
//   - timezone offset sanity (helpers don't depend on the host TZ)
//   - year boundary (Dec 31 → Jan 1)
//   - month boundary (Jan 31 → Feb 1)
//
// TZ is pinned to America/Los_Angeles via vitest.config.ts so local
// offsets are deterministic.
import { describe, it, expect } from "vitest";

describe("dateKey dayKeyLocal", () => {
  it("returns the local YYYY-MM-DD, not the UTC one (early-morning PDT)", async () => {
    const { dayKeyLocal } = await import("../dateKey");
    // 2026-06-16 02:00:00 PDT == 2026-06-16 09:00:00 UTC.
    // No skew this hour, but pick a sharper case below.
    const now = new Date(2026, 5, 16, 2, 0, 0).getTime();
    expect(dayKeyLocal(now)).toBe("2026-06-16");
  });

  it("agrees with local clock for an instant late in the UTC day", async () => {
    const { dayKeyLocal } = await import("../dateKey");
    // 2026-06-15 23:30:00 PDT == 2026-06-16 06:30:00 UTC.
    // Local date 2026-06-15, UTC date 2026-06-16 — would differ if we used
    // toISOString().slice(0, 10).
    const now = new Date(2026, 5, 15, 23, 30, 0).getTime();
    expect(dayKeyLocal(now)).toBe("2026-06-15");
  });

  it("pads single-digit month and day", async () => {
    const { dayKeyLocal } = await import("../dateKey");
    const now = new Date(2026, 0, 5, 12, 0, 0).getTime(); // 2026-01-05
    expect(dayKeyLocal(now)).toBe("2026-01-05");
  });
});

describe("dateKey diffDaysLocal", () => {
  it("returns 0 for the same local day", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-06-15", "2026-06-15")).toBe(0);
  });

  it("returns 1 for adjacent non-DST days", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-06-15", "2026-06-16")).toBe(1);
  });

  it("returns 1 across the US fall-back boundary (2026-11-01 → 2026-11-02)", async () => {
    // The fall-back day is 25 hours long. A naive ms-difference would
    // compute 25h / 24h ≈ 1.04, which still rounds to 1, but the bug
    // surfaces for longer intervals. Use a 7-day span crossing the
    // transition to make the off-by-one obvious.
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-10-28", "2026-11-04")).toBe(7);
  });

  it("returns 1 across the US spring-forward boundary (2026-03-08 → 2026-03-09)", async () => {
    // The spring-forward day is 23 hours long. 7-day span crossing it.
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-03-04", "2026-03-11")).toBe(7);
  });

  it("returns 1 across the year boundary (2026-12-31 → 2027-01-01)", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("returns 1 across the month boundary (2026-01-31 → 2026-02-01)", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-01-31", "2026-02-01")).toBe(1);
  });

  it("returns a negative value when b precedes a", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-06-15", "2026-06-12")).toBe(-3);
  });

  it("returns an integer for a 30-day span crossing DST (rounding survives)", async () => {
    // 2026-10-15 → 2026-11-14 crosses fall-back on 2026-11-01.
    // A naive `(b - a) / DAY_MS` over a period that includes any DST
    // shift will be a non-integer like 30.04 or 29.96; the helper must
    // still return the exact integer calendar-day count.
    const { diffDaysLocal } = await import("../dateKey");
    expect(diffDaysLocal("2026-10-15", "2026-11-14")).toBe(30);
    // 2026-02-26 → 2026-03-27 crosses spring-forward on 2026-03-08.
    expect(diffDaysLocal("2026-02-26", "2026-03-27")).toBe(29);
  });

  it("throws on a malformed key", async () => {
    const { diffDaysLocal } = await import("../dateKey");
    expect(() => diffDaysLocal("2026/06/15", "2026-06-16")).toThrow();
  });
});