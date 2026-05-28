---
id: dsa-05-hashing
title: Hashing — sets, dicts, frequency maps
track: dsa
topic: hashmap
order: 5
estMinutes: 10
prerequisites: [dsa-04-big-o]
pattern: hashing
---

# Hashing — the O(1) lookup that unlocks half of DSA

A hash table maps keys to slots via a hash function. Average **O(1)** for insert, lookup, delete. In Python this is `dict` and `set`. Maybe 50% of "easy" interview problems collapse from `O(n²)` to `O(n)` with a hashmap.

## The pattern: "have I seen this before?"

```python
def has_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False
```

`O(n)` time, `O(n)` space. The brute-force `for i, for j` is `O(n²)`.

## Two Sum — the canonical hashmap problem

Given `nums` and `target`, return indices of two numbers summing to `target`.

```python
def two_sum(nums, target):
    index_of = {}                  # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in index_of:
            return [index_of[need], i]
        index_of[x] = i
    return []
```

**Trick:** check *before* you insert — handles the "same element used twice" case.

## Frequency counts

```python
from collections import Counter
counts = Counter("mississippi")
counts.most_common(2)              # [('i', 4), ('s', 4)]
```

Use `Counter` for: anagram check, top-K frequencies, character histograms.

## Grouping

```python
from collections import defaultdict
groups = defaultdict(list)
for word in words:
    key = "".join(sorted(word))
    groups[key].append(word)
return list(groups.values())       # group-anagrams
```

`defaultdict(list)` saves you the "if key not in dict: dict[key] = []" boilerplate.

## What makes a good hash key

- **Must be hashable** — immutable. `int`, `str`, `tuple` (of hashables), `frozenset` work. `list`, `dict`, `set` don't.
- **Equal keys must hash equal.** If you define `__eq__` on a class, define `__hash__` too.
- **Tuples are your friend.** Want a 2D grid coordinate key? Use `(r, c)`.

## When NOT to use a hashmap

- When you need **sorted order** — use a sorted list + `bisect`, or a balanced BST (no stdlib).
- When inputs are **small integers in a known range** — a plain array `counts[x] += 1` is faster than a dict.
- When the key is a **large immutable structure** and computing the hash dominates.

## Worst case

`O(1)` is *average*. Worst case is `O(n)` if every key hashes to the same bucket. CPython randomizes string hashing, so pathological collisions don't happen in practice — but in interview-speak, "hashmap is O(1) on average, O(n) worst case."

## Patterns this unlocks

- **Two-sum / k-sum** — turn nested loop into single pass.
- **Longest substring without repeats** — sliding window + hashmap of last-seen index.
- **Subarray sum equals k** — prefix sums + hashmap.
- **Group anagrams / isomorphic strings** — canonical-key grouping.
- **Detect cycle in linked list** — `seen` set of nodes (though Floyd's is better).
- **LRU cache** — `OrderedDict` (hashmap + linked list).

If a brute force has a "compare every pair" or "look up by value" inside a loop, ask: *can a dict or set make that O(1)?*
