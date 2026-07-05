// Derives per-topic correct-rate from the existing progressStore attempts log.
// No new telemetry — the data is already there, this just aggregates it.

import type { Attempt, QuizItem, TrackId } from "../types";

export type TopicScore = {
  track: TrackId;
  topic: string;
  attempts: number;
  correct: number;
  correctRate: number; // 0..1, defaults to 1.0 when zero attempts (untested → not flagged weak)
  weakness: number; // 0..1, higher = weaker
};

// Aggregate every attempt by (track, topic), using only the latest attempt per item
// so repeated retries don't double-count.
export function topicScores(attempts: Attempt[], items: QuizItem[]): TopicScore[] {
  const itemById = new Map(items.map((i) => [i.id, i]));

  // Latest attempt per item.
  const latestByItem = new Map<string, Attempt>();
  for (const a of attempts) {
    const cur = latestByItem.get(a.itemId);
    if (!cur || a.attemptedAt > cur.attemptedAt) latestByItem.set(a.itemId, a);
  }

  type Bucket = { track: TrackId; topic: string; attempts: number; correct: number };
  const buckets = new Map<string, Bucket>();

  for (const a of latestByItem.values()) {
    const item = itemById.get(a.itemId);
    if (!item) continue;
    const key = `${item.track}::${item.topic}`;
    const b = buckets.get(key) ?? { track: item.track, topic: item.topic, attempts: 0, correct: 0 };
    b.attempts += 1;
    if (a.correct) b.correct += 1;
    buckets.set(key, b);
  }

  return Array.from(buckets.values()).map((b) => {
    const correctRate = b.attempts === 0 ? 1 : b.correct / b.attempts;
    return { ...b, correctRate, weakness: 1 - correctRate };
  });
}

export function weakestTopics(
  attempts: Attempt[],
  items: QuizItem[],
  limit = 5,
): TopicScore[] {
  // The confidence gate counts RAW attempts (retries are still evidence),
  // while correctRate/weakness stay deduped to the latest attempt per item.
  const itemById = new Map(items.map((i) => [i.id, i]));
  const rawCounts = new Map<string, number>();
  for (const a of attempts) {
    const item = itemById.get(a.itemId);
    if (!item) continue;
    const key = `${item.track}::${item.topic}`;
    rawCounts.set(key, (rawCounts.get(key) ?? 0) + 1);
  }
  return topicScores(attempts, items)
    .filter((s) => (rawCounts.get(`${s.track}::${s.topic}`) ?? 0) >= 2) // need at least 2 data points before flagging weak
    .sort((a, b) => b.weakness - a.weakness)
    .slice(0, limit);
}

// Score per item for ranking: weaker topic → higher score; user-declared weak → +0.5.
export function itemWeight(
  item: QuizItem,
  scores: TopicScore[],
  userWeakTopics: string[],
): number {
  const score = scores.find((s) => s.track === item.track && s.topic === item.topic);
  const base = score ? score.weakness : 0.3; // untested topics get modest weight
  const declared = userWeakTopics.includes(item.topic) ? 0.5 : 0;
  return base + declared;
}
