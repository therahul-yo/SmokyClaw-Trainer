---
id: python-10-generators
title: Iterators & generators
track: python
topic: iterators
order: 10
estMinutes: 10
prerequisites: [python-02-data-types]
pattern: python-iter
---

# Iterators & generators

Python's iteration protocol is two methods: `__iter__` (returns an iterator) and `__next__` (returns the next value or raises `StopIteration`). Everything that goes through a `for` loop implements them — lists, dicts, files, generators, even strings.

## Why generators matter

A generator function uses `yield` instead of `return`. Calling it returns an iterator that produces values lazily, one at a time:

```python
def first_n_squares(n):
    for i in range(n):
        yield i * i

for s in first_n_squares(5):
    print(s)
# 0 1 4 9 16
```

Memory: a generator holds **one** value at a time, not all `n`. For large or infinite sequences (`itertools.count()`), this is the difference between a working program and `MemoryError`.

## Generator expressions vs. list comprehensions

```python
sum(x * x for x in range(10_000_000))   # generator: O(1) extra memory
sum([x * x for x in range(10_000_000)]) # list: ~80MB of intermediate ints
```

Use generator expressions when you only consume the values once and don't need to index/slice.

## itertools — the standard cheat sheet

| Function | What it does |
|---|---|
| `count(start, step)` | Infinite counter |
| `cycle(iter)` | Loops forever |
| `repeat(x, n)` | `x` repeated `n` times |
| `chain(a, b, ...)` | Concatenate iterables |
| `islice(iter, start, stop, step)` | Slice without materializing |
| `groupby(iter, key)` | Run-length-style grouping (input must be sorted by key) |
| `combinations(iter, r)` | All r-element combinations |
| `permutations(iter, r)` | All r-length permutations |
| `accumulate(iter, op)` | Running sum/product/max |

## Common interview gotchas

1. **Generators are single-use.** After `for x in g: ...` finishes, `g` is exhausted. Iterate `list(g)` if you need to reuse.
2. **`next(g, default)`** is the safe way to peek — without `default`, it raises `StopIteration`.
3. **Generator + `return`** ends the generator early; the return value is the `.value` on `StopIteration`. Rarely used outside coroutines.
4. **`yield from sub_iter`** delegates to another iterator — cleaner than a manual `for x in sub_iter: yield x`.

## When to use a class-based iterator

If you need iteration plus statefulness or methods that aren't iteration (a queue you can also peek into), implement `__iter__` and `__next__` on a class. Otherwise prefer generator functions — they're shorter and faster.
