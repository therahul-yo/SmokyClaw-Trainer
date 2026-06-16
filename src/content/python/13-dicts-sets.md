---
id: python-13-dicts-sets
title: Dicts & sets deep-dive — hashing, views, and idioms
track: python
topic: data-types
order: 13
estMinutes: 12
prerequisites: [python-02-data-types]
---

# Dicts & sets deep-dive

Dictionaries and sets are Python's hash-based collections: average `O(1)` lookup,
insert, and membership. They underpin most "count this", "have I seen this", and
"group by" interview solutions. This lesson goes past the basics to the behaviours
that trip people up.

## Why O(1) — and what it requires

Both store keys in a hash table. Insert, lookup, and `in` are average `O(1)`
because the key's `hash()` jumps near its slot. The cost: **keys must be
hashable** (immutable-ish). Strings, numbers, and tuples of hashables are fine;
lists and dicts are not:

```python
{[1, 2]: "x"}      # TypeError: unhashable type: 'list'
{(1, 2): "x"}      # fine — tuple of immutables is hashable
```

`x in some_set` / `x in some_dict` is `O(1)`; `x in some_list` is `O(n)`. Swapping
a membership test from a list to a set is a classic speedup.

## Insertion order is preserved (since 3.7)

Dicts remember insertion order; iterating yields keys in the order added. Sets do
**not** guarantee any order. Don't rely on set iteration order for output —
`sorted(my_set)` when you need determinism.

## Safe access idioms

```python
d.get(key)              # None if missing (no KeyError)
d.get(key, 0)           # custom default
d.setdefault(key, [])   # get-or-insert-then-return
```

For counting and grouping, `collections` saves boilerplate:

```python
from collections import Counter, defaultdict

Counter("banana")              # Counter({'a': 3, 'n': 2, 'b': 1})
groups = defaultdict(list)
groups[key].append(value)      # no KeyError on first touch
```

`Counter` also gives `.most_common(k)` — the top-k by frequency in one call.

## Views update live

`d.keys()`, `d.values()`, `d.items()` return **views**, not copies — they reflect
later mutations and are cheap. To freeze a snapshot, wrap in `list(...)`. Never
mutate a dict while iterating its view:

```python
for k in list(d):          # iterate a COPY of the keys
    if should_drop(k):
        del d[k]           # safe — we're iterating the list, not the live view
```

## Merging and comprehensions

```python
merged = {**a, **b}            # b wins on key conflicts
merged = a | b                 # 3.9+ union operator, same semantics
squares = {n: n * n for n in range(5)}
seen_first = {x for x in items}    # set comprehension dedupes
```

## Set algebra

```python
a | b      # union
a & b      # intersection
a - b      # difference (in a, not b)
a ^ b      # symmetric difference (in exactly one)
a <= b     # subset test
```

These turn "which items are common / missing / unique" questions into one-liners.

## Recognizing a dict/set problem

- "Count occurrences / frequencies" → `Counter`.
- "Have I seen this before?", "remove duplicates", "is it unique?" → `set`.
- "Group items by some key" → `defaultdict(list)`.
- "Look something up by id / map A to B" → `dict`.
- "Common / missing / overlapping elements" → set algebra.

## Common bugs

- **Unhashable keys.** Lists/dicts/sets can't be keys; convert lists to tuples.
- **Mutating during iteration.** `RuntimeError: dictionary changed size during
  iteration` — iterate over `list(d)` if you'll add/remove keys.
- **Assuming set order.** Sets are unordered; sort when output order matters.
- **`d[missing]` raises `KeyError`** — use `.get()` or `defaultdict` for defaults.
- **Aliasing.** `b = a` for a dict shares the same object; use `a.copy()` (shallow)
  or `copy.deepcopy` for an independent copy.
