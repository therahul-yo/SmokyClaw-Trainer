import type { LeitnerBucket, ReviewRecord } from "../types";

// Leitner 5-bucket spaced repetition.
// Bucket → days until next review.
const BUCKET_DAYS: Record<LeitnerBucket, number> = {
  0: 0,   // new, due now
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function bucketDays(bucket: LeitnerBucket): number {
  return BUCKET_DAYS[bucket];
}

export function nextDueFromBucket(bucket: LeitnerBucket, now = Date.now()): number {
  return now + bucketDays(bucket) * MS_PER_DAY;
}

export function newRecord(itemId: string, now = Date.now()): ReviewRecord {
  return {
    itemId,
    bucket: 0,
    lastReviewedAt: 0,
    nextDueAt: now, // due immediately
    totalAttempts: 0,
    correctAttempts: 0,
  };
}

export function applyAttempt(
  record: ReviewRecord,
  correct: boolean,
  now = Date.now(),
): ReviewRecord {
  const nextBucket: LeitnerBucket = correct
    ? (Math.min(5, record.bucket + 1) as LeitnerBucket)
    : 1;
  return {
    ...record,
    bucket: nextBucket,
    lastReviewedAt: now,
    nextDueAt: nextDueFromBucket(nextBucket, now),
    totalAttempts: record.totalAttempts + 1,
    correctAttempts: record.correctAttempts + (correct ? 1 : 0),
  };
}

export function isDue(record: ReviewRecord, now = Date.now()): boolean {
  return record.nextDueAt <= now;
}

export function dueRecords(records: ReviewRecord[], now = Date.now()): ReviewRecord[] {
  return records.filter((r) => isDue(r, now));
}
