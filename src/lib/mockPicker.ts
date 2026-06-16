import type {
  CodingItem,
  McqItem,
  MockSection,
  MockTestBlueprint,
  QuizItem,
} from "../types";

// Every MCQ in `pool` that a section is allowed to draw from. Shared by the
// mock runner and scripts/validate-content.ts (blueprint feasibility checks).
export function sectionPool(section: MockSection, pool: QuizItem[]): McqItem[] {
  const criteria = Array.isArray(section.pickFrom)
    ? section.pickFrom
    : [section.pickFrom];
  const matches: McqItem[] = [];
  for (const item of pool) {
    if (item.type !== "mcq") continue;
    if (!companyAllows(section.company, item)) continue;
    const ok = criteria.some((c) => {
      if (c.track !== item.track) return false;
      if (c.topics && !c.topics.includes(item.topic)) return false;
      if (c.type && c.type !== item.type) return false;
      return true;
    });
    if (ok) matches.push(item);
  }
  return matches;
}

// Company filter is permissive: an untagged item is fair game for any company
// (generic question), but an item tagged for *other* companies only is excluded.
function companyAllows(
  company: MockSection["company"],
  item: QuizItem,
): boolean {
  if (!company) return true;
  const tags = item.companies;
  if (!tags || tags.length === 0) return true;
  return tags.includes(company);
}

function fisherYates<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// Picks the MCQs for one mock-test section. Extracted from MockTestPage so the
// selection logic is unit-testable; `rng` is injectable for deterministic runs.
// `exclude` carries ids already used by earlier sections so the same MCQ never
// appears twice in one run (cross-section dedupe).
export function pickItemsForSection(
  section: MockSection,
  pool: QuizItem[],
  rng: () => number = Math.random,
  exclude?: Set<string>,
): McqItem[] {
  let matches = sectionPool(section, pool);
  if (exclude && exclude.size > 0) {
    matches = matches.filter((m) => !exclude.has(m.id));
  }
  fisherYates(matches, rng);
  if (matches.length < section.questionCount) {
    console.warn(
      `[mock] section "${section.id}" under-filled: ${matches.length}/${section.questionCount} available`,
    );
  }
  return matches.slice(0, section.questionCount);
}

// Picks the coding problems for a blueprint's coding round. Mirrors the
// feasibility filter in validate-content.ts (track + optional topics).
export function pickCodingItemsForSection(
  codingSection: NonNullable<MockTestBlueprint["codingSection"]>,
  pool: QuizItem[],
  rng: () => number = Math.random,
  exclude?: Set<string>,
): CodingItem[] {
  const { pool: def, problemCount } = codingSection;
  let matches = pool.filter(
    (q): q is CodingItem =>
      q.type === "coding" &&
      q.track === def.track &&
      (!def.topics || def.topics.includes(q.topic)),
  );
  if (exclude && exclude.size > 0) {
    matches = matches.filter((m) => !exclude.has(m.id));
  }
  fisherYates(matches, rng);
  if (matches.length < problemCount) {
    console.warn(
      `[mock] coding round under-filled: ${matches.length}/${problemCount} available`,
    );
  }
  return matches.slice(0, problemCount);
}
