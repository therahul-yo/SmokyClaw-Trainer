// Shared local-date helpers.
//
// The streak and daily-challenge stores both need to bucket activity by
// local calendar day and compute the gap between two such days. They were
// each rolling their own version, and the two versions disagreed:
//
//   - streakStore used `new Date(a)` (parsed as UTC midnight), then did
//     `(b.getTime() - a.getTime()) / DAY_MS`. That's correct in UTC but
//     wrong relative to a non-UTC user's local-day boundary.
//   - dailyStore used `new Date(a + "T00:00:00")` (parsed as local midnight),
//     which is local-correct, but the math still doesn't survive the day
//     crossing a DST boundary because a local day is 23h on spring-forward
//     and 25h on fall-back.
//
// The helpers below are intentionally tz-agnostic at the input layer
// (they take either a `number` ms epoch or a `YYYY-MM-DD` string) but
// they route through `Date.UTC(...)` for the diff arithmetic so two
// calendar days are always exactly N * 86_400_000 ms apart, no matter
// where DST lands.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Local calendar day for the given instant, formatted YYYY-MM-DD.
 *
 * Uses local-date components (year/month/day) so the result matches what
 * a user in any timezone would read off their wall clock.
 */
export function dayKeyLocal(now: number = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Difference in local calendar days between two `YYYY-MM-DD` keys.
 *
 * Positive when `b` is later than `a`. Both arguments are parsed with
 * `Date.UTC(...)` so the result is the integer calendar-day gap even
 * when the interval crosses a spring-forward or fall-back transition.
 *
 * Examples (TZ=America/Los_Angeles):
 *   diffDaysLocal("2026-11-01", "2026-11-02") === 1  (across fall-back)
 *   diffDaysLocal("2026-03-08", "2026-03-09") === 1  (across spring-forward)
 *   diffDaysLocal("2026-12-31", "2027-01-01") === 1  (year boundary)
 *   diffDaysLocal("2026-06-15", "2026-06-15") === 0  (same day)
 */
export function diffDaysLocal(a: string, b: string): number {
  const [ay, am, ad] = parseKey(a);
  const [by, bm, bd] = parseKey(b);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((bMs - aMs) / DAY_MS);
}

function parseKey(key: string): [number, number, number] {
  const parts = key.split("-").map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`diffDaysLocal: expected YYYY-MM-DD, got ${key}`);
  }
  return [parts[0], parts[1], parts[2]];
}