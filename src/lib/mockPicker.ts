import type { McqItem, MockSection, QuizItem } from "../types";

// Every MCQ in `pool` that a section is allowed to draw from. Shared by the
// mock runner and scripts/validate-content.ts (blueprint feasibility checks).
export function sectionPool(section: MockSection, pool: QuizItem[]): McqItem[] {
  const criteria = Array.isArray(section.pickFrom)
    ? section.pickFrom
    : [section.pickFrom];
  const matches: McqItem[] = [];
  for (const item of pool) {
    if (item.type !== "mcq") continue;
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

// Picks the MCQs for one mock-test section. Extracted from MockTestPage so the
// selection logic is unit-testable; `rng` is injectable for deterministic tests.
export function pickItemsForSection(
  section: MockSection,
  pool: QuizItem[],
  rng: () => number = Math.random,
): McqItem[] {
  const matches = sectionPool(section, pool);
  for (let i = matches.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  return matches.slice(0, section.questionCount);
}
