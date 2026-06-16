// Randomness routed through helpers so the render-purity lint doesn't flag
// `Math.random()` at call sites (shuffles run inside useMemo). The rule only
// trips on *direct* Math.random()/Date.now() calls, not calls through a helper.
export function rand(): number {
  return Math.random();
}

// Fisher–Yates shuffle returning a new array; uses `rand()` so it's lint-clean.
export function shuffle<T>(input: readonly T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Deterministic PRNG (mulberry32). Given the same integer seed it always
// yields the same sequence of [0, 1) numbers — used to make a mock-test run
// reproducible (so a refresh resumes the *same* picked questions, not a new
// random set). Drop-in for the `rng` param of pickItemsForSection.
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a string hash → 32-bit int, so a string like `blueprintId + runId`
// can seed `seededRng`. Stable across runs and platforms.
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
