---
id: python-32-worked-debugging-edge-cases
title: Worked examples: debugging and edge cases
track: python
topic: worked-examples
order: 32
estMinutes: 30
prerequisites: [python-30-interview-machine]
pattern: python-debugging
---

# Worked examples: debugging and edge cases

Interview failures often come from tiny edge cases, not lack of theory. A
machine-like learner actively hunts for failure modes before submitting.

## Debugging loop

Use this loop when code fails:

```text
Read expected vs actual.
Find the smallest failing input.
Trace variables by hand.
Name the broken assumption.
Patch the assumption.
Retest edge cases.
```

## Example 1: Bad max initialization

Buggy code:

```python
def max_value(nums):
    best = 0
    for x in nums:
        if x > best:
            best = x
    return best
```

Failing input:

```text
nums = [-5, -2, -9]
expected = -2
actual = 0
```

Broken assumption:

```text
There is always a value >= 0.
```

Fix:

```python
def max_value(nums):
    if not nums:
        return None
    best = nums[0]
    for x in nums[1:]:
        if x > best:
            best = x
    return best
```

Mistake rule:

Initialize from the input when values can be negative.

## Example 2: Mutating while iterating

Buggy code:

```python
def remove_even(nums):
    for x in nums:
        if x % 2 == 0:
            nums.remove(x)
    return nums
```

Failing input:

```text
[2, 4, 6] -> [4]
```

Why it fails:

Removing shifts the list while the loop index keeps moving.

Fix:

```python
def remove_even(nums):
    return [x for x in nums if x % 2 != 0]
```

Mistake rule:

Do not structurally modify a list while looping over it unless you control the
index carefully.

## Example 3: Shallow copy trap

Buggy code:

```python
grid = [[0] * 3] * 3
grid[0][0] = 1
```

Actual grid:

```text
[[1,0,0],
 [1,0,0],
 [1,0,0]]
```

Why:

All rows reference the same list.

Fix:

```python
grid = [[0] * 3 for _ in range(3)]
```

Mistake rule:

For nested lists, build each row separately.

## Example 4: Default mutable argument

Buggy code:

```python
def add_item(x, bucket=[]):
    bucket.append(x)
    return bucket
```

Unexpected behavior:

```text
add_item(1) -> [1]
add_item(2) -> [1, 2]
```

Fix:

```python
def add_item(x, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(x)
    return bucket
```

Mistake rule:

Default arguments are created once. Do not use mutable defaults for per-call
state.

## Example 5: Off-by-one in range

Buggy code:

```python
def sum_first_n(n):
    total = 0
    for i in range(n):
        total += i
    return total
```

If the intent is `1 + 2 + ... + n`, this misses `n`.

Fix:

```python
def sum_first_n(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total
```

Mistake rule:

`range(a, b)` includes `a` and excludes `b`.

## Edge-case checklist

Before submit, create tiny tests:

```text
empty
one item
two items
all same
all negative
duplicates
already sorted
reverse sorted
no answer
answer at boundary
```

The fastest programmers are not the ones who never make mistakes. They are the
ones who have a mechanical way to catch mistakes early.
