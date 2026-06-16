---
id: python-09-recursion
title: Recursion — functions that call themselves
track: python
topic: recursion
order: 9
estMinutes: 12
prerequisites: [python-06-functions]
---

# Recursion

A recursive function solves a problem by calling itself on a smaller piece of the
same problem. Two ingredients make it work and terminate: a **base case** that
returns directly without recursing, and a **recursive case** that moves *toward*
the base case. Get either wrong and you get a wrong answer or a
`RecursionError`.

## The shape of every recursion

```python
def factorial(n):
    if n <= 1:          # base case — stops the recursion
        return 1
    return n * factorial(n - 1)   # recursive case — smaller input
```

Each call adds a frame to the call stack; the frames unwind (and multiply, here)
once the base case is hit. Trace `factorial(3)`: `3 * factorial(2)` →
`3 * (2 * factorial(1))` → `3 * (2 * 1)` → `6`.

## The call stack and Python's limit

Every pending call consumes a stack frame. Python caps recursion depth (default
~1000) to avoid crashing the interpreter:

```python
import sys
sys.setrecursionlimit(10000)   # raise it if you genuinely need deep recursion
```

Deep recursion on large inputs is a real risk in Python — unlike some languages,
CPython does **not** optimize tail calls, so a 100 000-deep recursion overflows.
When depth scales with input size (e.g. walking a long linked list), prefer an
explicit loop with your own stack.

## Multiple recursive calls — tree recursion

```python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)   # two calls -> exponential without memoization
```

This is correct but `O(2ⁿ)` because it recomputes the same subproblems. Memoize to
collapse it to `O(n)`:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

`lru_cache` stores each result by its arguments, so each `fib(k)` runs once. This
is the bridge from naive recursion to dynamic programming.

## Recursion over recursive data

Recursion shines when the *data* is recursive — nested lists, trees, JSON:

```python
def deep_sum(items):
    total = 0
    for x in items:
        total += deep_sum(x) if isinstance(x, list) else x
    return total

deep_sum([1, [2, [3, 4]], 5])   # 15
```

The base case here is implicit: a non-list element is added directly; an empty
list contributes 0.

## Recognizing a recursive problem

- The problem is naturally defined in terms of smaller versions of itself
  (factorial, Fibonacci, "flatten this nested structure").
- The data is hierarchical: trees, nested dicts/lists, file systems.
- Backtracking / "try every combination" (permutations, subsets, maze solving).
- A divide-and-conquer split (merge sort, quicksort, binary search).

## Common bugs

- **Missing or unreachable base case** → infinite recursion → `RecursionError`.
  Make sure every recursive call moves strictly toward the base.
- **Mutable default arguments as accumulators.** `def f(x, acc=[])` shares one list
  across calls; use `acc=None` then `acc = acc or []`.
- **Exponential blowup** from overlapping subproblems — memoize with `lru_cache`.
- **Returning instead of accumulating** (or vice versa). Decide whether each call
  *returns* a value to its caller or *mutates* shared state, and be consistent.
- **Hitting Python's depth limit** on large inputs — convert to an iterative
  solution with an explicit stack when depth grows with `n`.
