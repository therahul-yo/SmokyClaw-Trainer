---
id: apt-06-averages
title: Averages — and the deviation trick
track: aptitude
topic: quant
order: 6
estMinutes: 8
prerequisites: [apt-01-percentages]
pattern: apt-averages
---

# Averages

```
Average = Sum / Count
```

Three formulas you'll always use:
- Sum = Avg × Count.
- Count = Sum / Avg.
- New Avg = (Old Sum ± changes) / New Count.

## Adding / removing an item

> Average of 5 numbers is 20. A 6th number is added; new average is 22. The 6th number?

Old sum = 100. New sum = 22 × 6 = 132. The 6th = **32**.

> Average of 10 students is 60. One student leaves; the new average is 58. The leaver's marks?

Old sum = 600. New sum = 58 × 9 = 522. Leaver = 600 − 522 = **78**.

## Replacing an item

> Average of 5 numbers is 20. One number is replaced and the new average becomes 24. By how much did the replaced number change?

Sum increased by 5 × (24 − 20) = 20. The new number is **20 more** than the old.

## Weighted average

When groups of different sizes are combined:

```
combined_avg = (n₁ × avg₁ + n₂ × avg₂ + ...) / (n₁ + n₂ + ...)
```

> Class A: 30 students, avg 70. Class B: 20 students, avg 80. Combined?
> (30×70 + 20×80) / 50 = (2100 + 1600) / 50 = **74**.

For two groups, this is also the alligation rule (see ratios lesson) in disguise.

## The deviation shortcut (mental math)

Pick a base (close to the avg). Sum deviations. Divide by count. Add to base.

> Average of 78, 82, 75, 80, 85.
> Pick 80. Deviations: −2, +2, −5, 0, +5. Sum = 0. Avg = 80 + 0 = **80**.

Faster than `(78+82+75+80+85)/5` on a paper test.

## Average of an arithmetic series

For consecutive integers (or any arithmetic progression), `Avg = (first + last) / 2`.

> Sum 1 to 100? Avg = 50.5; sum = 50.5 × 100 = **5050**.
> Average of multiples of 3 from 3 to 99? (3 + 99)/2 = **51**.

## Average speed (the harmonic special case)

Already covered in TSD — for equal distances at speeds `a` and `b`, average = `2ab / (a+b)`, the harmonic mean. **Never** average the speeds arithmetically.

## Average age

> Average age of 5 family members is 30. A baby of age 1 is born. New average?

Sum was 150. With the baby: 151 / 6 ≈ **25.17 years**.

5 years later, each member has aged 5: sum = 151 + 6×5 = 181. Avg = **30.17**.

The "average ages 5 years later" trick: sum grows by `count × years`, so the new average = old + years (if the count doesn't change).

## What interviewers ask

- Avg of 7 numbers is 18; if one number is excluded, avg of remaining 6 is 16. Excluded number? Sum was 126, new sum 96, excluded = **30**.
- Avg of first n natural numbers = (n+1)/2.
- Avg of first n even numbers = n+1. Avg of first n odd numbers = n.
- A cricketer averages 35 over 22 innings. What should he score in the 23rd to bring his average to 36?
  - Need new sum 36 × 23 = 828. Old sum 35 × 22 = 770. Needs **58**.

## Quick reference

| Setup | Trick |
|---|---|
| Add/remove an item | Compare old and new sums |
| Weighted avg | (n₁a₁ + n₂a₂) / (n₁ + n₂) |
| Arithmetic series | (first + last) / 2 |
| Equal distances at speeds a, b | 2ab/(a+b) (harmonic) |
| Mental sum | Pick a base, sum deviations |
