// Deterministic 32-bit string hash (FNV-1a, 32-bit variant).
//
// Used by the daily-challenge picker, the smokey coach engine, and the
// training-machine stable picker. Each of those modules had its own
// private copy of this function — they were always identical and
// guaranteed to drift apart at the first refactor. Centralising here so
// the three call sites are guaranteed-equivalent and trivially mockable.
//
// Properties:
//   - Deterministic: same input → same output, no salt, no Math.random.
//   - 32-bit unsigned integer output (always in [0, 2^32)).
//   - Avalanche-y: single-bit changes in the input tend to flip many
//     output bits. Not cryptographic — don't use it for security.
//   - Stable across Node and browser (no platform-specific APIs).
export function hashString(s: string): number {
  let h = 2166136261 >>> 0; // FNV offset basis (32-bit).
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0; // FNV prime (32-bit).
  }
  return h >>> 0;
}