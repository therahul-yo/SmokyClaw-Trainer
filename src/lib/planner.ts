// Adaptive study plan generator. Deterministic — no ML, no randomness beyond a seeded shuffle.
//
// Input: deadline, daily-minutes budget, focus tracks, user-declared weak topics,
// plus the current attempts log (to score weakness) and Leitner-due item ids.
// Output: a StudyPlan with one bucket per day, capped at the daily budget.

import type {
  Attempt,
  Lesson,
  QuizItem,
  StudyPlan,
  StudyPlanDay,
  StudyPlanMode,
  TrackId,
} from "../types";
import { itemWeight, topicScores } from "./weakness";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Default minutes when an item or lesson has no explicit estimate.
const DEFAULT_ITEM_MINUTES: Record<QuizItem["type"], number> = {
  mcq: 2,
  coding: 18,
  sql: 12,
};

function itemMinutes(item: QuizItem): number {
  return item.estMinutes ?? DEFAULT_ITEM_MINUTES[item.type];
}

function lessonMinutes(lesson: Lesson): number {
  return lesson.estMinutes || 8;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type PlanInput = {
  deadline: Date;
  dailyMinutes: number;
  focusTracks: TrackId[];
  weakTopics: string[];
  attempts: Attempt[];
  dueReviewIds: string[];
  allItems: QuizItem[];
  allLessons: Lesson[];
  now?: Date;
};

export function generatePlan(input: PlanInput): StudyPlan {
  const now = input.now ?? new Date();
  const days = Math.max(1, Math.ceil((input.deadline.getTime() - now.getTime()) / MS_PER_DAY));
  const mode: StudyPlanMode = days <= 7 ? "cram" : "thorough";

  const tracks = input.focusTracks.length > 0 ? input.focusTracks : (["python", "dsa", "sql", "aptitude"] as TrackId[]);

  // Pool: only items in focus tracks. Lessons same.
  const itemPool = input.allItems.filter((i) => tracks.includes(i.track));
  const lessonPool = input.allLessons.filter((l) => tracks.includes(l.track));

  // O(1) lookups for the due-review loop below — without this the inner
  // itemPool.find() turns the per-day review pass into O(n*m).
  const itemById = new Map(itemPool.map((q) => [q.id, q]));

  // Weight items by topic weakness.
  const scores = topicScores(input.attempts, itemPool);
  const weightedItems = itemPool
    .map((item) => ({ item, w: itemWeight(item, scores, input.weakTopics) }))
    .sort((a, b) => b.w - a.w);

  // Track which items we've already placed so we don't repeat across days.
  const placedItems = new Set<string>();
  const placedLessons = new Set<string>();
  const reviewSet = new Set(input.dueReviewIds);

  // Round-robin the track order across days so the plan alternates.
  const trackOrder = tracks;

  const dayBuckets: StudyPlanDay[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now.getTime() + i * MS_PER_DAY);
    const trackForToday = trackOrder[i % trackOrder.length];

    const bucket: StudyPlanDay = {
      dayIndex: i,
      date: ymd(date),
      lessonIds: [],
      itemIds: [],
      reviewItemIds: [],
      estMinutes: 0,
    };

    let budget = input.dailyMinutes;

    // 1. Leitner-due items first (interleave from the global due set).
    for (const id of input.dueReviewIds) {
      if (placedItems.has(id) || !reviewSet.has(id)) continue;
      const item = itemById.get(id);
      if (!item) continue;
      const m = itemMinutes(item);
      if (m > budget) break;
      bucket.reviewItemIds.push(id);
      placedItems.add(id);
      reviewSet.delete(id);
      budget -= m;
    }

    // 2. One lesson from today's track if any unread remain.
    const nextLesson = lessonPool.find((l) => l.track === trackForToday && !placedLessons.has(l.id));
    if (nextLesson && lessonMinutes(nextLesson) <= budget) {
      bucket.lessonIds.push(nextLesson.id);
      placedLessons.add(nextLesson.id);
      budget -= lessonMinutes(nextLesson);
    }

    // 3. Practice items prioritized by weakness, biased toward today's track.
    for (const { item } of weightedItems) {
      if (placedItems.has(item.id)) continue;
      if (item.track !== trackForToday && bucket.itemIds.length < 2) {
        // First two practice slots must hit today's track if anything's available.
        continue;
      }
      const m = itemMinutes(item);
      if (m > budget) continue;
      bucket.itemIds.push(item.id);
      placedItems.add(item.id);
      budget -= m;
      if (budget < 5) break;
    }

    bucket.estMinutes = input.dailyMinutes - budget;

    // 4. Mock-test day markers — thorough plans get full mocks at the 1/2, 3/4, end marks.
    if (mode === "thorough") {
      const markers = [Math.floor(days / 2), Math.floor((days * 3) / 4), days - 1];
      if (markers.includes(i)) bucket.note = "Full mock test recommended today.";
    } else if (mode === "cram" && i === days - 1) {
      bucket.note = "Final day — run a full mock test.";
    }

    dayBuckets.push(bucket);
  }

  return {
    id: `plan-${now.getTime()}`,
    createdAt: now.getTime(),
    startedAt: now.getTime(),
    deadline: input.deadline.getTime(),
    dailyMinutes: input.dailyMinutes,
    mode,
    focusTracks: tracks,
    weakTopics: input.weakTopics,
    days: dayBuckets,
  };
}

// Find today's day-bucket inside a plan; null if today is past the deadline.
export function todayBucket(plan: StudyPlan, now = new Date()): StudyPlanDay | null {
  const today = ymd(now);
  return plan.days.find((d) => d.date === today) ?? null;
}
