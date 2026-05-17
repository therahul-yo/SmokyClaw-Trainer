// Shared types across the trainer app.

export type TrackId = "python" | "dsa" | "sql" | "aptitude";

export type Track = {
  id: TrackId;
  title: string;
  blurb: string;
  emoji: string;
  topics: string[];
};

export type LessonMeta = {
  id: string;
  title: string;
  track: TrackId;
  topic: string;
  order: number;
  estMinutes: number;
  prerequisites: string[];
};

export type Lesson = LessonMeta & {
  body: string;
};

export type Difficulty = "easy" | "medium" | "hard";

export type McqItem = {
  id: string;
  track: TrackId;
  topic: string;
  type: "mcq";
  difficulty: Difficulty;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  tags: string[];
};

export type CodingTest = {
  args: unknown[];
  expect: unknown;
};

export type CodingItem = {
  id: string;
  track: TrackId;
  topic: string;
  type: "coding";
  language: "python";
  difficulty: Difficulty;
  prompt: string;
  starter: string;
  entry: string; // function name to invoke
  tests: CodingTest[];
  explanation?: string;
  tags: string[];
};

export type SqlItem = {
  id: string;
  track: TrackId;
  topic: string;
  type: "sql";
  difficulty: Difficulty;
  prompt: string;
  schema: "employees" | "ecommerce";
  starter?: string;
  expected: { columns: string[]; rows: unknown[][] };
  explanation?: string;
  tags: string[];
};

export type QuizItem = McqItem | CodingItem | SqlItem;

// ────────── Leitner spaced repetition ──────────

export type LeitnerBucket = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = new (never attempted), 1..5 = bucket levels

export type ReviewRecord = {
  itemId: string;
  bucket: LeitnerBucket;
  lastReviewedAt: number; // epoch ms
  nextDueAt: number; // epoch ms
  totalAttempts: number;
  correctAttempts: number;
};

// ────────── Progress + attempts ──────────

export type Attempt = {
  itemId: string;
  correct: boolean;
  timeMs: number;
  attemptedAt: number;
};

export type LessonProgress = {
  lessonId: string;
  completedAt: number;
};

// ────────── Mock test blueprints ──────────

export type MockSection = {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  pickFrom:
    | { track: TrackId; topics?: string[]; type?: QuizItem["type"] }
    | { track: TrackId; topics?: string[]; type?: QuizItem["type"] }[];
};

export type MockTestBlueprint = {
  id: "tcs-nqt" | "infosys-sp";
  title: string;
  subtitle: string;
  sections: MockSection[];
  codingSection?: {
    durationMinutes: number;
    problemCount: number;
    pool: { track: TrackId; topics?: string[] };
  };
};

export type MockTestRunState = {
  blueprintId: MockTestBlueprint["id"];
  startedAt: number;
  currentSectionIndex: number;
  sectionDeadlines: number[]; // epoch ms when each section auto-submits
  itemIdsBySection: string[][]; // pre-selected items per section
  answersByItemId: Record<string, number | string | null>;
};
