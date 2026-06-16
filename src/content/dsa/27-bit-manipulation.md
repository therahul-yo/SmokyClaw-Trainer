---
id: dsa-27-bit-manipulation
title: Bit manipulation — think in binary
track: dsa
topic: bit-manipulation
order: 27
estMinutes: 12
prerequisites: [dsa-00-foundations]
pattern: bit-manipulation
---

# Bit manipulation

Every integer is a row of bits. Bit tricks let you test, set, and combine those
bits in `O(1)` — turning some "count / find the odd one out / try every subset"
problems from `O(n²)` into `O(n)` or `O(2ⁿ)` into something tractable. The whole
skill is a handful of idioms you can recall instantly.

## The core operators

| Op | Meaning | Example (`a=6=110`, `b=3=011`) |
|---|---|---|
| `a & b` | AND — 1 where both are 1 | `010 = 2` |
| `a \| b` | OR — 1 where either is 1 | `111 = 7` |
| `a ^ b` | XOR — 1 where they **differ** | `101 = 5` |
| `~a` | NOT — flip every bit | `-7` (two's complement) |
| `a << k` | shift left, multiply by `2ᵏ` | `6 << 1 = 12` |
| `a >> k` | shift right, floor-divide by `2ᵏ` | `6 >> 1 = 3` |

In Python integers are arbitrary-precision, so `~a == -(a+1)` and there's no
overflow — but the *logic* of every trick is identical to C/Java.

## The five idioms to memorize

```python
x & 1                 # is x odd?  (lowest bit set)
x & (1 << k)          # is bit k set?  (nonzero => yes)
x | (1 << k)          # SET bit k
x & ~(1 << k)         # CLEAR bit k
x ^ (1 << k)          # TOGGLE bit k
```

And two that show up constantly:

```python
x & (x - 1)           # clears the LOWEST set bit
x & (-x)              # isolates the LOWEST set bit
```

`x & (x-1) == 0` (for `x > 0`) means **x is a power of two** — exactly one bit set.

## XOR — the workhorse

XOR's three properties drive most interview bit problems:

- `a ^ a == 0` (a value cancels itself)
- `a ^ 0 == a` (identity)
- it's commutative and associative (order doesn't matter)

**Single number** — every element appears twice except one; XOR them all and the
pairs cancel:

```python
def single_number(nums):
    out = 0
    for n in nums:
        out ^= n
    return out
```

`O(n)` time, `O(1)` space — no hash set needed. The same cancellation finds a
missing number in `0..n` (XOR the indices and the values together) or swaps two
variables without a temp.

## Counting set bits (popcount)

```python
def count_bits(x):
    count = 0
    while x:
        x &= x - 1          # drop the lowest set bit each iteration
        count += 1
    return count
```

This loops once **per set bit**, not once per bit position — `O(popcount)`, faster
than checking all 32/64 positions. (Python also has `int.bit_count()`.)

## Subset enumeration — bitmask as a set

A bitmask of `n` bits represents one of `2ⁿ` subsets: bit `i` set means "element
`i` is in." Iterate every subset by counting `0 .. 2ⁿ-1`:

```python
def all_subsets(items):
    n = len(items)
    out = []
    for mask in range(1 << n):
        out.append([items[i] for i in range(n) if mask & (1 << i)])
    return out
```

This is the backbone of **bitmask DP** (travelling salesman, assignment problems):
the state is "which elements are used," packed into one integer.

## Recognizing a bit problem

- "Appears once / twice / odd number of times" → XOR cancellation.
- "Power of two", "is exactly one bit set" → `x & (x-1)`.
- "Try every subset", `n ≤ 20` in constraints → bitmask enumeration / DP.
- "Without using `+` / `*` / extra space" → shift-and-add, XOR swaps.
- Flags / permissions / small fixed sets → pack them into one integer.

## Common bugs

- **Operator precedence.** `&`, `|`, `^` bind *looser* than `==` and `+` in Python.
  `x & 1 == 0` parses as `x & (1 == 0)` → `x & False`. Parenthesize: `(x & 1) == 0`.
- **Signed-shift surprises in other languages.** Python's `>>` is arithmetic and
  ints are unbounded; don't assume a 32-bit wrap unless you mask with `& 0xFFFFFFFF`.
- **Off-by-one on bit index.** Bit `k` is `1 << k`; the lowest bit is `k = 0`.
- **`~x` is not "the other bits."** It's two's-complement negation. To flip within
  a fixed width, XOR with a full mask: `x ^ ((1 << width) - 1)`.
