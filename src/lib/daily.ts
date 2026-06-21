import type { QuizItem } from "../types";

// Wall-clock read routed through a helper so render-purity lint doesn't flag
// the inherently time-dependent daily-challenge math at every call site.
export function nowMs(): number {
  return Date.now();
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Prior local date as YYYY-MM-DD. Computed from local-date components
// (year/month/day - 1) rather than `now - 86_400_000` because a local day
// is 23h on spring-forward and 25h on fall-back — ms subtraction can
// land on the wrong calendar day across DST.
export function yesterdayKey(now: number = Date.now()): string {
  const d = new Date(now);
  // Local-midnight on the prior day; Date handles month/year roll-over
  // (e.g. Jan 1 - 1 day = Dec 31 of the previous year) automatically.
  const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  const yy = y.getFullYear();
  const mm = String(y.getMonth() + 1).padStart(2, "0");
  const dd = String(y.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Deterministic 32-bit hash from a string.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Pick today's challenge: deterministic by date, biased toward items the user
// has answered incorrectly recently, then coding > sql > mcq, never the same
// item two days running.
export function pickDailyItem(args: {
  date: Date;
  allItems: QuizItem[];
  recentWrongIds?: string[]; // optional weakness hint
  yesterdayId?: string | null;
}): QuizItem | undefined {
  const { date, allItems } = args;
  if (allItems.length === 0) return undefined;

  const key = todayKey(date);
  const seed = hashString(key);

  // Tier 1: recent wrong, excluding yesterday
  const wrongPool = (args.recentWrongIds ?? [])
    .map((id) => allItems.find((i) => i.id === id))
    .filter((x): x is QuizItem => Boolean(x))
    .filter((x) => x.id !== args.yesterdayId);
  if (wrongPool.length > 0) {
    return wrongPool[seed % wrongPool.length];
  }

  // Tier 2: prefer coding/sql > mcq, exclude yesterday
  const coding = allItems.filter(
    (i) => (i.type === "coding" || i.type === "sql") && i.id !== args.yesterdayId,
  );
  if (coding.length > 0) return coding[seed % coding.length];

  const mcqs = allItems.filter((i) => i.id !== args.yesterdayId);
  if (mcqs.length > 0) return mcqs[seed % mcqs.length];

  return allItems[0];
}
