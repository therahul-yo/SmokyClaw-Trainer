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

export type TrainingStage =
  | "foundation"
  | "core-patterns"
  | "intermediate-patterns"
  | "advanced-patterns"
  | "interview-simulation"
  | "machine-mode";

export type RecognitionPrompt = {
  question: string;
  choices: ComplexityChoice[];
};

// Common optional fields for any quiz item.
export type QuizItemCommon = {
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
  // Machine-training metadata. Older content can omit these; the training
  // engine infers stage and speed gates from track, type, topic, and difficulty.
  stage?: TrainingStage;
  recognitionPrompt?: RecognitionPrompt;
  speedTargetSec?: number;
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
  // When true, the result array is compared as a multiset (element order
  // ignored) — for drills where any ordering of the output is correct.
  orderInsensitive?: boolean;
};

// stdin/stdout (online-judge style) test: the whole program is run with `stdin`
// piped in, and everything it prints is compared to `expectedStdout` (trailing
// whitespace per line and trailing blank lines are ignored). Used for company
// coding rounds that read input rather than fill in a function.
export type StdioTest = {
  stdin: string;
  expectedStdout: string;
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
  entry: string; // function name to invoke (function-return mode)
  tests: CodingTest[];
  // When present, the item is graded in stdin/stdout mode instead: the whole
  // program runs against each test's stdin and its output is compared.
  stdioTests?: StdioTest[];
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
  // When true, grading ignores row order (for queries with no deterministic
  // ORDER BY). Default false — most drills end with an explicit ORDER BY.
  orderInsensitive?: boolean;
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
  // Optional company filter. When set, the picker prefers items tagged with
  // this company but still allows untagged ("generic") items, so pools stay
  // feasible. An item tagged for a *different* company is excluded.
  company?: CompanyTag;
};

export type MockTestBlueprint = {
  id:
    | "tcs-nqt"
    | "tcs-nqt-cognitive"
    | "tcs-nqt-it-full"
    | "infosys-sp"
    | "infosys-irt"
    | "infosys-pseudocode-sprint"
    | "accenture-cognitive-technical"
    | "accenture-coding"
    | "accenture-full-flow"
    | "wipro-elite"
    | "capgemini"
    | "cognizant-genc"
    | "generic-dsa"
    | "sql-only";
  title: string;
  subtitle: string;
  sections: MockSection[];
  codingSection?: {
    durationMinutes: number;
    problemCount: number;
    pool: { track: TrackId; topics?: string[] };
  };
};

// Summary of one coding problem attempted during a mock's coding round,
// surfaced in the PostMockReport. (Full per-attempt detail — passed test count,
// hints — still lands in progressStore via CodingSandbox.)
export type MockCodingResult = {
  itemId: string;
  solved: boolean;
  gaveUp: boolean;
  timeMs: number;
};

// Persisted in-flight mock run — lets a 100+ minute exam survive a refresh.
export type MockTestRunState = {
  blueprintId: MockTestBlueprint["id"];
  runId: string; // seeds the picker so a resume re-picks identical questions
  startedAt: number;
  phase: "section" | "coding" | "done";
  sectionIdx: number;
  itemIdsBySection: string[][]; // pre-selected MCQ ids per section
  codingItemIds: string[]; // pre-selected coding-round problem ids
  sectionDeadlines: number[]; // epoch ms when each section auto-submits
  codingDeadline: number | null; // epoch ms when the coding round auto-submits
  mcqAnswers: Record<string, number>; // itemId -> chosen option index
  itemStartTsById: Record<string, number>; // first-seen ts per item, for timeMs
  codingResultsById: Record<string, MockCodingResult>;
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
