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
  pattern?: string;
};

export type Lesson = LessonMeta & {
  body: string;
};

export type Difficulty = "easy" | "medium" | "hard";

export type CompanyTag =
  | "tcs"
  | "infosys"
  | "wipro"
  | "capgemini"
  | "accenture"
  | "cognizant"
  | "amazon-india";

export type Approach = {
  code?: string;
  complexity: string; // free-form like "O(n log n) time, O(1) space"
  explanation: string;
};

export type Example = {
  input: string;
  output: string;
  explanation?: string;
};

export type ComplexityChoice = {
  label: string; // e.g. "O(n)"
  correct: boolean;
};

// Common optional fields for any quiz item.
type QuizItemCommon = {
  pattern?: string;
  hints?: string[];
  bruteForce?: Approach;
  optimal?: Approach;
  constraints?: string;
  examples?: Example[];
  companies?: CompanyTag[];
  estMinutes?: number;
  // Used by ComplexityCheck modal after a coding/SQL item passes.
  complexityCheck?: { question: string; choices: ComplexityChoice[] };
};

export type McqItem = QuizItemCommon & {
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

export type CodingItem = QuizItemCommon & {
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

export type SqlSchemaName = "employees" | "ecommerce" | "social";

export type SqlItem = QuizItemCommon & {
  id: string;
  track: TrackId;
  topic: string;
  type: "sql";
  difficulty: Difficulty;
  prompt: string;
  schema: SqlSchemaName;
  starter?: string;
  expected: { columns: string[]; rows: unknown[][] };
  explanation?: string;
  tags: string[];
};

export type QuizItem = McqItem | CodingItem | SqlItem;

// ────────── Patterns ──────────

export type Pattern = {
  id: string; // e.g. "sliding-window"
  track: TrackId;
  title: string;
  blurb: string;
  prerequisites: string[]; // other pattern ids
  lessonIds: string[];
  itemIds: string[];
};

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
  // Optional pedagogy signals — older attempts won't have these.
  hintsUsed?: number;
  gaveUp?: boolean;
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

// ────────── Study plan ──────────

export type StudyPlanDay = {
  dayIndex: number; // 0 = day 1
  date: string; // YYYY-MM-DD
  lessonIds: string[];
  itemIds: string[]; // new practice items
  reviewItemIds: string[]; // Leitner-due items
  estMinutes: number;
  note?: string; // e.g. "Mock test day"
};

export type StudyPlanMode = "cram" | "thorough";

export type StudyPlan = {
  id: string; // timestamp-based
  createdAt: number;
  startedAt: number;
  deadline: number; // epoch ms
  dailyMinutes: number;
  mode: StudyPlanMode;
  focusTracks: TrackId[];
  weakTopics: string[]; // user-declared at setup
  days: StudyPlanDay[];
};
