---
id: python-03-mutability
title: Mutability, identity & copies
track: python
topic: data-types
order: 4
estMinutes: 10
prerequisites: [python-02-data-types]
pattern: python-data-model
---

# Mutability, identity & copies

Python's most common interview gotchas all live here. Master this once and stop being surprised.

## Mutable vs immutable

| Mutable | Immutable |
|---|---|
| `list`, `dict`, `set`, `bytearray`, user classes | `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes`, `None` |

A mutable object can be changed in place; an immutable one can't — every "modification" creates a new object.

```python
a = [1, 2, 3]
a.append(4)       # in place — same list object
print(a)          # [1, 2, 3, 4]

s = "hello"
s += " world"     # builds a NEW string, rebinds s
```

## `is` vs `==`

`==` asks "do they hold equal values?" `is` asks "are they literally the same object in memory?"

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b   # True — values match
a is b   # False — two different list objects
a is a   # True
```

Use `is` only for singletons: `is None`, `is True`, `is False`. Never `x is 5` (small-int caching is a CPython implementation detail you should not depend on).

## The default-argument trap

```python
def add_item(item, basket=[]):
    basket.append(item)
    return basket

add_item("a")   # ['a']
add_item("b")   # ['a', 'b']   ← surprise!
```

The default `[]` is created **once**, at function-definition time. Every call without `basket=` shares the same list.

Fix:

```python
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket
```

This is the #1 most-asked Python interview gotcha.

## Shallow vs deep copy

```python
import copy

a = [[1, 2], [3, 4]]
b = a               # alias — both names point to same list
c = a.copy()        # shallow — outer list copied, inner lists shared
d = copy.deepcopy(a)# deep — everything copied recursively

a[0].append(99)
# b == [[1, 2, 99], [3, 4]]  (same object)
# c == [[1, 2, 99], [3, 4]]  (inner list still shared!)
# d == [[1, 2], [3, 4]]      (truly independent)
```

`list(a)`, `a[:]`, `a.copy()`, `copy.copy(a)` — all shallow.

## Tuples can hide mutable state

```python
t = ([1, 2], [3, 4])
t[0].append(99)     # works! the list inside is mutable
t[0] = [9]          # error — can't rebind tuple slots
```

A tuple is immutable in *which objects it references*, not in those objects' contents.

## Hashability

Only immutable objects (or user classes with `__hash__`) can be dict keys or set members. Lists, dicts, sets — not hashable.

```python
{[1, 2]: "x"}   # TypeError: unhashable type: 'list'
{(1, 2): "x"}   # fine
```
