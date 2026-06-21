// smokey — a local, deterministic coach.
//
// This is NLG (natural-language *generation*), not NLP: there is no model and
// nothing leaves the browser. smokey runs detectors over your own attempt
// history and turns the structured findings into plain-English advisories via
// templates. The "intelligence" lives in the detectors (what's worth saying)
// and a date-seeded picker (so phrasing is varied but stable within a day).

import type {
  Attempt,
  Lesson,
  MockTestBlueprint,
  QuizItem,
  ReviewRecord,
  TrackId,
} from "../types";
import { todayKey } from "./daily";
import { hashString } from "./hash";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Severity = "alert" | "warn" | "info" | "win";

export const SEVERITY_COLOR: Record<Severity, string> = {
  alert: "var(--color-danger)",
  warn: "var(--color-amber)",
  win: "var(--color-accent)",
  info: "var(--color-cyan)",
};

export type Advisory = {
  id: string;
  severity: Severity;
  icon: string;
  text: string;
  cta?: { label: string; to: string };
};

export type Readiness = {
  id: MockTestBlueprint["id"];
  title: string;
  pct: number;
  etaDays: number | null; // null = not enough momentum to estimate
};

export type StudyWindow = {
  band: string;
  accuracy: number;
  otherAccuracy: number;
};

export type SmokeyReport = {
  advisories: Advisory[];
  readiness: Readiness[];
  window: StudyWindow | null;
  stats: {
    total: number;
    last7: number;
    accuracy: number; // overall, %
    streak: number;
  };
  greeting: string;
};

export type SmokeyInput = {
  attempts: Attempt[];
  items: QuizItem[];
  lessons: Lesson[];
  completedLessonIds: string[];
  reviewRecords: ReviewRecord[];
  streak: { current: number; longest: number };
  blueprints: MockTestBlueprint[];
};

// Deterministic 32-bit FNV-1a hash lives in lib/hash.ts (shared with the
// training-machine stable-picker and the daily-challenge picker — each
// used to have an identical private copy that would drift on the first
// refactor; see lib/hash.ts for the rationale).

// Milliseconds from `now` (ms epoch) until the next local midnight.
// Uses local-date components so the result is correct for non-UTC users
// and across DST transitions. Exported for testability.
export function msToLocalMidnight(now: number): number {
  const d = new Date(now);
  const tomorrow = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return tomorrow.getTime() - now;
}

// Pick one phrasing, stable for a given seed.
function pick(templates: string[], seed: number): string {
  return templates[seed % templates.length];
}

const SEVERITY_RANK: Record<Severity, number> = {
  alert: 0,
  warn: 1,
  win: 2,
  info: 3,
};

type LatestAttempt = { correct: boolean; at: number; count: number };

function latestByItem(attempts: Attempt[]): Map<string, LatestAttempt> {
  const map = new Map<string, LatestAttempt>();
  for (const a of attempts) {
    const cur = map.get(a.itemId);
    if (!cur) {
      map.set(a.itemId, { correct: a.correct, at: a.attemptedAt, count: 1 });
    } else {
      cur.count += 1;
      if (a.attemptedAt > cur.at) {
        cur.at = a.attemptedAt;
        cur.correct = a.correct;
      }
    }
  }
  return map;
}

function quizTopicLink(item: QuizItem): string {
  return `/quiz/${item.track}/${item.topic}`;
}

// ── readiness per mock blueprint ───────────────────────────────

function blueprintItemIds(bp: MockTestBlueprint, items: QuizItem[]): string[] {
  const picks: { track: TrackId; topics?: string[]; type?: QuizItem["type"] }[] =
    [];
  for (const sec of bp.sections) {
    const pf = Array.isArray(sec.pickFrom) ? sec.pickFrom : [sec.pickFrom];
    picks.push(...pf);
  }
  if (bp.codingSection) {
    picks.push({
      track: bp.codingSection.pool.track,
      topics: bp.codingSection.pool.topics,
    });
  }
  const ids = new Set<string>();
  for (const item of items) {
    for (const p of picks) {
      if (item.track !== p.track) continue;
      if (p.type && item.type !== p.type) continue;
      if (p.topics && p.topics.length > 0 && !p.topics.includes(item.topic))
        continue;
      ids.add(item.id);
      break;
    }
  }
  return [...ids];
}

function computeReadiness(
  bp: MockTestBlueprint,
  items: QuizItem[],
  latest: Map<string, LatestAttempt>,
  now: number,
): Readiness {
  const ids = blueprintItemIds(bp, items);
  if (ids.length === 0)
    return { id: bp.id, title: bp.title, pct: 0, etaDays: null };

  let mastered = 0;
  let masteredLast7 = 0;
  for (const id of ids) {
    const la = latest.get(id);
    if (la?.correct) {
      mastered += 1;
      if (now - la.at <= 7 * DAY_MS) masteredLast7 += 1;
    }
  }
  const pct = Math.round((mastered / ids.length) * 100);

  // ETA: how long to reach ~85% mastery at the current weekly pace.
  const target = Math.ceil(ids.length * 0.85);
  const remaining = Math.max(0, target - mastered);
  let etaDays: number | null;
  if (remaining === 0) etaDays = 0;
  else if (masteredLast7 <= 0) etaDays = null;
  else etaDays = Math.min(90, Math.ceil(remaining / (masteredLast7 / 7)));

  return { id: bp.id, title: bp.title, pct, etaDays };
}

// ── best study window ──────────────────────────────────────────

const BANDS: { name: string; lo: number; hi: number }[] = [
  { name: "morning", lo: 5, hi: 12 },
  { name: "afternoon", lo: 12, hi: 17 },
  { name: "evening", lo: 17, hi: 21 },
  { name: "late night", lo: 21, hi: 29 }, // 21:00–05:00 (wraps)
];

function bandFor(hour: number): string {
  for (const b of BANDS) {
    const h = hour < 5 ? hour + 24 : hour;
    if (h >= b.lo && h < b.hi) return b.name;
  }
  return "late night";
}

function bestWindow(attempts: Attempt[]): StudyWindow | null {
  if (attempts.length < 12) return null;
  const agg = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const hour = new Date(a.attemptedAt).getHours();
    const band = bandFor(hour);
    const cur = agg.get(band) ?? { total: 0, correct: 0 };
    cur.total += 1;
    if (a.correct) cur.correct += 1;
    agg.set(band, cur);
  }
  const scored = [...agg.entries()]
    .filter(([, v]) => v.total >= 5)
    .map(([band, v]) => ({
      band,
      accuracy: Math.round((v.correct / v.total) * 100),
      total: v.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  if (scored.length < 2) return null;
  const best = scored[0];
  const rest = scored.slice(1);
  const otherAccuracy = Math.round(
    rest.reduce((s, x) => s + x.accuracy, 0) / rest.length,
  );
  // Only worth mentioning if the gap is real.
  if (best.accuracy - otherAccuracy < 10) return null;
  return { band: best.band, accuracy: best.accuracy, otherAccuracy };
}

// ── the engine ─────────────────────────────────────────────────

export function runSmokey(input: SmokeyInput, now: number): SmokeyReport {
  const { attempts, items, lessons, completedLessonIds, streak, blueprints } =
    input;
  const seed = hashString(todayKey(new Date(now)));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const latest = latestByItem(attempts);

  const total = attempts.length;
  const last7 = attempts.filter((a) => now - a.attemptedAt <= 7 * DAY_MS).length;
  const overallCorrect = attempts.filter((a) => a.correct).length;
  const accuracy = total > 0 ? Math.round((overallCorrect / total) * 100) : 0;

  const readiness = blueprints.map((bp) =>
    computeReadiness(bp, items, latest, now),
  );
  const window = bestWindow(attempts);

  const advisories: Advisory[] = [];
  const todayK = todayKey(new Date(now));
  const activeToday = attempts.some(
    (a) => todayKey(new Date(a.attemptedAt)) === todayK,
  );
  const hour = new Date(now).getHours();
  const minsToMidnight = Math.round(msToLocalMidnight(now) / 60000);

  // 1 — cold start: not enough data to coach.
  if (total < 5) {
    advisories.push({
      id: "cold-start",
      severity: "info",
      icon: "◌",
      text: pick(
        [
          "still learning your patterns — solve a few drills and i'll start coaching for real.",
          "give me ~5 attempts and i can spot your weak topics. let's get some signal.",
          "fresh log. drill a couple of problems and i'll tell you where you actually stand.",
        ],
        seed,
      ),
      cta: { label: "start a drill", to: "/track/dsa" },
    });
  }

  // 2 — streak at risk (late in the day, nothing solved yet).
  if (streak.current >= 2 && !activeToday && hour >= 19) {
    advisories.push({
      id: "streak-risk",
      severity: "alert",
      icon: "◷",
      text: pick(
        [
          `streak ${streak.current}d expires in ${minsToMidnight} min. one drill saves it.`,
          `${minsToMidnight} min left to keep your ${streak.current}d streak. don't drop it now.`,
          `clock's ticking — ${streak.current}d streak dies at midnight. ~4 minutes of work.`,
        ],
        seed,
      ),
      cta: { label: "save the streak", to: "/review" },
    });
  } else if (streak.current >= 3 && activeToday) {
    advisories.push({
      id: "streak-win",
      severity: "win",
      icon: "▲",
      text: pick(
        [
          `streak ${streak.current}d and you've already shown up today. that's the habit.`,
          `${streak.current} days running. consistency is doing the work here.`,
        ],
        seed,
      ),
    });
  }

  // 3 — pattern/topic slipping (recent low accuracy on enough volume).
  {
    const recent = attempts.filter((a) => now - a.attemptedAt <= 7 * DAY_MS);
    const groups = new Map<
      string,
      { total: number; correct: number; rep: QuizItem }
    >();
    for (const a of recent) {
      const item = itemById.get(a.itemId);
      if (!item) continue;
      const key = `${item.track}:${item.pattern ?? item.topic}`;
      const g = groups.get(key) ?? { total: 0, correct: 0, rep: item };
      g.total += 1;
      if (a.correct) g.correct += 1;
      groups.set(key, g);
    }
    const slipping = [...groups.values()]
      .filter((g) => g.total >= 3 && g.correct / g.total < 0.5)
      .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
    if (slipping) {
      const label = slipping.rep.pattern ?? slipping.rep.topic;
      advisories.push({
        id: "slipping",
        severity: "warn",
        icon: "⚠",
        text: pick(
          [
            `${label}'s slipping — ${slipping.total - slipping.correct}/${slipping.total} wrong this week. worth a refresher.`,
            `you're missing ${label} lately (${slipping.correct}/${slipping.total} this week). let's shore it up.`,
            `${label} is your softest spot right now — only ${Math.round((slipping.correct / slipping.total) * 100)}% this week.`,
          ],
          seed,
        ),
        cta: { label: `drill ${label}`, to: quizTopicLink(slipping.rep) },
      });
    }
  }

  // 4 — retention risk: nailed once long ago, never revisited.
  {
    let candidate: { item: QuizItem; ageDays: number } | null = null;
    for (const [id, la] of latest) {
      if (!la.correct || la.count > 2) continue;
      const ageDays = (now - la.at) / DAY_MS;
      if (ageDays < 8) continue;
      const item = itemById.get(id);
      if (!item) continue;
      if (!candidate || ageDays > candidate.ageDays)
        candidate = { item, ageDays };
    }
    if (candidate) {
      const label = candidate.item.pattern ?? candidate.item.topic;
      const d = Math.round(candidate.ageDays);
      advisories.push({
        id: "retention",
        severity: "warn",
        icon: "↻",
        text: pick(
          [
            `you solved a ${label} problem ${d}d ago and never came back. retention risk — resurfacing it.`,
            `${label} hasn't been touched in ${d} days. one-and-done doesn't stick. let's re-solve.`,
          ],
          seed,
        ),
        cta: { label: "review it", to: "/review" },
      });
    }
  }

  // 5 — avoidance: read the lessons, never drilled the track.
  {
    const completedSet = new Set(completedLessonIds);
    const lessonsByTrack = new Map<TrackId, number>();
    for (const l of lessons) {
      if (completedSet.has(l.id))
        lessonsByTrack.set(l.track, (lessonsByTrack.get(l.track) ?? 0) + 1);
    }
    const attemptedTracks = new Set<TrackId>();
    for (const a of attempts) {
      const item = itemById.get(a.itemId);
      if (item) attemptedTracks.add(item.track);
    }
    let avoidedTrack: TrackId | null = null;
    let read = 0;
    for (const [track, n] of lessonsByTrack) {
      if (!attemptedTracks.has(track) && n > read) {
        avoidedTrack = track;
        read = n;
      }
    }
    if (avoidedTrack) {
      advisories.push({
        id: "avoidance",
        severity: "info",
        icon: "→",
        text: pick(
          [
            `you've read ${read} ${avoidedTrack} lesson${read === 1 ? "" : "s"} but never drilled a single problem. reading ≠ knowing.`,
            `${read} ${avoidedTrack} lessons done, zero problems attempted. time to actually code it.`,
          ],
          seed,
        ),
        cta: { label: `drill ${avoidedTrack}`, to: `/track/${avoidedTrack}` },
      });
    }
  }

  // 6 — win: a topic you're crushing.
  {
    const recent = attempts.filter((a) => now - a.attemptedAt <= 14 * DAY_MS);
    const groups = new Map<
      string,
      { total: number; correct: number; rep: QuizItem }
    >();
    for (const a of recent) {
      const item = itemById.get(a.itemId);
      if (!item) continue;
      const key = `${item.track}:${item.pattern ?? item.topic}`;
      const g = groups.get(key) ?? { total: 0, correct: 0, rep: item };
      g.total += 1;
      if (a.correct) g.correct += 1;
      groups.set(key, g);
    }
    const crushing = [...groups.values()]
      .filter((g) => g.total >= 4 && g.correct / g.total >= 0.9)
      .sort((a, b) => b.total - a.total)[0];
    if (crushing) {
      const label = crushing.rep.pattern ?? crushing.rep.topic;
      advisories.push({
        id: "mastery-win",
        severity: "win",
        icon: "✓",
        text: pick(
          [
            `${label} is locked in — ${crushing.correct}/${crushing.total} lately. move on to harder ground.`,
            `you've got ${label} cold (${Math.round((crushing.correct / crushing.total) * 100)}%). promote yourself to the next pattern.`,
          ],
          seed,
        ),
      });
    }
  }

  // 6.5 — speed regression
  {
    const oneDay = 24 * 60 * 60 * 1000;
    const recentThreshold = now - 7 * oneDay;
    const historicalThreshold = now - 28 * oneDay;

    // Group correct attempts by topic/pattern
    const topicCorrectAttempts = new Map<string, { recent: Attempt[]; historical: Attempt[]; rep: QuizItem }>();
    for (const a of attempts) {
      if (!a.correct || a.timeMs <= 0) continue;
      const item = itemById.get(a.itemId);
      if (!item) continue;
      const key = item.pattern ?? item.topic;
      const grp = topicCorrectAttempts.get(key) ?? { recent: [], historical: [], rep: item };
      if (a.attemptedAt >= recentThreshold) {
        grp.recent.push(a);
      } else if (a.attemptedAt >= historicalThreshold) {
        grp.historical.push(a);
      }
      topicCorrectAttempts.set(key, grp);
    }

    let speedRegressedTopic: string | null = null;
    let recentAvgSec = 0;
    let histAvgSec = 0;
    let regressedRep: QuizItem | null = null;

    for (const [topic, grp] of topicCorrectAttempts.entries()) {
      if (grp.recent.length >= 2 && grp.historical.length >= 3) {
        const recentAvg = grp.recent.reduce((sum, a) => sum + a.timeMs, 0) / grp.recent.length;
        const histAvg = grp.historical.reduce((sum, a) => sum + a.timeMs, 0) / grp.historical.length;
        
        // Speed regressed if recent average is 1.5x slower than historical average
        // and both are non-trivial (> 2 seconds)
        if (recentAvg > 1.5 * histAvg && recentAvg > 2000) {
          speedRegressedTopic = topic;
          recentAvgSec = Math.round(recentAvg / 1000);
          histAvgSec = Math.round(histAvg / 1000);
          regressedRep = grp.rep;
          break; // Report the first one we find
        }
      }
    }

    if (speedRegressedTopic && regressedRep) {
      advisories.push({
        id: "speed-regression",
        severity: "warn",
        icon: "◷",
        text: `speed regression on ${speedRegressedTopic}: taking ${recentAvgSec}s lately vs ${histAvgSec}s previously. focus on typing and classification speed.`,
        cta: { label: "drill it", to: quizTopicLink(regressedRep) },
      });
    }
  }

  // 6.6 — difficulty avoidance
  {
    const recentAttempts = attempts.filter((a) => now - a.attemptedAt <= 14 * DAY_MS);
    const easyCount = recentAttempts.filter((a) => {
      const item = itemById.get(a.itemId);
      return item?.difficulty === "easy";
    }).length;
    const easyCorrect = recentAttempts.filter((a) => {
      const item = itemById.get(a.itemId);
      return item?.difficulty === "easy" && a.correct;
    }).length;
    const mediumHardCount = recentAttempts.filter((a) => {
      const item = itemById.get(a.itemId);
      return item?.difficulty === "medium" || item?.difficulty === "hard";
    }).length;

    const easyAccuracy = easyCount > 0 ? easyCorrect / easyCount : 0;

    if (easyCount >= 6 && easyAccuracy >= 0.8 && mediumHardCount <= 1) {
      advisories.push({
        id: "difficulty-avoidance",
        severity: "info",
        icon: "↗",
        text: `you're mastering easy items (${Math.round(easyAccuracy * 100)}% accuracy) but avoiding medium and hard challenges. time to push your limits!`,
        cta: { label: "start machine loop", to: "/machine" },
      });
    }
  }

  // 7 — best study window.
  if (window) {
    advisories.push({
      id: "study-window",
      severity: "info",
      icon: "◔",
      text: pick(
        [
          `you're sharpest in the ${window.band} — ${window.accuracy}% vs ${window.otherAccuracy}% otherwise. schedule hard topics then.`,
          `your ${window.band} accuracy (${window.accuracy}%) beats the rest of the day (${window.otherAccuracy}%). that's your window.`,
        ],
        seed,
      ),
    });
  }

  // 8 — readiness call-out for the nearest mock.
  {
    const ranked = [...readiness]
      .filter((r) => r.pct > 0)
      .sort((a, b) => b.pct - a.pct);
    const top = ranked[0];
    if (top) {
      const etaText =
        top.etaDays === 0
          ? "you're basically ready — go take it."
          : top.etaDays
            ? `~${top.etaDays}d to ready at this pace.`
            : "drill more to get an ETA.";
      advisories.push({
        id: `readiness-${top.id}`,
        severity: top.pct >= 80 ? "win" : "info",
        icon: "▣",
        text: `${top.title} readiness: ${top.pct}%. ${etaText}`,
        cta: { label: `mock ${top.title}`, to: `/mock/${top.id}` },
      });
    }
  }

  advisories.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const greeting = pick(
    [
      "here's what i'm seeing in your log.",
      "read your attempts. here's the honest take.",
      "coach mode. no fluff — here's where you stand.",
    ],
    seed,
  );

  return {
    advisories,
    readiness,
    window,
    stats: { total, last7, accuracy, streak: streak.current },
    greeting,
  };
}
