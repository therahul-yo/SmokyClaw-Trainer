---
id: apt-11-series
title: Number & letter series — pattern recognition
track: aptitude
topic: reasoning
order: 11
estMinutes: 8
prerequisites: []
pattern: apt-reasoning
---

# Series

Find the missing term. Either *number series* (numeric patterns) or *letter series* (alphabet patterns). The skill is recognizing common pattern families fast.

## The 8 number-series patterns to know cold

### 1. Constant difference (arithmetic)
`2, 5, 8, 11, 14, ?` → +3 each time → **17**.

### 2. Constant ratio (geometric)
`3, 6, 12, 24, ?` → ×2 → **48**.

### 3. Growing difference
`2, 6, 12, 20, 30, ?` → differences 4, 6, 8, 10, **12** → 42. (Equivalent to n(n+1).)

### 4. Squares / cubes
`1, 4, 9, 16, 25, ?` → squares → **36**.
`1, 8, 27, 64, ?` → cubes → **125**.

Sometimes squares ±1: `2, 5, 10, 17, 26, ?` → `n² + 1` → 1+1, 4+1, 9+1... → **37**.

### 5. Alternating series
Two interleaved patterns:
`2, 5, 8, 11, 14, 17, ?, 23` — read every other.

Or odd-indexed × something / even-indexed × something else:
`1, 3, 4, 9, 16, 27, 64, 81, ?, ?`
- Odd positions: 1, 4, 16, 64 (×4)
- Even positions: 3, 9, 27, 81 (×3)
- Next: **256, 243**.

### 6. Factorials / partial products
`1, 2, 6, 24, 120, ?` → n! → **720**.

### 7. Prime numbers
`2, 3, 5, 7, 11, 13, ?` → primes → **17**.

### 8. Sums of preceding (Fibonacci-like)
`1, 1, 2, 3, 5, 8, ?` → each is sum of previous two → **13**.

## The diagnosis flow

1. **Compute differences.** Are they constant? → arithmetic.
2. **Compute ratios.** Are they constant? → geometric.
3. **Differences of differences.** Constant? → quadratic.
4. **Match against squares/cubes** (memorize through 15²).
5. **Try alternating** (every other element).
6. **Try sum of two preceding.** Fibonacci shape.
7. **Mixed operation** (×2 then +1, then ×2 then +1, ...).

If nothing fits in 30 seconds, eliminate options by plausibility — the answer is usually the closest "natural" candidate.

## Letter series

### Constant skip
`A, C, E, G, ?` → skip 1 → **I**. (A+2, C+2, E+2, G+2.)

### Position-based
`A=1, B=2, ..., Z=26`. Translate, find the numeric pattern, translate back.

`B, D, H, P, ?` → positions 2, 4, 8, 16, **32** → letter at 32 wraps (26 + 6) → **F**. Always state your wrap convention.

### Multi-letter groups
`AC, BE, CG, DI, ?` 
- First letter: A, B, C, D → next **E**.
- Second letter: C, E, G, I (skip 1) → next **K**.
- → **EK**.

### Reverse alphabet
`Z, X, V, T, ?` → counting down by 2 → **R**.

## Common traps

- **Two patterns overlaid.** If a single rule doesn't fit, try alternating.
- **Wrap-around in letter series.** When position exceeds 26, wrap to (n mod 26).
- **Off-by-one with cubes / squares.** Memorize 1²–15² and 1³–10³.

## Memorized values that pay back

| Family | Values |
|---|---|
| Squares | 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225 |
| Cubes | 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000 |
| Factorials | 1, 2, 6, 24, 120, 720, 5040 |
| Primes < 100 | 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97 |
| Fibonacci | 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144 |

When you spot 144 or 89 in a sequence, your first guess should be Fibonacci or a square.

## What interviewers ask

- `120, 99, 80, 63, 48, ?` → differences −21, −19, −17, −15, **−13** → 48 − 13 = **35**.
- `4, 9, 25, 49, 121, ?` → squares of primes (2², 3², 5², 7², 11²) → next 13² = **169**.
- `J, F, M, A, M, J, ?` → first letters of months → **J** (July).
- `7, 26, 63, 124, ?` → n³ − 1 for n = 2, 3, 4, 5 (8−1, 27−1, 64−1, 125−1) → next n = 6: 216 − 1 = **215**.

## Quick reference

| Symptom | Likely pattern |
|---|---|
| Differences constant | Arithmetic |
| Ratios constant | Geometric |
| Differences themselves form arithmetic | Quadratic / n² family |
| 1, 4, 9, 16, ... | Squares |
| 1, 8, 27, 64, ... | Cubes |
| 2, 6, 24, 120 | Factorials |
| 1, 1, 2, 3, 5, 8 | Fibonacci |
| Two interleaved progressions | Alternating |
