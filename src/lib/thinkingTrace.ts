import type { QuizItem, TrackId } from "../types";

export type ThinkingTraceField =
  | "input"
  | "output"
  | "constraints"
  | "pattern"
  | "state"
  | "dryRun"
  | "edgeCases"
  | "complexity"
  | "mistakeRule";

export type MistakeTag =
  | "wrong-pattern"
  | "wrong-state"
  | "missed-edge-case"
  | "wrong-complexity"
  | "syntax"
  | "sql-join"
  | "sql-grouping"
  | "formula"
  | "arithmetic"
  | "time-pressure";

export type ThinkingTrace = Record<ThinkingTraceField, string> & {
  mistakeTags: MistakeTag[];
};

export type TracePrompt = {
  field: ThinkingTraceField;
  label: string;
  placeholder: string;
};

export const EMPTY_TRACE: ThinkingTrace = {
  input: "",
  output: "",
  constraints: "",
  pattern: "",
  state: "",
  dryRun: "",
  edgeCases: "",
  complexity: "",
  mistakeRule: "",
  mistakeTags: [],
};

export const MISTAKE_TAGS: { id: MistakeTag; label: string; repair: string }[] = [
  {
    id: "wrong-pattern",
    label: "wrong pattern",
    repair: "Write the trigger words and compare against the pattern table.",
  },
  {
    id: "wrong-state",
    label: "wrong state",
    repair: "Name each variable/data structure and when it changes.",
  },
  {
    id: "missed-edge-case",
    label: "missed edge case",
    repair: "Add empty, one, duplicate, negative, no-answer, and boundary tests.",
  },
  {
    id: "wrong-complexity",
    label: "wrong complexity",
    repair: "Count loops, sorting, recursion branches, and stored keys.",
  },
  {
    id: "syntax",
    label: "syntax",
    repair: "Rewrite the minimal template three times without looking.",
  },
  {
    id: "sql-join",
    label: "SQL join",
    repair: "Define the final row and decide whether unmatched left rows must survive.",
  },
  {
    id: "sql-grouping",
    label: "SQL grouping",
    repair: "Say one row per what before writing GROUP BY.",
  },
  {
    id: "formula",
    label: "formula",
    repair: "Write the formula and identify the denominator/base.",
  },
  {
    id: "arithmetic",
    label: "arithmetic",
    repair: "Estimate first, then calculate, then compare with the estimate.",
  },
  {
    id: "time-pressure",
    label: "time pressure",
    repair: "Set a stop-loss time and move when classification is stuck.",
  },
];

const BASE_PROMPTS: TracePrompt[] = [
  {
    field: "input",
    label: "input parser",
    placeholder: "What is given? List the raw inputs and their shape.",
  },
  {
    field: "output",
    label: "output contract",
    placeholder: "What exact value/table/type must be produced?",
  },
  {
    field: "constraints",
    label: "constraint signal",
    placeholder: "What does input size, sorting, NULLs, units, or timing imply?",
  },
  {
    field: "pattern",
    label: "pattern classifier",
    placeholder: "Which pattern/formula/query shape is this and why?",
  },
  {
    field: "state",
    label: "state builder",
    placeholder: "Which variables, containers, clauses, or formulas do the work?",
  },
  {
    field: "dryRun",
    label: "dry run engine",
    placeholder: "Trace one small example step by step like a CPU.",
  },
  {
    field: "edgeCases",
    label: "edge-case scanner",
    placeholder: "What cases break careless solutions?",
  },
  {
    field: "complexity",
    label: "proof and complexity",
    placeholder: "Why is it correct? What is time/space or fastest calculation path?",
  },
];

const TRACK_HINTS: Record<TrackId, Partial<Record<ThinkingTraceField, string>>> = {
  python: {
    pattern: "Which Python container is doing the real work: list, dict, set, deque, heap, tuple?",
    state: "Name each variable/container and when it mutates.",
    complexity: "Count scans, membership checks, sorting, and extra containers.",
  },
  dsa: {
    constraints: "Use n to kill bad complexity. Is O(n^2) dead? Is sorting allowed?",
    pattern: "Map trigger words to hashing, two pointers, sliding window, prefix sum, stack, BFS, DP, etc.",
    state: "What invariant stays true after every loop step?",
  },
  sql: {
    input: "Which table is the base table?",
    output: "One row in the final result represents what?",
    state: "Which JOIN, WHERE, GROUP BY, HAVING, or window clause shapes the result?",
    edgeCases: "Check NULLs, duplicate rows, accidental inner joins, and ordering.",
  },
  aptitude: {
    input: "Extract numbers, units, and the unknown.",
    pattern: "Classify: percentage, ratio, average, speed, work, probability, reasoning.",
    state: "Write the formula and substitute values before calculating.",
    complexity: "Estimate the answer range and eliminate impossible options.",
  },
};

export function promptsForTrace(track: TrackId): TracePrompt[] {
  const hints = TRACK_HINTS[track];
  return BASE_PROMPTS.map((prompt) => ({
    ...prompt,
    placeholder: hints[prompt.field] ?? prompt.placeholder,
  }));
}

export function traceCompletionPct(trace: ThinkingTrace): number {
  const fields = BASE_PROMPTS.map((p) => p.field);
  const filled = fields.filter((field) => trace[field].trim().length >= 3).length;
  return Math.round((filled / fields.length) * 100);
}

export function traceTargetForItem(item: QuizItem): string {
  return `item:${item.id}`;
}

export function traceTargetForLesson(lessonId: string): string {
  return `lesson:${lessonId}`;
}

export function idealTraceSeed(item: QuizItem): Partial<ThinkingTrace> {
  const prompt = item.type === "mcq" ? item.question : item.prompt;
  return {
    input: prompt,
    output:
      item.type === "mcq"
        ? "Choose the correct option and explain why the others fail."
        : item.type === "sql"
          ? `Return columns: ${item.expected.columns.join(", ")}.`
          : `Return the exact value from function ${item.entry}(...).`,
    constraints: item.constraints ?? "",
    pattern: item.pattern ?? item.tags.join(", "),
    edgeCases: item.examples?.map((ex) => `${ex.input} -> ${ex.output}`).join("\n") ?? "",
    complexity: item.optimal?.complexity ?? item.complexityCheck?.question ?? "",
  };
}
