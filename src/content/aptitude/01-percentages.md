---
id: apt-percentages
title: Percentages
track: aptitude
topic: quant
order: 1
estMinutes: 12
prerequisites: []
---

# Percentages

The single most common quant topic on TCS NQT. Master this and you've banked 4-6 marks already.

## Core formulas

| Concept | Formula |
|---|---|
| x% of y | (x × y) / 100 |
| y as a % of x | (y / x) × 100 |
| increase x by y% | x × (1 + y/100) |
| decrease x by y% | x × (1 − y/100) |
| % change | ((new − old) / old) × 100 |

## Successive percentages

If a value increases by `a%` and then by `b%`:

**Net change = a + b + (a × b)/100**

Example: salary up 20%, then up 10%.
Net = 20 + 10 + (200/100) = **32%** — not 30%.

If one is a decrease, treat it as negative:
Up 20%, then down 10%: 20 − 10 + (−200/100) = 8%.

## Reverse percentages — high-yield trap

"After a 20% discount, the item costs ₹400. Original price?"

**Wrong:** 400 × 1.20 = 480
**Right:** 400 / 0.80 = **₹500**

If discount is d%, original = sale_price / (1 − d/100).

## % vs %-points

"Voter share went from 40% to 48%." That's an 8 **%-point** increase, but a 20% **relative** increase (8/40). Test-setters love this trap.

## Quick mental math

- 10% of x → shift decimal one left
- 5% = half of 10%
- 1% = 10% ÷ 10
- 25% = x/4, 50% = x/2, 75% = 3x/4
- 12.5% = x/8

## Example problems

**1.** A shopkeeper marks up his goods by 40% and gives a discount of 20%. What is his profit %?

```
Let CP = 100
MP = 140 (40% markup)
SP = 140 × 0.80 = 112
Profit = 12% on CP
```

Profit% = `(1 + m/100)(1 − d/100) − 1` as a percentage, where m = markup, d = discount.

**2.** Population of a town increases by 10% each year. Current = 12,100. What was it 2 years ago?

```
2 years ago: 12100 / (1.10)² = 12100 / 1.21 = 10,000
```

**3.** A's salary is 25% more than B's. By what % is B's salary less than A's?

```
Let B = 100, A = 125
Difference = 25
B is less than A by 25/125 × 100 = 20%
```

The asymmetry trips up 70% of candidates. **Increase by x% ≠ decrease by x%** when measuring the other way.

## Practice

The percentages drills in the aptitude bank range from "find 35% of 280" to "successive markup-then-discount with profit margin". Work them in batches of five — once you can clear a batch averaging well under a minute per question, you're TCS-NQT-ready for this topic.
