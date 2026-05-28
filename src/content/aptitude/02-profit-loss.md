---
id: apt-02-profit-loss
title: Profit, loss, discount, markup
track: aptitude
topic: quant
order: 2
estMinutes: 10
prerequisites: [apt-01-percentages]
pattern: apt-pl
---

# Profit, loss, discount, markup

A staple of every campus aptitude paper. The formulas are short; the traps are in the *base* you're computing percentages on.

## Core definitions

- **CP** = cost price (what the seller paid).
- **SP** = selling price (what the customer paid).
- **MP** = marked price (the sticker price, before discount).
- **Profit** = SP − CP (if positive).
- **Loss** = CP − SP (if positive).

## The four key formulas

```
Profit %  = (Profit / CP) × 100        ← always on CP
Loss %    = (Loss   / CP) × 100        ← always on CP
Discount% = (Discount / MP) × 100      ← always on MP
Markup %  = ((MP − CP) / CP) × 100     ← always on CP
```

**The trap:** profit/loss are on CP. Discount is on MP. Mix them up and you get wrong answers.

## Worked: markup + discount

> A shopkeeper marks up by 40% and gives a 20% discount. What's his profit %?

Let CP = 100.
- MP = 140 (40% markup on CP).
- SP = 140 × 0.80 = 112 (20% discount on MP).
- Profit = 12 on CP of 100 = **12%**.

Notice: 40% − 20% ≠ 20%. Markup and discount are on different bases. Always set CP = 100 and compute step by step.

## Worked: discount on discount (successive)

> 30% off, then 10% off the discounted price. Equivalent single discount?

Let MP = 100.
- After first: 70.
- After second: 70 × 0.90 = 63.
- Total discount: 100 − 63 = **37%**.

Formula for two successive discounts `a%` and `b%`:
```
Effective discount = a + b − (ab / 100)
```
Here: 30 + 10 − 300/100 = **37%**. The same formula gives effective markup for successive markups.

## SP given CP and profit %

```
SP = CP × (1 + profit% / 100)
SP = CP × (1 − loss%   / 100)   ← for loss
```

CP = 200, profit 15% → SP = 200 × 1.15 = 230.

## Working backwards — given SP, find CP

```
CP = SP / (1 + profit% / 100)
CP = SP / (1 − loss%   / 100)
```

> SP is 575, profit is 15%. CP?
> CP = 575 / 1.15 = **500**. (Not 575 × 0.85 = 488.75 — that's the asymmetry trap.)

## "Sold at the same price, gained X% and lost X%"

> Two items sold at ₹990 each. One at 10% gain, the other at 10% loss. Overall?

The articles' CPs differ:
- Gainer: CP = 990 / 1.10 = 900. Profit 90.
- Loser:  CP = 990 / 0.90 = 1100. Loss 110.
- Net: loss 20 on total CP of 2000 = **1% loss**.

**Shortcut for "same SP, equal % gain and loss":** always a loss of `(x²/100)%` where x is the percentage. Here 10²/100 = **1% loss**.

## False weight / dishonest dealer

> A dealer claims to sell at cost but uses a 900g weight in place of 1kg. Profit %?

He gives 900g but charges for 1000g. CP for him is 900 units; SP (what he charges) is 1000 units of value.
- Profit / CP = 100 / 900 = **11.11%**.

Shortcut: `Profit % = (true − false) / false × 100`.

## CP per unit — quantity twist

> Buy 12 at the price of 10. Profit %?

You pay for 10 and get 12. Per-unit CP for you is `(price_of_10) / 12`. But you sell each at the original price.
- Treat CP per item = 10/12 of marked price. SP = 1 marked price.
- Profit % = (1 − 10/12) / (10/12) × 100 = (2/10) × 100 = **20%**.

## Quick reference table

| Situation | Use |
|---|---|
| Profit/loss % | always over CP |
| Discount % | always over MP |
| Successive a% and b% | a + b ± ab/100 (− for discounts that compound, + for markups) |
| Same SP, gain x% & loss x% | net loss of x²/100 % |
| False weight | Profit % = (claimed − actual) / actual × 100 |

## What interviewers ask

- A is 25% more than B. By what % is B less than A? **20%** (not 25%). Asymmetry: 25/125 vs 25/100.
- 20% profit and 20% discount on the same item — what's the markup? Set CP = 100, SP = 120; if discount 20% gave SP 120, then MP = 150 → markup **50%**.
- Cost of an article is ₹X; gain Y%. SP? `X × (1 + Y/100)`.
