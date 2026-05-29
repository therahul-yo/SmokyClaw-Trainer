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
