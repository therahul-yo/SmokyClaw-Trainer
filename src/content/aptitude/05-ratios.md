---
id: apt-05-ratios
title: Ratios, proportions, mixtures
track: aptitude
topic: quant
order: 5
estMinutes: 10
prerequisites: [apt-01-percentages]
pattern: apt-ratios
---

# Ratios and proportions

A ratio compares two (or more) quantities. `a : b` reads "a to b" and equals `a / b` when used in calculation.

## Equivalent ratios

`a : b = ka : kb` for any non-zero `k`. So `2:3 = 4:6 = 10:15`. Always simplify to lowest terms.

> 24 boys to 36 girls. Ratio? `24:36 = 2:3`. Divide both by GCD = 12.

## Proportions

`a : b :: c : d` means `a/b = c/d`, i.e., `ad = bc` (cross-multiply).

> Find x such that 3 : 5 :: x : 25. → 3 × 25 = 5x → x = **15**.

## Splitting a quantity in a ratio

Divide ₹600 in ratio 2 : 3 : 5.
- Total parts = 10. One part = 60.
- Shares: 2×60, 3×60, 5×60 = **120, 180, 300**.

## "If a : b = 3:5 and b : c = 7:9, find a : b : c"

Common term `b` is 5 and 7 — make it the LCM (35).
- a : b = 3:5 = 21:35.
- b : c = 7:9 = 35:45.
- → a : b : c = **21 : 35 : 45**.

## Mixtures — the alligation rule

When you mix two ingredients of prices (or strengths) `p₁` and `p₂` to get a mean `m`:

```
ratio of qty₁ to qty₂ = (p₂ − m) : (m − p₁)
```

The bigger gap to one side, the more you need of the *other* side.

> Mix milk at ₹20/L and milk at ₹30/L to get a blend at ₹26/L. Ratio?

(30 − 26) : (26 − 20) = 4 : 6 = **2 : 3** (cheap : expensive). For each 2L of ₹20 milk, take 3L of ₹30 milk.

Sanity check: 2 × 20 + 3 × 30 = 130; per L = 26. ✓

### Replacement (the harder twist)

> A vessel has 40L of milk. Take out 4L, replace with water. Repeat 3 times. Final milk?

Each step the milk fraction is multiplied by `(1 − 4/40) = 9/10`.
After 3 steps: 40 × (9/10)³ = 40 × 729/1000 = **29.16 L** of milk.

Generic formula:
```
remaining_pure = original × (1 − removed_per_step / total)^n
```

## Direct vs inverse proportion

- **Direct:** as `x` increases, `y` increases proportionally. `y / x = k`.
  - More workers → more work (for fixed time): direct.
- **Inverse:** as `x` increases, `y` decreases proportionally. `xy = k`.
  - More workers → less time (for fixed work): inverse.

> 6 men finish in 12 days. Time for 9 men?
> Inverse: 6 × 12 = 9 × t → t = 8.

## Variation problems

> y varies as the square of x. When x = 2, y = 12. Find y when x = 5.
> y = kx². 12 = k × 4 → k = 3. y at x = 5 → 3 × 25 = **75**.

## Partnership — profit sharing

Profit splits in the ratio of (investment × time).

> A invests ₹4000 for 6 months. B invests ₹6000 for 4 months. Profit ₹2000. Shares?
> Ratios: 4000×6 : 6000×4 = 24000 : 24000 = 1 : 1. Each gets ₹1000.

> A ₹5000 for 8 months, B ₹3000 for 12 months. Ratio?
> 40000 : 36000 = 10 : 9.

## What interviewers ask

- Ages in ratio 5:6. After 8 years, ratio becomes 7:8. Present ages?
  - 5x and 6x. After 8: (5x+8) / (6x+8) = 7/8 → 40x + 64 = 42x + 56 → 2x = 8 → x = 4. Ages **20 and 24**.
- Coffee A : sugar : water = 3 : 1 : 8 in a 60L solution. How much water?
  - Total parts 12. Water = 8/12 × 60 = **40L**.
- 80% solution mixed with 50% solution to get 65%. Ratio?
  - (80 − 65) : (65 − 50) = 15 : 15 = **1 : 1**.

## Quick reference

| Setup | Formula |
|---|---|
| `a:b :: c:d` | ad = bc |
| Combine `a:b` and `b:c` | Match common term via LCM |
| Mixture mean = m | qty₁ : qty₂ = (p₂ − m) : (m − p₁) |
| Replacement | original × (1 − r/T)ⁿ |
| Partnership | Profit in ratio of (capital × time) |
