---
id: apt-09-probability
title: Probability — basics, complement, conditional
track: aptitude
topic: quant
order: 9
estMinutes: 10
prerequisites: [apt-08-perm-comb]
pattern: apt-probability
---

# Probability

```
P(event) = favorable_outcomes / total_outcomes
```

Always between 0 (impossible) and 1 (certain). Assumes outcomes are equally likely; if not, you're doing weighted probability.

## Setup checklist

1. **What's the sample space?** (Total equally-likely outcomes.)
2. **What's the favorable set?**
3. **Divide.**

Half the questions in an aptitude paper boil down to permutations / combinations — the count of favorable and total. The other half use complementary or conditional reasoning.

## Single-event basics

- **Coin toss:** P(H) = 1/2.
- **Dice:** P(even) = 3/6 = 1/2. P(prime) = P({2, 3, 5}) = 1/2.
- **Cards from a 52-deck:** P(king) = 4/52 = 1/13. P(red) = 26/52 = 1/2. P(king of hearts) = 1/52.

## The complement trick

`P(at least one X) = 1 − P(no X)`. Often easier to count "none" than "≥1."

> Toss a fair coin 5 times. P(at least one head)?
> P(no heads) = (1/2)^5 = 1/32. → P(at least one) = **31/32**.

> Roll two dice. P(at least one 6)?
> P(neither 6) = (5/6)² = 25/36. → P(at least one) = **11/36**.

## AND vs OR

- **AND** (both events happen): multiply if independent. `P(A ∩ B) = P(A) × P(B|A)`.
- **OR** (either happens): `P(A ∪ B) = P(A) + P(B) − P(A ∩ B)`. Inclusion-exclusion.

> A bag has 4 red and 6 blue. Draw 2 without replacement. P(both red)?
> First red: 4/10. Second red given first red: 3/9. Multiply: 12/90 = **2/15**.

> Draw 1 card from a deck. P(king OR heart)?
> 4/52 + 13/52 − 1/52 = **16/52 = 4/13**.

The `−P(A ∩ B)` subtraction stops us from double-counting "king of hearts."

## With and without replacement

> Bag has 5 white, 3 black. Two drawn one at a time.
> **With replacement:** P(both white) = (5/8)² = 25/64.
> **Without replacement:** P(both white) = (5/8) × (4/7) = 20/56 = 5/14.

The "without" case shrinks the denominator on the second draw.

## Combinations-based probability

For "pick k from n" problems, both numerator and denominator are combinations.

> Bag has 5 red and 3 blue. Pull 2. P(both red)?
> 5C2 / 8C2 = 10/28 = **5/14**. Same as the sequential calc.

> Pull 3 cards. P(all face cards)?
> Face cards in deck: 12. → 12C3 / 52C3 = 220 / 22100 = **11/1105**.

## Independent vs dependent

- **Independent:** outcome of one doesn't affect the other. Two coin tosses. Two dice rolls.
- **Dependent:** does. Drawing without replacement.

`P(A ∩ B) = P(A) × P(B)` only if independent. Otherwise use the conditional form `P(A) × P(B|A)`.

## Conditional probability

```
P(A | B) = P(A ∩ B) / P(B)
```

"Given B happened, probability of A."

> Bag has 5 red and 3 blue. Two drawn without replacement; the second is blue. P(first was red)?
> P(R1 ∩ B2) = (5/8) × (3/7) = 15/56.
> P(B2) = P(R1∩B2) + P(B1∩B2) = 15/56 + (3/8)(2/7) = 15/56 + 6/56 = 21/56 = 3/8.
> P(R1 | B2) = (15/56) / (3/8) = (15/56) × (8/3) = **5/7**.

## Bayes-ish problems

> 1% of a population has a disease. Test is 95% accurate (both ways). A person tests positive. P(actually has disease)?

Let D = disease, T+ = tests positive.
- P(D) = 0.01, P(¬D) = 0.99.
- P(T+ | D) = 0.95, P(T+ | ¬D) = 0.05.
- P(T+) = 0.01 × 0.95 + 0.99 × 0.05 = 0.0095 + 0.0495 = 0.059.
- P(D | T+) = 0.0095 / 0.059 ≈ **16%**.

Counterintuitive — even a "95% accurate" test gives a 16% confidence for a rare disease. Worth understanding once; rarely asked at campus level but a favorite at product-company interviews.

## What interviewers ask

- 4 dice. P(sum = 22)? Enumerate: only (6,6,5,5), (6,6,6,4), and permutations. Count carefully.
- Draw 2 cards. P(both kings)? 4/52 × 3/51 = 12/2652 = **1/221**.
- Birthday problem: in a room of 23 people, P(two share birthday)? ≈ **50%**. Famous counterintuitive result; not "23/365."
- A coin is tossed 4 times. P(exactly 2 heads)? Binomial: 4C2 × (1/2)² × (1/2)² = 6/16 = **3/8**.

## Quick reference

| Setup | Use |
|---|---|
| At least one event | 1 − P(none) |
| Both events (independent) | P(A) × P(B) |
| Without replacement, k draws | Sequential probabilities OR combinations |
| Either event | P(A) + P(B) − P(A ∩ B) |
| Exactly k of n trials | nCk × p^k × (1−p)^(n−k) (Binomial) |
