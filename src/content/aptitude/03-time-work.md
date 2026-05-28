---
id: apt-03-time-work
title: Time & work — the LCM trick
track: aptitude
topic: quant
order: 3
estMinutes: 10
prerequisites: [apt-01-percentages]
pattern: apt-time-work
---

# Time and work

The "A and B together" family of problems. The single trick: convert "days to complete" into "fraction per day," then add.

## The fraction-per-day rule

If A does a job in `x` days, A's rate is `1/x` (of the job per day).
If B does it in `y` days, B's rate is `1/y`.
Together: `1/x + 1/y` per day → completion time `1 / (1/x + 1/y) = xy / (x+y)` days.

> A in 12 days, B in 18. Together?
> xy / (x+y) = 216 / 30 = **7.2 days**.

## The LCM trick (recommended)

Instead of fractions, pick the total work as `LCM(individual days)` units. Each person's rate becomes a whole number.

> A 10 days, B 15 days. LCM = 30 units.
> A's rate: 3 units/day. B's rate: 2 units/day. Together: 5/day → **30/5 = 6 days**.

Faster mental math than fractions, especially with 3+ workers.

## Three workers

> A 10d, B 12d, C 15d. Together?
> LCM = 60. Rates: 6, 5, 4. Combined: 15. Total: **60/15 = 4 days**.

## Worker leaves partway

> A and B together for 4 days, then B leaves. A finishes alone in 6 more days. A's individual time?

Let A's total time = a. B's total = b.
- In one day together: 1/a + 1/b.
- Work done in 4 days: 4(1/a + 1/b).
- Remaining: 1 − 4(1/a + 1/b), done by A in 6 days: 6/a.

Equation: 4(1/a + 1/b) + 6/a = 1. Needs a second equation (e.g., A alone, or B alone) — these problems always give one.

## Wages split

Pay is split in **ratio of rates**, not in ratio of days.

> A 10d, B 15d. They earn ₹500 total. A's share?
> Rates 3:2. A gets 3/5 × 500 = **₹300**.

This catches everyone the first time. *More efficient worker = more pay.* The ratio of work done in the same time is the inverse of the ratio of days.

## Pipes & cisterns (same shape, different label)

Inlet pipes are positive rates; outlet pipes (leaks) are negative.

> Inlet fills in 6h, leak empties in 12h. Tank starts empty; both open. When full?
> Net rate: 1/6 − 1/12 = 1/12 per hour. → **12 hours**.

## Man-days

> 15 men finish in 20 days. How long for 12 men?

Total work = 15 × 20 = 300 man-days. With 12 men: 300/12 = **25 days**.

Variant: with different efficiencies.

> 6 men or 9 women finish in 10 days. 5 men + 6 women in how long?

Total work = 6×10 = 60 man-days = 9×10 = 90 woman-days. So 1 man = 1.5 women, or 1 woman = 2/3 man.
- 5 men + 6 women = 5 + 6×(2/3) = 5 + 4 = 9 men-equivalent.
- Time = 60 / 9 = **6.67 days** (or 20/3 days).

Convert everything to one unit, then `total_work / combined_rate`.

## Worker varies efficiency

> A does work twice as fast as B, who does it twice as fast as C. Together they take 9 days. A alone?

Set C's rate = 1, B = 2, A = 4. Together = 7 units/day. Total work = 7 × 9 = 63.
- A alone = 63 / 4 = **15.75 days**.

## Quick reference

| Setup | Use |
|---|---|
| A in x, B in y | Combined time = xy / (x + y) |
| Multi-worker | LCM(days) as units; rates become integers; combined time = LCM / sum(rates) |
| Pay split | Ratio of rates (= inverse ratio of days) |
| Pipes with leak | Net rate = inlet − outlet |
| Man-days | Total = workers × days; for new headcount, divide |

## What interviewers ask

- A does a work in 20 days, B in 30. Together? **12 days** (600/50).
- A and B in 6 days, A alone in 10. B alone? Rates: A = 1/10, A+B = 1/6, so B = 1/6 − 1/10 = 1/15 → **15 days**.
- Three pipes — two inlets and one outlet. Standard pipes-and-cisterns shape.
