---
id: dsa-02-two-pointer
title: Two pointers
track: dsa
topic: two-pointer
order: 2
estMinutes: 10
prerequisites: [dsa-arrays]
pattern: two-pointer
---

# Two pointers

Two pointers is the single most common pattern in coding interviews. Whenever you see "sorted array" or "find a pair / triplet / subarray," reach for it first.

The idea: instead of nesting two loops (O(n²)), walk two indices over the array — usually starting at the ends and moving inward, or one fast and one slow.

## Opposite-end variant

Sorted array, want a pair with a target sum:

```python
def two_sum_sorted(a, target):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == target:
            return [i, j]
        if s < target:
            i += 1     # need bigger → move left pointer right
        else:
            j -= 1     # need smaller → move right pointer left
    return []
```

Why is this O(n)? Each iteration moves one pointer toward the other. They meet after n steps.

## Fast + slow variant

Linked-list cycle detection, midpoint finding, deduping in place:

```python
def remove_duplicates(a):
    if not a:
        return 0
    write = 1
    for read in range(1, len(a)):
        if a[read] != a[read - 1]:
            a[write] = a[read]
            write += 1
    return write
```

`write` is the slow pointer; `read` is fast. Slow only advances when there's a new value worth keeping.

## When NOT to use

- Unsorted input where the pairing condition isn't monotonic — use hashing instead.
- When you need to keep all pairs, not just find one — two pointers gives you the first match efficiently, enumerating all pairs may still be O(n²).

## Interview cue words

"Sorted," "in-place," "pair / triplet with sum," "remove duplicates," "longest substring with X" (often paired with sliding window — see next lesson).
