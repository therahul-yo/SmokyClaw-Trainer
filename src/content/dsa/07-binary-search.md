---
id: dsa-07-binary-search
title: Binary search — and search on the answer
track: dsa
topic: binary-search
order: 7
estMinutes: 12
prerequisites: [dsa-04-big-o]
pattern: binary-search
---

# Binary search

If you have a **sorted** array (or any monotonic predicate over a range), binary search finds the answer in `O(log n)`.

## The template

```python
def bsearch(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

**Why `(lo + hi) // 2` is fine in Python.** No overflow. In Java/C++ use `lo + (hi - lo) // 2`.

## Use `bisect` — don't hand-roll

```python
import bisect
arr = [1, 3, 5, 7, 9]
bisect.bisect_left(arr, 5)         # 2 — first index where arr[i] >= 5
bisect.bisect_right(arr, 5)        # 3 — first index where arr[i] > 5
bisect.insort(arr, 4)              # keep sorted: [1, 3, 4, 5, 7, 9]
```

In interviews, you can hand-roll for the explanation, but `bisect` is faster and bug-free.

## The two flavors

### Find exact target
The template above. Returns index or `-1`.

### Find boundary / lower bound
"First index where condition is True." The condition must be **monotonic** — False, False, ..., False, True, True, ..., True.

```python
def lower_bound(arr, target):      # first i with arr[i] >= target
    lo, hi = 0, len(arr)           # NOTE: hi = len, not len - 1
    while lo < hi:                 # NOTE: <, not <=
        mid = (lo + hi) // 2
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo                      # lo == hi == answer (could be len(arr))
```

**Memorize the two invariants:**
- `arr[lo..]` is the "could still be answer" region.
- `arr[..lo]` is "definitely not answer."

Loop ends when the region shrinks to one slot. Move pointers so the answer never leaves the active region.

## Binary search on the answer

The big move. When the *answer itself* is a number with a monotonic test, binary-search the answer space.

**Example: minimum eating speed**. Koko eats bananas. Piles `piles[i]`, must finish in `H` hours, eating at rate `k` per hour (rounding up per pile). Find minimum `k`.

```python
def min_eating_speed(piles, H):
    def can_eat(k):
        hours = sum((p + k - 1) // k for p in piles)   # ceil division
        return hours <= H

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_eat(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**Pattern:** the predicate "can we do it with budget `k`?" is monotonic in `k`. Binary search the smallest `k` that satisfies it. `O(n log(max(piles)))`.

This pattern shows up in: minimum capacity to ship in D days, split array into k subarrays with min largest sum, allocate books, etc.

## Common pitfalls

- **Infinite loop.** Symptom: `lo` and `hi` are 1 apart and neither moves. Fix: in the boundary template, ensure `lo` strictly increases when you move it (`lo = mid + 1`).
- **Off-by-one on `hi`.** For exact-find, `hi = len - 1` and `<=`. For lower-bound, `hi = len` and `<`. Stick to one of the two templates above.
- **Forgetting monotonicity.** Binary search REQUIRES a monotonic predicate. If `arr[i] == target` for multiple `i` and you want any one — fine. If the array isn't sorted — sort it first or you can't binary search.
- **Rotated sorted array.** Modified template: at each step, identify which half is sorted, then check whether target lies in that half.

## Complexity

`O(log n)` for plain search, `O(log(range) · check_cost)` for search-on-the-answer. The base of the log doesn't matter for Big-O — `log₂` vs `log₁₀` differ by a constant.
