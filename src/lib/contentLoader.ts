import type { Lesson, LessonMeta, QuizItem, Track, TrackId } from "../types";
import tracksRaw from "../data/tracks.json";

// ────────── Lesson loading (Vite glob raw imports) ──────────

type RawModule = string;

// Eager glob — markdown is tiny, so bundle inline.
const lessonModules = import.meta.glob<RawModule>("../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, valueRaw] = m;
    const value = valueRaw.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      // array
      const inner = value.slice(1, -1).trim();
      meta[key] = inner ? inner.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")) : [];
    } else if (/^-?\d+$/.test(value)) {
      meta[key] = Number(value);
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
  return { meta, body: match[2] };
}

function buildLessons(): Lesson[] {
  const lessons: Lesson[] = [];
  for (const [path, raw] of Object.entries(lessonModules)) {
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.id || !meta.title || !meta.track) {
      console.warn(`Lesson at ${path} missing required frontmatter`);
      continue;
    }
    lessons.push({
      id: String(meta.id),
      title: String(meta.title),
      track: meta.track as TrackId,
      topic: String(meta.topic ?? ""),
      order: Number(meta.order ?? 999),
      estMinutes: Number(meta.estMinutes ?? 10),
      prerequisites: Array.isArray(meta.prerequisites) ? (meta.prerequisites as string[]) : [],
      body,
    });
  }
  lessons.sort((a, b) => a.order - b.order);
  return lessons;
}

const allLessons = buildLessons();

export function getTracks(): Track[] {
  return tracksRaw as Track[];
}

export function getTrack(id: TrackId): Track | undefined {
  return getTracks().find((t) => t.id === id);
}

export function getLessonsByTrack(track: TrackId): LessonMeta[] {
  return allLessons.filter((l) => l.track === track);
}

export function getLesson(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
}

export function getAllLessons(): Lesson[] {
  return allLessons;
}

// ────────── Quiz loading ──────────

const quizModules = import.meta.glob<QuizItem[]>("../data/quizzes/*.json", {
  import: "default",
  eager: true,
});

function buildQuizItems(): QuizItem[] {
  return Object.values(quizModules).flat();
}

const allQuizItems = buildQuizItems();

export function getAllQuizItems(): QuizItem[] {
  return allQuizItems;
}

export function getQuizItemsByTrack(track: TrackId): QuizItem[] {
  return allQuizItems.filter((q) => q.track === track);
}

export function getQuizItemsByTopic(track: TrackId, topic: string): QuizItem[] {
  return allQuizItems.filter((q) => q.track === track && q.topic === topic);
}

export function getQuizItem(id: string): QuizItem | undefined {
  return allQuizItems.find((q) => q.id === id);
}

// ────────── SQL schemas ──────────

const schemaModules = import.meta.glob<string>("../data/sql-schemas/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function getSqlSchema(name: "employees" | "ecommerce"): string {
  const path = `../data/sql-schemas/${name}.sql`;
  const sql = schemaModules[path];
  if (!sql) throw new Error(`SQL schema not found: ${name}`);
  return sql;
}
