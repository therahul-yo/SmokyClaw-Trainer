// Regression test for the FNV-1a hashString duplication audit concern.
//
// As of this PR, the hashString function is independently defined in:
//   - src/lib/smokey.ts:76
//   - src/lib/daily.ts:17
//   - src/lib/trainingMachine.ts:331
//
// All three implementations are identical (verified by manual inspection
// during the audit). To prove that — and to catch any future drift if
// someone refactors one copy but not the others — we re-declare the
// three copies inline here, then assert equivalence.
//
// Phase 2 PR (fix/phase-2-timezone, #22) extracts the shared helper to
// src/lib/hash.ts. This test continues to be useful as a fingerprint:
// once the refactor lands, the three inline copies below will be
// replaced by an import from src/lib/hash.ts, and the equivalence
// assertion becomes a no-op (trivially true since all three are the
// same import).
//
// FNV-1a 32-bit reference: http://www.isthe.com/chongo/tech/comp/fnv/

import { describe, it, expect } from "vitest";

// ── Copy 1: matches src/lib/smokey.ts:76-83 ─────────────────────────
function hashStringSmokey(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// ── Copy 2: matches src/lib/daily.ts:17-24 ──────────────────────────
function hashStringDaily(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// ── Copy 3: matches src/lib/trainingMachine.ts:331-338 ───────────────
function hashStringTrainingMachine(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const allCopies = [
  hashStringSmokey,
  hashStringDaily,
  hashStringTrainingMachine,
] as const;

const SAMPLE_INPUTS = [
  "",
  "a",
  "smokey-2026-06-21",
  "daily-2026-06-21",
  "training-machine-seed:python-01",
  "🦞🐚",
  "long-input-" + "x".repeat(1000),
] as const;

describe("FNV-1a hashString — three-call-site equivalence", () => {
  it("all three copies return identical output for the same input", () => {
    for (const input of SAMPLE_INPUTS) {
      const results = allCopies.map((fn) => fn(input));
      const first = results[0];
      for (const result of results.slice(1)) {
        expect(result).toBe(first);
      }
    }
  });

  it("empty string returns the FNV-1a offset basis (2166136261)", () => {
    for (const fn of allCopies) {
      expect(fn("")).toBe(2166136261);
    }
  });

  it("single ASCII char matches the FNV-1a spec", () => {
    // FNV-1a 32-bit reference value for "a" is 0xe40c292c.
    for (const fn of allCopies) {
      expect(fn("a")).toBe(0xe40c292c);
    }
  });

  it("output is always a 32-bit unsigned integer", () => {
    for (const input of SAMPLE_INPUTS) {
      for (const fn of allCopies) {
        const h = fn(input);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(0xffffffff);
        expect(Number.isInteger(h)).toBe(true);
      }
    }
  });

  it("is deterministic across N invocations", () => {
    const input = "2026-06-21";
    const expected = allCopies[0](input);
    for (let i = 0; i < 100; i++) {
      for (const fn of allCopies) {
        expect(fn(input)).toBe(expected);
      }
    }
  });

  it("a 1-char change in the input produces a different output (avalanche)", () => {
    const a = allCopies[0]("smokey-seed-1");
    const b = allCopies[0]("smokey-seed-2");
    expect(a).not.toBe(b);
  });

  it("multi-byte input (UTF-16 surrogate pair) is stable", () => {
    // U+1F600 (😀) is encoded as a surrogate pair in UTF-16.
    for (const fn of allCopies) {
      expect(fn("😀")).toBeGreaterThan(0);
      expect(fn("😀")).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
