// Content validation gate — runs before every build (`pnpm validate`).
//
// Errors (exit 1):
//   - malformed items (missing fields, bad answerIndex, duplicate options…)
//   - duplicate item ids across packs
//   - unknown track / difficulty / topic / pattern strings
//   - banned tag aliases (taxonomy drift)
//   - duplicate lesson ids or (track, order) collisions
//   - coding/SQL reference solutions that fail their own tests, executed
//     through the real grader semantics (graderCore + pyodide/sql.js)
//
// Warnings (reported, build still passes — tracked for later phases):
//   - items missing editorials (optimal) or estMinutes
//   - blueprint sections whose pool is smaller than questionCount
//   - patterns.json references to not-yet-authored items/lessons
//
// Usage: tsx scripts/validate-content.ts [--skip-exec] [--strict-blueprints]

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCodingHarness,
  evaluateCodingRun,
  compareSqlResult,
} from "../src/lib/graderCore";
import { sectionPool } from "../src/lib/mockPicker";
import { BLUEPRINTS } from "../src/lib/mockTestFormats";
import type {
  CodingItem,
  McqItem,
  Pattern,
  QuizItem,
  SqlItem,
  TrackId,
} from "../src/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_EXEC = process.argv.includes("--skip-exec");
const STRICT_BLUEPRINTS = process.argv.includes("--strict-blueprints");

const TRACKS: TrackId[] = ["python", "dsa", "sql", "aptitude"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const SQL_SCHEMAS = ["employees", "ecommerce", "social"];

// Canonical topic taxonomy. Extend deliberately — the training engine and
// mock blueprints key off these strings.
const TOPICS: Record<TrackId, string[]> = {
  python: [
    "basics", "syntax", "data-types", "control-flow", "functions", "strings",
    "oop", "exceptions", "stdlib", "coding-io", "iterators", "decorators",
    "file-io", "advanced-python", "stack-queue", "recursion", "comprehensions",
    "typing",
  ],
  dsa: [
    "complexity", "arrays", "two-pointer", "sliding-window", "prefix-sums",
    "hashmap", "binary-search", "sorting", "recursion", "backtracking",
    "linked-list", "stack", "trees", "heap", "graphs", "greedy", "dp",
    "bit-manipulation", "math", "advanced-dsa",
  ],
  sql: [
    "select", "joins", "aggregation", "subqueries", "cte", "window-functions",
    "nulls", "indexes", "normalization", "transactions", "set-operations",
    "advanced-sql",
  ],
  aptitude: ["basics", "quant", "reasoning", "verbal", "pseudocode"],
};

// Tag aliases that previously drifted; the canonical spelling is enforced.
const BANNED_TAGS: Record<string, string> = {
  tsd: "speed-distance",
  "perm-comb": "permutation-combination",
  "permutations-combinations": "permutation-combination",
  permutation: "permutation-combination",
  "subject-verb": "subject-verb-agreement",
  "simple-interest": "si-ci",
  ratio: "ratios",
};

const errors: string[] = [];
const warnings: string[] = [];
const err = (msg: string) => errors.push(msg);
const warn = (msg: string) => warnings.push(msg);

// ────────── Load content ──────────

const quizDir = join(ROOT, "src/data/quizzes");
const packs = new Map<string, QuizItem[]>();
for (const f of readdirSync(quizDir).sort()) {
  if (!f.endsWith(".json")) continue;
  try {
    packs.set(f, JSON.parse(readFileSync(join(quizDir, f), "utf8")));
  } catch (e) {
    err(`${f}: invalid JSON — ${String(e)}`);
  }
}
const allItems: { item: QuizItem; pack: string }[] = [];
for (const [pack, items] of packs) {
  if (!Array.isArray(items)) {
    err(`${pack}: top level must be an array`);
    continue;
  }
  for (const item of items) allItems.push({ item, pack });
}

const patterns: Pattern[] = JSON.parse(
  readFileSync(join(ROOT, "src/data/patterns.json"), "utf8"),
);

type LessonInfo = { id: string; track: string; order: number; file: string };
const lessons: LessonInfo[] = [];
const contentDir = join(ROOT, "src/content");
for (const track of readdirSync(contentDir)) {
  let files: string[];
  try {
    files = readdirSync(join(contentDir, track)).filter((f) => f.endsWith(".md"));
  } catch {
    continue;
  }
  for (const f of files) {
    const raw = readFileSync(join(contentDir, track, f), "utf8");
    // Same frontmatter shape contentLoader expects.
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) {
      err(`${track}/${f}: missing frontmatter`);
      continue;
    }
    const meta: Record<string, string> = {};
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    for (const req of ["id", "title", "track", "order"]) {
      if (!meta[req]) err(`${track}/${f}: frontmatter missing "${req}"`);
    }
    if (meta.id) {
      lessons.push({
        id: meta.id,
        track: meta.track ?? track,
        order: Number(meta.order ?? 999),
        file: `${track}/${f}`,
      });
    }
  }
}

// ────────── Structural checks ──────────

const seenIds = new Map<string, string>();
for (const { item, pack } of allItems) {
  const where = `${item.id ?? "<no id>"} (${pack})`;
  if (!item.id) {
    err(`${pack}: item without id`);
    continue;
  }
  const prev = seenIds.get(item.id);
  if (prev) err(`duplicate item id ${item.id} in ${pack} and ${prev}`);
  seenIds.set(item.id, pack);

  if (!TRACKS.includes(item.track)) err(`${where}: unknown track "${item.track}"`);
  if (!DIFFICULTIES.includes(item.difficulty)) {
    err(`${where}: unknown difficulty "${item.difficulty}"`);
  }
  const validTopics = TOPICS[item.track];
  if (validTopics && !validTopics.includes(item.topic)) {
    err(`${where}: topic "${item.topic}" not in canonical taxonomy for ${item.track}`);
  }
  if (item.pattern) {
    const ok = patterns.some((p) => p.track === item.track && p.id === item.pattern);
    if (!ok) err(`${where}: pattern "${item.pattern}" not in patterns.json for ${item.track}`);
  }
  for (const tag of item.tags ?? []) {
    // Object.hasOwn guards against prototype keys ("constructor", "toString")
    // being treated as banned aliases.
    if (Object.hasOwn(BANNED_TAGS, tag)) {
      err(`${where}: tag "${tag}" is a banned alias — use "${BANNED_TAGS[tag]}"`);
    }
  }

  if (item.type === "mcq") {
    const mcq = item as McqItem;
    if (!mcq.question?.trim()) err(`${where}: empty question`);
    if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
      err(`${where}: needs >= 2 options`);
    } else {
      if (new Set(mcq.options).size !== mcq.options.length) {
        err(`${where}: duplicate options ${JSON.stringify(mcq.options)}`);
      }
      if (
        !Number.isInteger(mcq.answerIndex) ||
        mcq.answerIndex < 0 ||
        mcq.answerIndex >= mcq.options.length
      ) {
        err(`${where}: answerIndex ${mcq.answerIndex} out of bounds`);
      }
    }
    if (!mcq.explanation?.trim()) err(`${where}: missing explanation`);
  } else if (item.type === "coding") {
    const c = item as CodingItem;
    if (c.language !== "python") err(`${where}: unsupported language "${c.language}"`);
    if (!c.starter?.trim()) err(`${where}: missing starter`);
    if (!c.entry?.trim()) err(`${where}: missing entry`);
    if (!Array.isArray(c.tests) || c.tests.length === 0) {
      err(`${where}: no tests`);
    } else {
      c.tests.forEach((t, i) => {
        if (!Array.isArray(t.args)) err(`${where}: test ${i} args must be an array`);
        if (!("expect" in t)) err(`${where}: test ${i} missing expect`);
      });
    }
  } else if (item.type === "sql") {
    const s = item as SqlItem;
    if (!SQL_SCHEMAS.includes(s.schema)) err(`${where}: unknown schema "${s.schema}"`);
    if (!Array.isArray(s.expected?.columns) || !Array.isArray(s.expected?.rows)) {
      err(`${where}: malformed expected`);
    } else {
      s.expected.rows.forEach((r, i) => {
        if (!Array.isArray(r) || r.length !== s.expected.columns.length) {
          err(`${where}: expected row ${i} width != columns width`);
        }
      });
    }
  } else {
    err(`${where}: unknown type "${(item as { type?: string }).type}"`);
  }
}

// estMinutes / editorial coverage (backfill tracked in later phases)
const mcqsMissingEst = allItems.filter(
  ({ item }) => item.type === "mcq" && item.estMinutes == null,
).length;
if (mcqsMissingEst > 0) warn(`${mcqsMissingEst} MCQs missing estMinutes (Phase 1 backfill)`);

// ────────── patterns.json checks ──────────

const patternIds = new Set<string>();
for (const p of patterns) {
  if (patternIds.has(p.id)) err(`patterns.json: duplicate pattern id ${p.id}`);
  patternIds.add(p.id);
  const seen = new Set<string>();
  for (const id of p.itemIds) {
    if (seen.has(id)) err(`patterns.json: ${p.id} lists ${id} twice`);
    seen.add(id);
    if (!seenIds.has(id)) warn(`patterns.json: ${p.id} references unauthored item ${id}`);
  }
  const lessonIds = new Set(lessons.map((l) => l.id));
  for (const id of p.lessonIds) {
    if (!lessonIds.has(id)) warn(`patterns.json: ${p.id} references unknown lesson ${id}`);
  }
}

// ────────── lesson checks ──────────

const lessonIdSeen = new Map<string, string>();
const lessonOrderSeen = new Map<string, string>();
for (const l of lessons) {
  const prev = lessonIdSeen.get(l.id);
  if (prev) err(`duplicate lesson id ${l.id} (${l.file}, ${prev})`);
  lessonIdSeen.set(l.id, l.file);
  const key = `${l.track}#${l.order}`;
  const prevOrder = lessonOrderSeen.get(key);
  if (prevOrder) err(`lesson order collision ${l.track}/${l.order}: ${l.file} vs ${prevOrder}`);
  lessonOrderSeen.set(key, l.file);
}

// ────────── blueprint feasibility ──────────

const quizItems = allItems.map(({ item }) => item);
const bpReport = STRICT_BLUEPRINTS ? err : warn;
for (const bp of BLUEPRINTS) {
  // Per-section pool size…
  for (const sec of bp.sections) {
    const pool = sectionPool(sec, quizItems);
    if (pool.length < sec.questionCount) {
      bpReport(
        `blueprint ${bp.id}/${sec.id}: pool ${pool.length} < questionCount ${sec.questionCount}`,
      );
    }
  }
  // …and total demand per identical pool signature (e.g. two verbal sections
  // drawing from the same pool must jointly fit without repeats).
  const demand = new Map<string, { total: number; pool: number }>();
  for (const sec of bp.sections) {
    const sig = JSON.stringify(sec.pickFrom);
    const cur = demand.get(sig) ?? { total: 0, pool: sectionPool(sec, quizItems).length };
    cur.total += sec.questionCount;
    demand.set(sig, cur);
  }
  for (const [sig, { total, pool }] of demand) {
    if (total > pool) {
      bpReport(`blueprint ${bp.id}: sections drawing from ${sig} need ${total} but pool is ${pool}`);
    }
  }
  if (bp.codingSection) {
    const { pool: poolDef, problemCount } = bp.codingSection;
    const coding = quizItems.filter(
      (q) =>
        q.type === "coding" &&
        q.track === poolDef.track &&
        (!poolDef.topics || poolDef.topics.includes(q.topic)),
    );
    if (coding.length < problemCount) {
      bpReport(`blueprint ${bp.id}: coding pool ${coding.length} < ${problemCount}`);
    }
  }
}

// ────────── reference-solution execution ──────────

async function execReferences() {
  const codingItems = allItems.filter((x) => x.item.type === "coding") as {
    item: CodingItem;
    pack: string;
  }[];
  const sqlItems = allItems.filter((x) => x.item.type === "sql") as {
    item: SqlItem;
    pack: string;
  }[];

  // Python via the npm pyodide build (same engine family the app loads).
  const { loadPyodide } = await import("pyodide");
  const py = await loadPyodide();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s: string) => { stdout += s; } });
  py.setStderr({ batched: (s: string) => { stderr += s; } });

  async function runPy(code: string) {
    stdout = "";
    stderr = "";
    // Fresh globals per run: items must not depend on earlier definitions.
    const globals = py.runPython("dict()");
    try {
      await py.runPythonAsync(code, { globals });
      return { stdout, stderr };
    } catch (e) {
      return { stdout, stderr, error: e instanceof Error ? e.message : String(e) };
    } finally {
      globals.destroy();
    }
  }

  for (const { item, pack } of codingItems) {
    const where = `${item.id} (${pack})`;
    if (!item.optimal?.code) {
      warn(`${where}: no optimal.code — reference unverifiable (Phase 3 backfill)`);
      continue;
    }
    const t0 = Date.now();
    process.stderr.write(`  exec ${item.id}...`);
    const res = evaluateCodingRun(item, await runPy(buildCodingHarness(item, item.optimal.code)));
    process.stderr.write(` ${Date.now() - t0}ms\n`);
    if (!res.ok) {
      const firstFail = res.tests.find((t) => !t.pass);
      err(
        `${where}: optimal fails ${res.total - res.passed}/${res.total} tests ` +
          `(test ${firstFail?.index}: expected ${JSON.stringify(firstFail?.expected)}, ` +
          `got ${JSON.stringify(firstFail?.actual)}${firstFail?.error ? `, error: ${firstFail.error}` : ""})`,
      );
    }
    // NOTE: bruteForce snippets are deliberately NOT executed — several are
    // intentional counterexamples (fail metadata checks) or intentional
    // TLE demonstrations (naive fib at n=45), so they can't be gated on.
  }

  // SQL via the npm sql.js build.
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs({
    locateFile: (f: string) => join(ROOT, "node_modules/sql.js/dist", f),
  });
  const schemas = new Map(
    SQL_SCHEMAS.map((n) => [
      n,
      readFileSync(join(ROOT, `src/data/sql-schemas/${n}.sql`), "utf8"),
    ]),
  );

  function runSqlQuery(schema: string, query: string) {
    const db = new SQL.Database();
    db.exec(schemas.get(schema)!);
    try {
      const results = db.exec(query);
      if (results.length === 0) return { columns: [], rows: [] };
      const last = results[results.length - 1];
      return { columns: last.columns, rows: last.values as unknown[][] };
    } finally {
      db.close();
    }
  }

  for (const { item, pack } of sqlItems) {
    const where = `${item.id} (${pack})`;
    if (!item.optimal?.code) {
      warn(`${where}: no optimal.code — reference unverifiable`);
      continue;
    }
    try {
      const actual = runSqlQuery(item.schema, item.optimal.code);
      if (!compareSqlResult(item.expected, actual)) {
        err(
          `${where}: optimal output != expected ` +
            `(expected ${JSON.stringify(item.expected.rows)}, got ${JSON.stringify(actual.rows)})`,
        );
      }
    } catch (e) {
      err(`${where}: optimal.code raised — ${String(e)}`);
    }
  }
}

// ────────── run + report ──────────

const tally = () => {
  const byTrack = new Map<string, { mcq: number; coding: number; sql: number }>();
  for (const { item } of allItems) {
    const t = byTrack.get(item.track) ?? { mcq: 0, coding: 0, sql: 0 };
    t[item.type] += 1;
    byTrack.set(item.track, t);
  }
  console.log("\nCanonical item tally:");
  let total = 0;
  for (const track of TRACKS) {
    const t = byTrack.get(track) ?? { mcq: 0, coding: 0, sql: 0 };
    const sum = t.mcq + t.coding + t.sql;
    total += sum;
    console.log(
      `  ${track.padEnd(9)} ${String(sum).padStart(4)}  (mcq ${t.mcq}, coding ${t.coding}, sql ${t.sql})`,
    );
  }
  console.log(`  ${"TOTAL".padEnd(9)} ${String(total).padStart(4)}  + ${lessons.length} lessons`);
};

const main = async () => {
  if (!SKIP_EXEC) await execReferences();

  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} warnings:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (errors.length) {
    console.error(`\n✗ ${errors.length} errors:`);
    for (const e of errors) console.error(`  - ${e}`);
  }
  tally();
  if (errors.length) {
    console.error("\nvalidate-content: FAILED");
    process.exit(1);
  }
  console.log("\nvalidate-content: OK");
};

void main();
