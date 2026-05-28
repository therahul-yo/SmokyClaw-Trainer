---
id: apt-08-perm-comb
title: Permutations & combinations
track: aptitude
topic: quant
order: 8
estMinutes: 10
prerequisites: [apt-07-number-system]
pattern: apt-pnc
---

# Permutations and combinations

Two questions:
- **Permutation:** how many *orderings* of choices?
- **Combination:** how many *selections* (order doesn't matter)?

If the test reads "how many ways to *arrange*," it's permutation. "How many ways to *choose / select*," combination.

## The two formulas

```
nPr = n! / (n − r)!         ← permutations of r items from n
nCr = n! / (r! · (n − r)!)  ← combinations of r items from n

nCr = nPr / r!
```

So `nCr` divides out the `r!` orderings that `nPr` overcounts.

## When in doubt — the slot method

Draw `r` slots. Count what can go in slot 1, slot 2, ..., slot r. Multiply.

> 5 books on a shelf — arrangements?
> 5 slots: 5 × 4 × 3 × 2 × 1 = **120 = 5!**.

> 5 books, choose 3 to arrange in a row?
> 3 slots: 5 × 4 × 3 = **60 = 5P3**.

> 5 books, choose any 3 (order doesn't matter)?
> 5C3 = 60 / 6 = **10**.

## Repetitions allowed?

> 4-digit PIN, digits 0–9, repeats OK?
> 10 × 10 × 10 × 10 = **10000**.

> 4-digit PIN, no repeats?
> 10 × 9 × 8 × 7 = **5040 = 10P4**.

> 3-letter word from {A,B,C,D,E}, repeats allowed?
> 5³ = **125**.

## Identical items — divide out duplicates

Arrangements of "BANANA"?
- 6 letters total. Repeats: B×1, A×3, N×2.
- Total arrangements = 6! / (3! × 2! × 1!) = 720 / 12 = **60**.

General: `n! / (k₁! × k₂! × ...)` where `k_i` is the count of each repeated character.

## Combinations with restriction

> A committee of 5 from 7 men and 4 women must include exactly 2 women.
> Pick 2 women × pick 3 men = 4C2 × 7C3 = 6 × 35 = **210**.

When the problem has multiple constraints, split into cases and add. When it has a "and then" structure, multiply.

## At-least / at-most

> Committee of 5 with at least 2 women (4 women, 7 men available).
- Cases: 2W3M, 3W2M, 4W1M.
- 4C2·7C3 + 4C3·7C2 + 4C4·7C1 = 6·35 + 4·21 + 1·7 = 210 + 84 + 7 = **301**.

For "at most," sum 0, 1, ... up to the limit. For "at least," sum from the limit upwards. If the universe is small, sometimes faster to compute `total − complement`.

## Circular arrangements

Sitting `n` distinct people around a round table = `(n − 1)!`. The "first" seat is arbitrary; only relative order matters.

> 5 friends around a circular table?
> 4! = **24**.

If reflections are equivalent (e.g., bracelets), divide by 2: `(n − 1)! / 2`.

## Arrangements with adjacency

> 6 people in a row, A and B must sit together.
- Glue A+B as one unit → 5 objects to arrange = 5!.
- A and B can be in 2 orders within the glued unit.
- Total = 5! × 2 = **240**.

> Same setup, A and B NOT together.
- Total − together = 6! − 240 = 720 − 240 = **480**.

## Probability via combinations

Most probability problems reduce to:
```
P = favorable / total
```
Both counted with the same method (permutation or combination — be consistent).

> Pull 2 balls from a bag of 5 red and 3 blue. P(both red)?
- Total ways = 8C2 = 28.
- Favorable = 5C2 = 10.
- P = 10/28 = **5/14**.

## What interviewers ask

- How many 5-letter words from "MISSISSIPPI"? Trick: not all letters distinct. Count permutations with repetition formula carefully.
- 4 boys and 3 girls in a row, girls never together. (Total − "girls together" = 7! − 5!·3! = 5040 − 720 = 4320.)
- 10 points on a plane, no three collinear — number of triangles? 10C3 = **120**.
- 10 points, 4 of which are collinear — triangles? 10C3 − 4C3 = 120 − 4 = **116**.

## Quick reference

| Setup | Formula |
|---|---|
| Arrange n distinct | n! |
| Arrange r from n distinct | nPr = n!/(n−r)! |
| Choose r from n (no order) | nCr = nPr/r! |
| Arrange with repeats | n! / (k₁! k₂! …) |
| Circular n distinct | (n−1)! |
| At least k | Total − fewer-than-k OR sum from k up |
