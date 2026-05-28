---
id: python-04-comprehensions
title: List, dict & set comprehensions
track: python
topic: syntax
order: 5
estMinutes: 8
prerequisites: [python-02-data-types]
---

# Comprehensions

Comprehensions are Python's compact, faster-than-loops way to build collections. Three shapes, one mental model.

## The three forms

```python
# list
squares = [x * x for x in range(10)]

# dict
sq_map = {x: x * x for x in range(10)}

# set
evens = {x for x in range(20) if x % 2 == 0}
```

Read them as: `[<expression> for <var> in <iter> if <condition>]`. The `if` is optional.

## Multiple `for` clauses

Nested loops, left-to-right outer-to-inner:

```python
pairs = [(i, j) for i in range(3) for j in range(3) if i != j]
# [(0,1),(0,2),(1,0),(1,2),(2,0),(2,1)]
```

Equivalent to:

```python
pairs = []
for i in range(3):
    for j in range(3):
        if i != j:
            pairs.append((i, j))
```

## When *not* to use a comprehension

- **It's hard to read.** Three nested `for`s or a ternary inside an `if` — write a loop.
- **Side effects.** `[print(x) for x in xs]` works but builds a useless list. Use a `for` loop.
- **You don't need the result.** Use a generator expression `sum(x*x for x in nums)` — no intermediate list, O(1) memory.

## Comprehension vs `map` / `filter`

```python
list(map(str.upper, ["a", "b"]))             # ['A', 'B']
[s.upper() for s in ["a", "b"]]              # ['A', 'B'] — usually preferred

list(filter(lambda x: x > 0, [-1, 2, -3]))   # [2]
[x for x in [-1, 2, -3] if x > 0]            # [2] — usually preferred
```

`map`/`filter` are fine when the function already exists. Comprehensions win for inline expressions because there's no lambda noise.

## The walrus inside a comprehension (3.8+)

```python
# Keep only items whose .strip() is non-empty, computing it once
clean = [s for line in lines if (s := line.strip())]
```

Useful, but resist if it makes the comprehension cryptic.
