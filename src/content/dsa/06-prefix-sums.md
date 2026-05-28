---
id: dsa-06-prefix-sums
title: Prefix sums — range queries in O(1)
track: dsa
topic: prefix-sums
order: 6
estMinutes: 8
prerequisites: [dsa-04-big-o]
pattern: prefix-sums
---

# Prefix sums

If you need many sum-of-range queries on a fixed array, precompute prefix sums once and answer each query in `O(1)`.

## The build

```python
def build_prefix(nums):
    P = [0] * (len(nums) + 1)
    for i, x in enumerate(nums):
        P[i + 1] = P[i] + x
    return P
```

Now `sum(nums[l:r])` (Python half-open slice — `l` inclusive, `r` exclusive) equals `P[r] - P[l]`.

```python
nums = [3, 1, 4, 1, 5, 9, 2, 6]
P    = [0, 3, 4, 8, 9, 14, 23, 25, 31]
# sum of nums[2:5] = 4+1+5 = 10
# = P[5] - P[2] = 14 - 4 = 10 ✓
```

The `+1` size and the leading `0` are not optional — they kill off-by-one bugs.

## Why this matters

Naive: `q` queries × `O(n)` per query = `O(n·q)`. Prefix: `O(n)` preprocess + `O(1)` per query = `O(n + q)`. For `n = q = 10^5`, that's the difference between TLE and instant.

## Pattern: "count subarrays with sum = k"

This is where prefix sums + hashmap combine.

```python
def subarray_sum_equals_k(nums, k):
    count = 0
    prefix = 0
    seen = {0: 1}                  # prefix sum -> how many times we've seen it
    for x in nums:
        prefix += x
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
```

**The insight:** subarray `nums[i..j]` has sum `k` iff `P[j+1] - P[i] = k`, iff `P[i] = P[j+1] - k`. So for each running prefix, look up how many earlier prefixes equal `prefix - k`. `O(n)` time.

The seed `seen = {0: 1}` accounts for subarrays starting at index 0 — their "prefix before" is 0.

## 2D prefix sums

For sum-of-rectangle queries on a grid:

```
P[r+1][c+1] = grid[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]
```

A rectangle from `(r1,c1)` to `(r2,c2)` (inclusive) sums to:

```
P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
```

Inclusion-exclusion. Build once, query in `O(1)`.

## Difference arrays — the inverse

If you need to **apply** many range-add updates and then read final values, use a difference array:

```python
def range_adds(n, updates):        # updates: list of (l, r, val) — add val to nums[l..r] inclusive
    diff = [0] * (n + 1)
    for l, r, val in updates:
        diff[l] += val
        diff[r + 1] -= val
    out = [0] * n
    cur = 0
    for i in range(n):
        cur += diff[i]
        out[i] = cur
    return out
```

`O(updates + n)` instead of `O(updates · n)`. Prefix sums and difference arrays are duals — one for queries, the other for updates.

## Common traps

- **Off-by-one with inclusive vs exclusive end.** Pick one convention (half-open is cleaner) and stick to it.
- **Forgetting the seed in the hashmap version** (`seen = {0: 1}`) — drops subarrays starting at index 0.
- **Integer overflow** — not an issue in Python, but worth flagging if your interviewer is in Java/C++ mode.
