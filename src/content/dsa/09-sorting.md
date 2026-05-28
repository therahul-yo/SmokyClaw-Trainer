---
id: dsa-09-sorting
title: Sorting — what to know, what to skip
track: dsa
topic: sorting
order: 9
estMinutes: 10
prerequisites: [dsa-04-big-o]
pattern: sorting
---

# Sorting

In a Python interview you almost never implement a sort. You **use** `sorted()` or `list.sort()` and reason about complexity. But interviewers do ask about the algorithms — so know the table cold.

## The table

| Algorithm | Avg / Worst | Space | Stable? | Notes |
|---|---|---|---|---|
| Bubble | O(n²) / O(n²) | O(1) | yes | Don't use it. Ever. |
| Insertion | O(n²) / O(n²) | O(1) | yes | Great on nearly-sorted small arrays. |
| Selection | O(n²) / O(n²) | O(1) | no | Always n² regardless of input. |
| Mergesort | O(n log n) / O(n log n) | O(n) | yes | Reliable. Divide & conquer. |
| Quicksort | O(n log n) / O(n²) | O(log n) | no | Fast in practice. Worst case on sorted/reverse input with bad pivot. |
| Heapsort | O(n log n) / O(n log n) | O(1) | no | In-place but slow constants. |
| **Timsort** | O(n log n) / O(n log n) | O(n) | **yes** | What Python uses. Adaptive — `O(n)` on already-sorted input. |
| Counting | O(n + k) | O(k) | yes | When values are small ints in a known range. |
| Radix | O(d(n + k)) | O(n + k) | yes | Fixed-width integers/strings. |

**Stable** = equal elements keep their original relative order. Matters when you sort by multiple keys.

## What Python gives you

```python
sorted(iter)                       # returns new list
list.sort()                        # in-place, returns None
sorted(items, key=lambda x: x[1])  # sort by second element
sorted(items, reverse=True)
sorted(items, key=lambda x: (x.age, x.name))   # primary: age, tiebreak: name
```

**Always use `key=` instead of `cmp=` style.** Python 3 removed `cmp`; for the rare case you need it, `functools.cmp_to_key` exists.

## The patterns

### Sort + scan
Many problems become trivial after sorting. Pair sum, meeting rooms, group anagrams, k closest points.

```python
def k_closest(points, k):
    return sorted(points, key=lambda p: p[0]**2 + p[1]**2)[:k]
# O(n log n) — simpler than the O(n log k) heap version, often fine.
```

### Sort by custom key
```python
intervals.sort(key=lambda iv: iv[0])      # sort by start
intervals.sort(key=lambda iv: (iv[0], -iv[1]))  # by start asc, end desc
```

### Counting sort niche
When you sort `n` small integers in `[0, k]` where `k` is small (e.g. ages 0–120, characters 'a'–'z'):

```python
def counting_sort(nums, max_val):
    counts = [0] * (max_val + 1)
    for x in nums: counts[x] += 1
    out = []
    for v, c in enumerate(counts):
        out.extend([v] * c)
    return out
```

`O(n + k)`. Beats `O(n log n)` when `k = O(n)`.

## What interviewers ask

1. **"What sort does Python use?"** Timsort — hybrid stable sort. Average and worst-case `O(n log n)`. `O(n)` on nearly-sorted input.
2. **"What's a stable sort?"** A sort that preserves the relative order of equal elements.
3. **"Quicksort worst case?"** `O(n²)` — happens on already-sorted input with a naive (first-element) pivot. Randomized or median-of-three pivots avoid it.
4. **"Sort vs heap for top-K?"** Sort: `O(n log n)`. Heap of size K: `O(n log k)`. For small K and large N, heap wins.

## Don't reinvent

```python
sorted(items, key=...)             # almost always the right answer
heapq.nsmallest(k, items, key=...) # top-K small
heapq.nlargest(k, items, key=...)  # top-K large
```

If a problem says "sort," start with the built-in. If it says "top-K," reach for `heapq`. If it says "find the k-th largest in O(n)," quickselect — a quicksort variant — does it on average.
