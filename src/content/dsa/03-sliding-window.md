---
id: dsa-03-sliding-window
title: Sliding window
track: dsa
topic: sliding-window
order: 3
estMinutes: 12
prerequisites: [dsa-02-two-pointer]
pattern: sliding-window
---

# Sliding window

A sliding window is two pointers where you maintain a running aggregate (sum, count, max) over the elements *between* them. It turns "for every window, compute X" from O(n·k) into O(n).

There are two flavors: **fixed-size** and **variable-size**.

## Fixed-size window

Max sum of any contiguous subarray of length `k`:

```python
def max_sum_k(nums, k):
    s = sum(nums[:k])          # initial window
    best = s
    for i in range(k, len(nums)):
        s += nums[i] - nums[i - k]   # add the entering, drop the leaving
        best = max(best, s)
    return best
```

The trick: when the window moves one step, only one element enters and one leaves — don't recompute from scratch.

## Variable-size window

Longest substring with no repeating characters:

```python
def longest_unique(s):
    seen = {}                  # char -> last index
    left = 0
    best = 0
    for right, c in enumerate(s):
        if c in seen and seen[c] >= left:
            left = seen[c] + 1   # shrink from the left
        seen[c] = right
        best = max(best, right - left + 1)
    return best
```

The window expands by `right`; when a duplicate appears, we shrink `left` to invalidate the duplicate. Each character is visited at most twice — O(n).

## When to reach for sliding window

- "Longest / shortest / maximum / minimum subarray (substring) such that ..."
- "Contiguous" is the keyword. If the problem allows skipping, it's not sliding window.
- The condition must be incrementally maintainable: adding/removing one element should cheaply update your aggregate.

## Common pitfalls

- Off-by-one when initializing the first window — use `sum(nums[:k])` and start the loop at `i = k`.
- Forgetting to shrink before/after expanding — variable-size needs an inner `while` loop on the left pointer.
- Using sliding window when the problem actually needs prefix sums (next lesson) — sliding window can't easily answer "any range sum on demand."
