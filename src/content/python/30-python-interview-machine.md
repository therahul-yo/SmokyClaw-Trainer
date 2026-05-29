---
id: python-30-interview-machine
title: Python interview machine guide
track: python
topic: interview-training
order: 30
estMinutes: 28
prerequisites: [python-00-foundations]
pattern: python-interview-machine
---

# Python interview machine guide

Python mastery for interviews is not about using every advanced feature. It is
about choosing the simplest correct tool fast, writing predictable code, and
explaining why the code is efficient.

The target is boring excellence:

1. Read the input contract.
2. Pick the right container.
3. Write a small function.
4. Handle edge cases first.
5. Keep variable names honest.
6. Return the exact type requested.
7. Explain complexity without guessing.

## Container decision table

Most Python mistakes come from choosing the wrong data structure.

| Need | Use | Avoid |
|---|---|---|
| Append and scan values | `list` | Using dict when order/index matters |
| Fast membership | `set` | `x in list` inside a loop |
| Count frequency | `dict` or `collections.Counter` | Nested loops |
| Map key to latest value | `dict` | Parallel arrays |
| Queue behavior | `collections.deque` | `list.pop(0)` |
| Top K / smallest next | `heapq` | Sorting after every insert |
| Sorted insertion/search | `bisect` | Manual binary search unless asked |
| Pair key | `tuple` | String concatenation like `"a:b"` |

If the problem says "duplicate", "seen before", "frequency", "first index",
or "lookup", your default should be dict or set.

## Core templates

### Frequency map

```python
def count_items(items):
    freq = {}
    for x in items:
        freq[x] = freq.get(x, 0) + 1
    return freq
```

Use this when the problem asks about counts, duplicates, majority, anagrams, or
matching pairs.

### First-seen order

```python
def unique_in_order(items):
    seen = set()
    out = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out
```

This is different from `list(set(items))`. A set removes duplicates but does not
communicate "preserve first-seen order" as a solution.

### Safe min/max scan

```python
def best_value(nums):
    if not nums:
        return None

    best = nums[0]
    for x in nums[1:]:
        if x > best:
            best = x
    return best
```

Do not initialize best to `0` unless the problem guarantees non-negative values.
Negative-only arrays expose that bug immediately.

### Parse stdin

```python
import sys

tokens = sys.stdin.read().strip().split()
idx = 0

n = int(tokens[idx])
idx += 1

nums = list(map(int, tokens[idx:idx + n]))
idx += n
```

This pattern is reliable for coding platforms. Avoid repeated `input()` when the
input is large.

## Function writing discipline

Before coding, write the shape:

```python
def solve(...):
    # edge cases

    # state

    # loop / recursion

    # return exact type
```

Never begin with random code. The function shape prevents panic.

## Mutability rules

Python lists, dicts, and sets are mutable. Strings, tuples, and integers are not.

```python
a = [1, 2]
b = a
b.append(3)
# a is now [1, 2, 3]
```

If you need a separate list:

```python
b = a[:]
```

If you need a separate nested list, slicing is not enough:

```python
grid2 = [row[:] for row in grid]
```

This matters in matrix, graph, and backtracking problems.

## Sorting without confusion

Use tuple keys for multiple rules.

```python
students.sort(key=lambda row: (-row["score"], row["name"]))
```

This means:

1. Higher score first.
2. If scores tie, smaller name first.

Do not write a custom comparator unless the platform forces it.

## Interview explanation script

After solving, say:

```text
I scan the input once.
The dictionary stores the information I need for constant-time lookup.
Each element is processed once, so time is O(n).
The dictionary can grow to n keys, so space is O(n).
```

This exact clarity matters. Do not say "it is probably O(n)".

## Common beginner-to-interview traps

- `list.pop(0)` inside a loop creates hidden `O(n^2)` behavior.
- `dict[key]` crashes if the key is missing; use `get`, `defaultdict`, or check.
- `set` requires hashable values. Lists cannot be set members; tuples can.
- `sort()` mutates and returns `None`; `sorted()` returns a new list.
- Default mutable arguments retain state across calls.
- `is` checks identity, not value equality.
- `return` exits the whole function, not just the loop.
- Integer division with `/` returns float; use `//` when exact integer division is intended.

## Practice mindset

For every Python problem, write down:

1. Which container is doing the real work?
2. What is stored in it?
3. When does it change?
4. What edge case would break a careless solution?
5. What is the time and space complexity?

If you can answer those five questions, your Python is becoming interview-ready.
