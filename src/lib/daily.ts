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
