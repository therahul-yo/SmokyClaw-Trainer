---
id: dsa-28-math
title: Math & number theory — the formulas interviews assume
track: dsa
topic: math
order: 28
estMinutes: 13
prerequisites: [dsa-00-foundations]
pattern: math
---

# Math & number theory

A small set of number-theory tools shows up again and again: GCD/LCM, prime
sieves, modular arithmetic, fast exponentiation, and combinatorics. None are
hard, but interviewers expect them to be *instant* — and to be implemented
without overflow or a timeout. This lesson is that toolkit.

## GCD and LCM — the Euclidean algorithm

The greatest common divisor via repeated remainder. It's `O(log min(a,b))` — far
faster than trial division:

```python
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    return a // gcd(a, b) * b      # divide FIRST to avoid overflow / huge intermediates
```

`gcd(a, 0) == a` is the base case that makes the loop terminate. LCM falls out of
the identity `a * b == gcd(a, b) * lcm(a, b)`. (Python ships `math.gcd`/`math.lcm`,
but interviewers usually want to see the loop.)

## Primes — the Sieve of Eratosthenes

To find all primes up to `n`, don't test each number; cross out multiples:

```python
def primes_up_to(n):
    if n < 2: return []
    sieve = [True] * (n + 1)
    sieve[0] = sieve[1] = False
    for p in range(2, int(n**0.5) + 1):
        if sieve[p]:
            for m in range(p * p, n + 1, p):   # start at p*p; smaller multiples already crossed
                sieve[m] = False
    return [i for i, is_p in enumerate(sieve) if is_p]
```

`O(n log log n)` — effectively linear. Two key optimizations: only sieve up to
`√n`, and start crossing out at `p*p` (everything below it was hit by a smaller
prime). For a **single** primality test, trial-divide by `2` and odd numbers up to
`√n` — `O(√n)`.

## Modular arithmetic — surviving "answer mod 10⁹+7"

Big-counting problems ask for the answer modulo a large prime to keep it in range.
Addition and multiplication distribute over `mod`:

```python
MOD = 10**9 + 7
total = (a + b) % MOD
prod  = (a * b) % MOD          # take mod after every multiply, not just at the end
```

Division is the trap: you **cannot** just `% MOD` a quotient. Multiply by the
*modular inverse* instead — and when the modulus is prime, Fermat's little theorem
gives it as `pow(b, MOD - 2, MOD)`.

## Fast exponentiation — `pow` in `O(log n)`

Computing `base^exp` by multiplying `exp` times is `O(exp)`; square-and-multiply is
`O(log exp)`:

```python
def fast_pow(base, exp, mod):
    result = 1
    base %= mod
    while exp:
        if exp & 1:               # current bit set -> fold base in
            result = result * base % mod
        base = base * base % mod  # square the base
        exp >>= 1
    return result
```

Python's built-in `pow(base, exp, mod)` does exactly this — use it directly when
allowed. The hand-rolled version is the same idea you'd apply to matrix
exponentiation (e.g. `O(log n)` Fibonacci).

## Combinatorics quick reference

```python
from math import comb, perm, factorial
comb(n, k)        # n choose k  — unordered selections
perm(n, k)        # ordered arrangements of k from n
factorial(n)      # n!
```

For "mod a prime" versions, precompute factorials and inverse factorials, then
`C(n,k) = fact[n] * inv_fact[k] * inv_fact[n-k] % MOD`. The recurrence
`C(n,k) = C(n-1,k-1) + C(n-1,k)` (Pascal's triangle) avoids division entirely when
`n` is small.

## Handy closed forms

- Sum `1..n` = `n*(n+1)//2`; sum of squares = `n*(n+1)*(2n+1)//6`.
- Geometric sum `1 + r + … + rⁿ⁻¹ = (rⁿ - 1)/(r - 1)`.
- Number of digits of `n` (base 10) = `len(str(n))` or `floor(log10(n)) + 1`.
- Count of multiples of `k` in `1..n` = `n // k`.

## Recognizing a math problem

- "Modulo 10⁹+7", "count the number of ways" → modular arithmetic + combinatorics.
- "Is it prime / list primes / count primes" → sieve or `O(√n)` test.
- "Reduce the fraction", "common multiple/divisor" → GCD/LCM.
- "`base^exp` is huge", "matrix to the n-th power" → fast exponentiation.
- Big `n` with a clean pattern → look for a closed form before you loop.

## Common bugs

- **Integer vs float division.** Use `//` for exact integer math; `/` returns a
  float and loses precision on large values.
- **Overflow in other languages.** Python won't overflow, but `lcm` and modular
  products will in C/Java — take the mod (or divide first) at every step.
- **Modular division by raw `%`.** Always use a modular inverse, never `(a // b) % MOD`.
- **Sieve off-by-one.** The array must be size `n+1` to index `n`; mark `0` and `1`
  as non-prime explicitly.
- **`0` and `1` edge cases.** `1` is not prime; `gcd(0, 0)` is conventionally `0`;
  `0! = 1`.
