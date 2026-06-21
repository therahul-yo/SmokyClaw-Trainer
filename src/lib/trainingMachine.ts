import type {
  Attempt,
  QuizItem,
  ReviewRecord,
  TrackId,
  TrainingStage,
} from "../types";

const STAGE_ORDER: TrainingStage[] = [
  "foundation",
  "core-patterns",
  "intermediate-patterns",
  "advanced-patterns",
  "interview-simulation",
  "machine-mode",
];

export type TrainingStageDefinition = {
  id: TrainingStage;
  label: string;
  targetPct: number;
  description: string;
};

export const TRAINING_STAGES: TrainingStageDefinition[] = [
  {
    id: "foundation",
    label: "Foundation",
    targetPct: 85,
    description: "Syntax, tables, arithmetic, Big-O, I/O, and basic loops.",
  },
  {
    id: "core-patterns",
    label: "Core Patterns",
    targetPct: 80,
    description: "Arrays, hashing, prefix sums, two pointers, sliding windows, and binary search.",
  },
  {
    id: "intermediate-patterns",
    label: "Intermediate Patterns",
    targetPct: 75,
    description: "Stacks, queues, linked lists, recursion, sorting, joins, groups, and reasoning drills.",
  },
  {
    id: "advanced-patterns",
    label: "Advanced Patterns",
    targetPct: 70,
    description: "Trees, heaps, graphs, backtracking, DP, windows, indexes, and DBMS depth.",
  },
  {
    id: "interview-simulation",
    label: "Interview Simulation",
    targetPct: 70,
    description: "Timed mixed sets that force pattern recognition under pressure.",
  },
  {
    id: "machine-mode",
    label: "Machine Mode",
    targetPct: 85,
    description: "Fast recall, clean explanation, edge cases, and repeatable mock performance.",
  },
];

export type LatestAttempt = Attempt & { count: number };

export type StageSummary = {
  id: TrainingStage;
  label: string;
  description: string;
  targetPct: number;
  total: number;
  attempted: number;
  mastered: number;
  masteryPct: number;
  unlocked: boolean;
  gate: "locked" | "train" | "passed";
};

export type ReadinessScore = {
  id: "campus" | "leetcode" | "sql" | "aptitude";
  label: string;
  pct: number;
  targetPct: number;
  mastered: number;
  total: number;
  status: "cold" | "training" | "ready";
};

export type MachineBlock = {
  id: "warmup" | "pattern" | "mixed" | "repair" | "speed";
  title: string;
  objective: string;
  itemIds: string[];
  estMinutes: number;
};

export type MachinePlan = {
  stages: StageSummary[];
  readiness: ReadinessScore[];
  blocks: MachineBlock[];
  weakestTopics: { track: TrackId; topic: string; wrong: number; total: number }[];
  nextGate: StageSummary | null;
};

const CORE_PATTERNS = new Set([
  "arrays",
  "array",
  "strings",
  "two-pointer",
  "two-pointers",
  "sliding-window",
  "hashing",
  "hash-map",
  "prefix-sums",
  "prefix-sum",
  "binary-search",
]);

const INTERMEDIATE_TOPICS = new Set([
  "recursion",
  "sorting",
  "linked-lists",
  "linked-list",
  "stacks-queues",
  "stack",
  "queue",
  "joins",
  "group-by",
  "subqueries",
  "cte",
  "ratios",
  "averages",
  "profit-loss",
  "time-work",
  "time-speed-distance",
]);

const ADVANCED_TOPICS = new Set([
  "trees",
  "tree-traversals",
  "heaps",
  "graphs",
  "backtracking",
  "dp",
  "dp-1d",
  "window-functions",
  "indexes",
  "normalization",
  "probability",
  "perm-comb",
  "number-system",
]);

function normalize(s: string | undefined): string {
  return (s ?? "").toLowerCase().replace(/_/g, "-");
}

export function latestAttemptsByItem(attempts: Attempt[]): Map<string, LatestAttempt> {
  const map = new Map<string, LatestAttempt>();
  for (const attempt of attempts) {
    const current = map.get(attempt.itemId);
    if (!current) {
      map.set(attempt.itemId, { ...attempt, count: 1 });
      continue;
    }
    current.count += 1;
    if (attempt.attemptedAt >= current.attemptedAt) {
      map.set(attempt.itemId, { ...attempt, count: current.count });
    }
  }
  return map;
}

export function inferTrainingStage(item: QuizItem): TrainingStage {
  if (item.stage) return item.stage;

  const topic = normalize(item.topic);
  const pattern = normalize(item.pattern);
  const tags = item.tags.map(normalize);
  const signals = [topic, pattern, ...tags];

  if (signals.some((s) => s.includes("mock") || s.includes("interview"))) {
    return "interview-simulation";
  }
  if (
    item.difficulty === "hard" ||
    signals.some((s) => ADVANCED_TOPICS.has(s) || s.includes("dp"))
  ) {
    return "advanced-patterns";
  }
  if (signals.some((s) => INTERMEDIATE_TOPICS.has(s))) {
    return "intermediate-patterns";
  }
  if (signals.some((s) => CORE_PATTERNS.has(s))) {
    return "core-patterns";
  }
  if (item.difficulty === "medium" && (item.type === "coding" || item.type === "sql")) {
    return "intermediate-patterns";
  }
  return "foundation";
}

function itemStageRank(item: QuizItem): number {
  return STAGE_ORDER.indexOf(inferTrainingStage(item));
}

export function defaultSpeedTargetSec(item: QuizItem): number {
  if (item.speedTargetSec) return item.speedTargetSec;
  if (item.type === "mcq") return item.difficulty === "easy" ? 60 : item.difficulty === "medium" ? 90 : 120;
  if (item.type === "sql") return item.difficulty === "easy" ? 360 : item.difficulty === "medium" ? 600 : 900;
  return item.difficulty === "easy" ? 600 : item.difficulty === "medium" ? 1200 : 1800;
}

export function isMastered(item: QuizItem, latest: LatestAttempt | undefined): boolean {
  if (!latest?.correct || latest.gaveUp) return false;
  const targetMs = defaultSpeedTargetSec(item) * 1000;
  const speedPass = latest.timeMs <= targetMs;
  const hintPass = (latest.hintsUsed ?? 0) === 0;
  return speedPass && hintPass;
}

function scorePool(items: QuizItem[], latest: Map<string, LatestAttempt>): {
  pct: number;
  mastered: number;
  total: number;
} {
  const total = items.length;
  if (total === 0) return { pct: 0, mastered: 0, total: 0 };
  let mastered = 0;
  for (const item of items) {
    if (isMastered(item, latest.get(item.id))) mastered += 1;
  }
  return { pct: Math.round((mastered / total) * 100), mastered, total };
}

export function getStageSummaries(
  items: QuizItem[],
  attempts: Attempt[],
): StageSummary[] {
  const latest = latestAttemptsByItem(attempts);
  let previousPassed = true;

  return TRAINING_STAGES.map((stage) => {
    const stageItems = items.filter((item) => inferTrainingStage(item) === stage.id);
    const attempted = stageItems.filter((item) => latest.has(item.id)).length;
    const scored = scorePool(stageItems, latest);
    const gate =
      !previousPassed ? "locked" : scored.pct >= stage.targetPct ? "passed" : "train";
    const summary: StageSummary = {
      ...stage,
      total: scored.total,
      attempted,
      mastered: scored.mastered,
      masteryPct: scored.pct,
      unlocked: previousPassed,
      gate,
    };
    previousPassed = previousPassed && gate === "passed";
    return summary;
  });
}

export function getReadinessScores(
  items: QuizItem[],
  attempts: Attempt[],
): ReadinessScore[] {
  const latest = latestAttemptsByItem(attempts);
  const pools: ReadinessScore[] = [];

  const campusItems = items.filter(
    (item) =>
      item.companies?.some((c) =>
        ["tcs", "infosys", "wipro", "capgemini", "accenture", "cognizant"].includes(c),
      ) ||
      item.track === "aptitude" ||
      (item.track === "python" && item.difficulty !== "hard") ||
      (item.track === "dsa" && item.difficulty === "easy"),
  );
  const leetcodeItems = items.filter(
    (item) =>
      item.track === "dsa" &&
      item.type === "coding" &&
      (item.difficulty === "easy" || item.difficulty === "medium"),
  );
  const sqlItems = items.filter((item) => item.track === "sql");
  const aptitudeItems = items.filter((item) => item.track === "aptitude");

  for (const [id, label, targetPct, pool] of [
    ["campus", "Campus Interview", 85, campusItems],
    ["leetcode", "LeetCode Medium", 80, leetcodeItems],
    ["sql", "SQL / DBMS", 85, sqlItems],
    ["aptitude", "Aptitude Speed", 90, aptitudeItems],
  ] as const) {
    const scored = scorePool(pool, latest);
    pools.push({
      id,
      label,
      targetPct,
      ...scored,
      status:
        scored.pct >= targetPct ? "ready" : scored.mastered < 5 ? "cold" : "training",
    });
  }

  return pools;
}

function weaknessRows(items: QuizItem[], attempts: Attempt[]) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const rows = new Map<string, { track: TrackId; topic: string; wrong: number; total: number }>();
  for (const attempt of attempts) {
    const item = itemById.get(attempt.itemId);
    if (!item) continue;
    const key = `${item.track}:${item.topic}`;
    const row = rows.get(key) ?? {
      track: item.track,
      topic: item.topic,
      wrong: 0,
      total: 0,
    };
    row.total += 1;
    if (!attempt.correct || attempt.gaveUp) row.wrong += 1;
    rows.set(key, row);
  }
  return [...rows.values()]
    .filter((row) => row.total >= 2 && row.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
    .slice(0, 5);
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function stablePick(items: QuizItem[], count: number, seed: string): QuizItem[] {
  const unique = new Map(items.map((item) => [item.id, item]));
  return [...unique.values()]
    .sort((a, b) => {
      const ax = hashString(`${seed}:${a.id}`);
      const bx = hashString(`${seed}:${b.id}`);
      return ax - bx || a.id.localeCompare(b.id);
    })
    .slice(0, count);
}

function blockMinutes(items: QuizItem[]): number {
  return Math.max(
    5,
    items.reduce((sum, item) => sum + (item.estMinutes ?? Math.ceil(defaultSpeedTargetSec(item) / 60)), 0),
  );
}

export function getMachineBlocks(args: {
  items: QuizItem[];
  attempts: Attempt[];
  reviewRecords: ReviewRecord[];
  now?: number;
}): MachineBlock[] {
  const { items, attempts, reviewRecords, now = Date.now() } = args;
  const latest = latestAttemptsByItem(attempts);
  const todaySeed = new Date(now).toISOString().slice(0, 10);
  const latestWrongIds = new Set(
    [...latest.entries()]
      .filter(([, attempt]) => !attempt.correct || attempt.gaveUp)
      .map(([id]) => id),
  );
  const dueIds = new Set(
    reviewRecords.filter((record) => record.nextDueAt <= now).map((record) => record.itemId),
  );

  const unseen = items.filter((item) => !latest.has(item.id));
  const wrong = items.filter((item) => latestWrongIds.has(item.id));
  const due = items.filter((item) => dueIds.has(item.id));

  const warmup = stablePick(
    unseen.filter((item) => inferTrainingStage(item) === "foundation" && item.type === "mcq"),
    6,
    `${todaySeed}:warmup`,
  );
  const pattern = stablePick(
    unseen.filter(
      (item) =>
        item.track === "dsa" &&
        item.type === "coding" &&
        (inferTrainingStage(item) === "core-patterns" ||
          inferTrainingStage(item) === "intermediate-patterns"),
    ),
    3,
    `${todaySeed}:pattern`,
  );
  const mixed = stablePick(
    unseen.filter((item) => item.type !== "coding" || item.difficulty !== "hard"),
    8,
    `${todaySeed}:mixed`,
  );
  const repair = stablePick([...due, ...wrong], 8, `${todaySeed}:repair`);
  const speed = stablePick(
    items.filter((item) => {
      const latestAttempt = latest.get(item.id);
      if (!latestAttempt?.correct) return item.difficulty === "easy";
      return latestAttempt.timeMs > defaultSpeedTargetSec(item) * 1000;
    }),
    6,
    `${todaySeed}:speed`,
  );

  const specs = [
    {
      id: "warmup",
      title: "Warm-up",
      objective: "Start with basics so syntax, formulas, and definitions stay instant.",
      items: warmup,
    },
    {
      id: "pattern",
      title: "Pattern Block",
      objective: "Train recognition first, then write the template without searching.",
      items: pattern,
    },
    {
      id: "mixed",
      title: "Mixed Block",
      objective: "Force track switching across Python, DSA, SQL, and aptitude.",
      items: mixed,
    },
    {
      id: "repair",
      title: "Repair Block",
      objective: "Repeat due and recently-wrong items until the mistake disappears.",
      items: repair,
    },
    {
      id: "speed",
      title: "Speed Block",
      objective: "Redo easy and slow-solved items against a hard time target.",
      items: speed,
    },
  ] as const;

  return specs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    objective: spec.objective,
    itemIds: spec.items.map((item) => item.id),
    estMinutes: blockMinutes(spec.items),
  }));
}

export function buildMachinePlan(args: {
  items: QuizItem[];
  attempts: Attempt[];
  reviewRecords: ReviewRecord[];
  now?: number;
}): MachinePlan {
  const stages = getStageSummaries(args.items, args.attempts);
  const readiness = getReadinessScores(args.items, args.attempts);
  return {
    stages,
    readiness,
    blocks: getMachineBlocks(args),
    weakestTopics: weaknessRows(args.items, args.attempts),
    nextGate: stages.find((stage) => stage.gate === "train") ?? null,
  };
}

export function compareStage(a: QuizItem, b: QuizItem): number {
  return itemStageRank(a) - itemStageRank(b);
}
