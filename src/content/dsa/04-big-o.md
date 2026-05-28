---
id: dsa-04-big-o
title: Big-O & complexity — the absolute basics
track: dsa
topic: complexity
order: 4
estMinutes: 10
prerequisites: [dsa-01-arrays]
pattern: complexity
---

# Big-O — the language interviewers grade you in

Big-O describes how an algorithm's running time grows as the input grows. You don't need to be a math major — you need to recognize a handful of shapes and know which operations cost what.

## The cheat sheet

| Notation | Name | Rough feel | Example |
|---|---|---|---|
| `O(1)` | constant | "doesn't matter how big the input is" | dict lookup, list indexing, push/pop |
| `O(log n)` | logarithmic | "halves each step" | binary search, balanced-tree ops |
| `O(n)` | linear | "one pass" | scan a list, sum elements |
| `O(n log n)` | linearithmic | "sort, then walk" | `sorted()`, mergesort, heapsort |
| `O(n²)` | quadratic | "nested loop over the same thing" | bubble sort, naive pair check |
| `O(2ⁿ)` | exponential | "decision tree, no memo" | naive recursion (fib without cache) |
| `O(n!)` | factorial | "every permutation" | brute-force TSP |

For `n = 10^5`:
- `O(n)` ≈ 10⁵ ops → instant.
- `O(n log n)` ≈ 1.7×10⁶ → still instant.
- `O(n²)` ≈ 10¹⁰ → minutes. TLE.
- `O(2ⁿ)` → don't even.

Most interview judges allow roughly **10⁸ simple operations per second**. Use that as your back-of-envelope.

## How to count complexity

1. **Loops multiply.** A loop of length `n` inside a loop of length `n` is `O(n²)`. Inside a loop of length `m` is `O(nm)`.
2. **Sequential blocks add.** Sort (`O(n log n)`) followed by a scan (`O(n)`) is `O(n log n)` — the bigger term wins.
3. **Drop constants and lower-order terms.** `O(3n + 5)` is just `O(n)`. `O(n² + n)` is `O(n²)`.
4. **Recursion = recurrence.** `T(n) = 2·T(n/2) + O(n)` solves to `O(n log n)` (merge sort). `T(n) = T(n-1) + O(1)` is `O(n)`. The **Master Theorem** generalizes this — for interviews, memorize merge-sort and binary-search shapes.

## Space complexity

Same idea, but counts memory: extra arrays, recursion stack frames, hashmaps. A recursive function with no extra storage still costs `O(depth)` space because of the call stack.

```python
def sum_recursive(nums, i=0):     # O(n) time, O(n) space (stack frames)
    if i == len(nums): return 0
    return nums[i] + sum_recursive(nums, i + 1)

def sum_iterative(nums):          # O(n) time, O(1) space
    s = 0
    for x in nums: s += x
    return s
```

## Python built-in costs you must know

| Operation | Complexity |
|---|---|
| `list[i]`, `list.append(x)`, `list.pop()` | `O(1)` amortized |
| `list.insert(0, x)`, `list.pop(0)` | `O(n)` — use `deque` |
| `x in list` | `O(n)` |
| `x in set` / `x in dict` | `O(1)` average |
| `dict[k] = v` | `O(1)` average |
| `sorted(list)`, `list.sort()` | `O(n log n)` |
| `set.union`, `set.intersection` | `O(len)` |
| `''.join(parts)` | `O(total length)` |
| Repeated string `+=` in a loop | `O(n²)` — build a list, `''.join` at end |

## Best vs average vs worst

When you say `O(...)` without qualifying, you usually mean **worst-case**. But interviewers may probe:

- **Best case** — the input that lets you exit early. Often misleading; interviewers rarely care.
- **Average case** — what happens on "random" input.
- **Amortized** — average per operation across a long sequence. Python `list.append` is `O(1)` *amortized* even though occasional resizes are `O(n)`.

## Common traps

- **`O(n²)` hidden inside `sum(...)` or `min(...)` inside a loop.** Each call is `O(n)`. Loop n times → `O(n²)`.
- **String concatenation in a loop is `O(n²)`** in Python — strings are immutable, every `+=` rebuilds.
- **`x in list` inside a loop is `O(n²)`.** Convert to a `set` first.
- **Recursion blowing the stack.** Python default recursion limit is 1000. For deep recursion, convert to iteration or `sys.setrecursionlimit`.

## The drill — eyeball these

```python
# 1
for i in range(n):
    for j in range(n):
        ...                       # O(n^2)

# 2
for i in range(n):
    for j in range(i):
        ...                       # O(n^2) — n*(n-1)/2

# 3
i = n
while i > 0: i //= 2              # O(log n)

# 4
for i in range(n):
    j = 1
    while j < n: j *= 2           # O(n log n)

# 5
def f(n):
    if n <= 1: return 1
    return f(n-1) + f(n-1)        # O(2^n)
```

**Rule of thumb for interviews:** state the complexity of your solution *before* you write it, and check it against the constraints. If `n ≤ 10⁵` and you wrote `O(n²)`, you need a better idea.
