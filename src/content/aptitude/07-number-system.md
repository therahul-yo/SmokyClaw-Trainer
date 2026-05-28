---
id: apt-07-number-system
title: Number system — divisibility, HCF, LCM, remainders
track: aptitude
topic: quant
order: 7
estMinutes: 10
prerequisites: [apt-01-percentages]
pattern: apt-numbers
---

# Number system

The most arithmetic-heavy topic. Memorize the divisibility rules, the HCF/LCM tricks, and a handful of remainder shortcuts.

## Divisibility rules

| Divisor | Rule |
|---|---|
| 2 | Last digit even |
| 3 | Sum of digits divisible by 3 |
| 4 | Last two digits divisible by 4 |
| 5 | Last digit 0 or 5 |
| 6 | Divisible by 2 AND 3 |
| 8 | Last three digits divisible by 8 |
| 9 | Sum of digits divisible by 9 |
| 10 | Last digit 0 |
| 11 | Alternating sum of digits divisible by 11 |
| 25 | Last two digits 00, 25, 50, or 75 |

> Is 14938 divisible by 11? Digits 1, 4, 9, 3, 8. Alternating: (1 − 4 + 9 − 3 + 8) = 11 → yes.

## HCF (GCD) and LCM

For two numbers `a` and `b`:
```
HCF × LCM = a × b
```

Use this to recover one when you have the other three. HCF divides both; LCM is divisible by both.

**Euclid's algorithm** for HCF (works in your head):
```
HCF(a, b) = HCF(b, a mod b)        until b == 0
```

> HCF(48, 36) = HCF(36, 12) = HCF(12, 0) = **12**.
> LCM(48, 36) = 48 × 36 / 12 = **144**.

For three numbers: chain it. `HCF(a, b, c) = HCF(HCF(a, b), c)`.

## When do you need HCF vs LCM?

- **HCF** for "largest tile size that fits both rooms exactly," "max boxes of equal size to pack different products," "max students given equal split."
- **LCM** for "when do periodic events coincide?" "smallest length that fits a whole number of pieces of multiple sizes," "find a number that leaves the same remainder when divided by several."

> Bells ring every 6, 8, and 10 minutes. After how long do they ring together?
> LCM(6, 8, 10) = **120 min** = 2h.

> Find the largest 4-digit number divisible by 12, 18, 24.
> LCM = 72. Largest 4-digit multiple of 72: 9999 / 72 = 138.875 → 138 × 72 = **9936**.

## Remainders — the modular arithmetic kit

`a mod n` is the remainder when `a` is divided by `n`.

Properties:
```
(a + b) mod n = ((a mod n) + (b mod n)) mod n
(a × b) mod n = ((a mod n) × (b mod n)) mod n
```

You can compute mods piecewise. Critical for large exponents.

> Remainder when 7^100 is divided by 5.
> 7 mod 5 = 2. So 7^100 mod 5 = 2^100 mod 5.
> Powers of 2 mod 5 cycle: 2, 4, 3, 1, 2, 4, 3, 1, ... (period 4).
> 100 mod 4 = 0 → cycle's last value → **1**.

### Cyclicity of unit digits

| Number ending | Cycle of unit digit on powers |
|---|---|
| 0 | 0 |
| 1 | 1 |
| 2 | 2, 4, 8, 6 (period 4) |
| 3 | 3, 9, 7, 1 (period 4) |
| 4 | 4, 6 (period 2) |
| 5 | 5 |
| 6 | 6 |
| 7 | 7, 9, 3, 1 (period 4) |
| 8 | 8, 4, 2, 6 (period 4) |
| 9 | 9, 1 (period 2) |

> Unit digit of 2^47?
> 47 mod 4 = 3 → 3rd in (2, 4, 8, 6) → **8**.

## CRT-style "leaves remainder X when divided by Y" problems

> Smallest number that leaves remainder 3 when divided by 5, 7 when divided by 11?

Look for `5k + 3 ≡ 7 (mod 11)`. Try k = 0, 1, 2, ...:
- k=0: 3 mod 11 = 3.
- k=1: 8.
- k=2: 13 mod 11 = 2.
- k=3: 18 mod 11 = 7. ✓ → **n = 18**.

The full Chinese Remainder Theorem isn't usually needed; brute search works for two moduli.

## Prime factorization

Factor a number into primes. Useful for divisor count, sum of divisors, HCF, LCM.

> 360 = 2³ × 3² × 5¹.
> Number of divisors = (3+1)(2+1)(1+1) = 24.

The formula: if `n = p₁^a × p₂^b × ...`, then divisor count is `(a+1)(b+1)...`.

## What interviewers ask

- A 4-digit number divisible by 9 and 5; last digit is X. Sum of digits 27. The number?
- Smallest number which when divided by 5, 6, 7, 8 leaves remainder 3 in each case. (LCM(5,6,7,8) = 840 → answer **843**.)
- Find the unit digit of `123^45 × 456^78`. (Combine unit-digit cyclicity: `3^45` unit, times `6^78` unit. 45 mod 4 = 1 → 3. 6 always 6. Product unit = 8.)
- HCF and LCM of two numbers are 12 and 144. One number is 36. The other? `(12 × 144)/36 = 48`.

## Quick reference

| Need | Use |
|---|---|
| HCF | Euclid; or LCM × HCF = product |
| LCM | Prime factorization, taking max power per prime |
| Unit digit of `a^n` | Cyclicity table |
| Number of divisors of n | Product of (exponent + 1) |
| Remainder of `a + b` mod n | (a mod n + b mod n) mod n |
