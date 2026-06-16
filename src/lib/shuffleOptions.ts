import { hashSeed, seededRng } from "./rng";

export type ShuffledOptions = {
  options: string[]; // options in display order
  answerIndex: number; // index of the correct answer within the display order
  order: number[]; // order[displayIndex] = originalIndex
};

// Deterministically shuffle an MCQ's options, seeded by the item id. This
// breaks position memorization / authoring bias (e.g. correct answers that
// cluster at "A") while staying STABLE per item — the options don't jump
// around between re-renders or reloads, and the answer-index is remapped so
// grading still works. Pure and seeded, so it's unit-testable.
export function shuffleOptions(
  id: string,
  options: string[],
  answerIndex: number,
): ShuffledOptions {
  const order = options.map((_, i) => i);
  const rng = seededRng(hashSeed(id));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    options: order.map((o) => options[o]),
    answerIndex: order.indexOf(answerIndex),
    order,
  };
}
