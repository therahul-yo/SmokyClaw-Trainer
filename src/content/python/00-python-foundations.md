---
id: python-00-foundations
title: Python foundations for interviews
track: python
topic: basics
order: 0
estMinutes: 12
prerequisites: []
pattern: python-foundations
---

# Python foundations for interviews

Python interview prep starts with basics, not tricks. If variables, loops,
lists, dictionaries, functions, and input/output are weak, every DSA problem
feels harder than it really is.

## What you must control first

- **Variables** hold values: numbers, strings, lists, dictionaries, sets.
- **Conditions** decide which branch runs.
- **Loops** repeat work over a range, string, list, or dictionary.
- **Functions** turn repeated logic into a reusable unit.
- **Data structures** decide the speed of your solution.
- **Input/output** decides whether your code works in a real coding test.

## Interview mental model

Most Python coding problems are this pipeline:

```python
def solve(data):
    # 1. Convert the input into useful structures.
    # 2. Run the pattern: loop, hashmap, two pointers, heap, DFS, DP.
    # 3. Return the exact output type.
    pass
```

The interviewer is not checking whether you know every Python feature. They are
checking whether you can pick simple, reliable tools and write correct code
quickly.

## Core syntax you should type without thinking

```python
for i in range(n):
    ...

for x in nums:
    ...

for i, x in enumerate(nums):
    ...

if condition:
    ...
elif other_condition:
    ...
else:
    ...
```

## Core containers

| Need | Use | Why |
|---|---|---|
| Ordered values | `list` | Indexing, append, sort, scan |
| Key to value | `dict` | Fast lookup, counts, last seen index |
| Unique values | `set` | Membership and deduplication |
| Immutable group | `tuple` | Return pairs, use as dict keys |
| Queue | `collections.deque` | Fast pop from both ends |
| Min priority | `heapq` | Top-K, scheduling, merge problems |

## Coding-test input/output

For platforms that call your function, focus on the function signature. For
platforms that read stdin, use this shape:

```python
import sys

data = sys.stdin.read().strip().split()
idx = 0

n = int(data[idx])
idx += 1
nums = list(map(int, data[idx:idx + n]))
idx += n

print(sum(nums))
```

## Common traps

- Using a list for membership checks when a set would be faster.
- Mutating a list while looping over it.
- Forgetting that strings are immutable.
- Returning the right values in the wrong type, such as tuple instead of list.
- Confusing `==` equality with `is` identity.
- Writing clever one-liners that are harder to debug under pressure.

## Recall hook

Use boring Python for interviews: clear loops, correct containers, clean
functions, exact output.
