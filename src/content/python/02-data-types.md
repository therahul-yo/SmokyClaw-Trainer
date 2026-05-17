---
id: python-data-types
title: Built-in Data Types
track: python
topic: data-types
order: 2
estMinutes: 15
prerequisites: [python-syntax]
---

# Built-in Data Types

This is the highest-yield Python lesson for service-company tests. **Master the five built-in containers** — `str`, `list`, `tuple`, `dict`, `set` — and you can answer 60% of Python MCQs without re-reading the question.

## Quick reference

| Type | Mutable? | Ordered? | Duplicates? | Syntax |
|---|---|---|---|---|
| `str` | ❌ | ✅ | ✅ | `"hello"`, `'world'` |
| `list` | ✅ | ✅ | ✅ | `[1, 2, 3]` |
| `tuple` | ❌ | ✅ | ✅ | `(1, 2, 3)` |
| `dict` | ✅ | ✅ (3.7+) | keys: ❌ | `{"a": 1}` |
| `set` | ✅ | ❌ | ❌ | `{1, 2, 3}` |
| `frozenset` | ❌ | ❌ | ❌ | `frozenset([1, 2])` |

**Memorize the table.** It answers 30% of MCQs by itself.

## Strings

Strings are **immutable** sequences of Unicode characters.

```python
s = "Hello, World"
len(s)              # 12
s[0]                # 'H'
s[-1]               # 'd' — negative indexing from the end
s[7:12]             # 'World' — slicing [start:end]
s[::-1]             # 'dlroW ,olleH' — reverse
s.upper()           # 'HELLO, WORLD' — returns NEW string, original unchanged
s.split(", ")       # ['Hello', 'World']
", ".join(["a", "b"])  # 'a, b'
"World" in s        # True
```

**Trap:** Strings are immutable. `s[0] = "h"` raises `TypeError`.

### String methods you must know

| Method | Returns |
|---|---|
| `s.lower()` / `s.upper()` | new string |
| `s.strip()` | new string with leading/trailing whitespace removed |
| `s.replace(a, b)` | new string |
| `s.split(sep)` | list of strings |
| `sep.join(iterable)` | new string |
| `s.find(sub)` | index of first match, or `-1` |
| `s.startswith(p)` / `s.endswith(p)` | bool |
| `s.isdigit()` / `s.isalpha()` / `s.isalnum()` | bool |

### f-strings

```python
name = "Rahul"
age = 23
f"{name} is {age} years old"     # 'Rahul is 23 years old'
f"{age + 1}"                      # '24'
f"{age:05d}"                      # '00023' — formatting
```

## Lists

Lists are **mutable, ordered** sequences. They allow duplicates.

```python
nums = [1, 2, 3]
nums.append(4)          # [1, 2, 3, 4]
nums.insert(0, 0)       # [0, 1, 2, 3, 4]
nums.pop()              # returns 4, list = [0, 1, 2, 3]
nums.pop(0)             # returns 0, list = [1, 2, 3]
nums.remove(2)          # removes first occurrence of value 2
nums + [99, 100]        # concatenation → new list
nums * 2                # repetition → new list
sorted(nums)            # returns new sorted list
nums.sort()             # sorts in-place, returns None
nums.reverse()          # in-place
len(nums)               # length
3 in nums               # membership
```

### List comprehensions

```python
squares = [x*x for x in range(5)]               # [0, 1, 4, 9, 16]
evens = [x for x in range(10) if x % 2 == 0]    # [0, 2, 4, 6, 8]
matrix = [[i*j for j in range(3)] for i in range(3)]
```

**Trap:** `[0] * 3` gives `[0, 0, 0]`, but `[[]] * 3` gives **three references to the same inner list**:

```python
a = [[]] * 3
a[0].append(1)
print(a)   # [[1], [1], [1]] — all changed!
```

Use a comprehension instead: `[[] for _ in range(3)]`.

## Tuples

**Immutable** lists. Used for fixed-size records and as dict keys.

```python
point = (3, 4)
x, y = point             # unpacking
point[0]                 # 3
len(point)               # 2

# Single-element tuple needs the comma:
not_a_tuple = (5)        # int 5
a_tuple = (5,)           # tuple with one int

# Tuples are hashable, lists are NOT:
d = {(1, 2): "ok"}       # valid
d = {[1, 2]: "no"}       # TypeError
```

## Dictionaries

Mutable **key→value** mappings. Keys must be hashable (immutable types). As of Python 3.7, iteration order is insertion order.

```python
d = {"a": 1, "b": 2}
d["c"] = 3                # add
d["a"]                    # 1 — KeyError if missing
d.get("z", 0)             # 0 — safe default
d.keys()                  # dict_keys(['a', 'b', 'c'])
d.values()                # dict_values([1, 2, 3])
d.items()                 # dict_items([('a', 1), ('b', 2), ('c', 3)])
"a" in d                  # True (checks KEYS, not values)
len(d)                    # 3
del d["a"]                # remove
d.pop("b")                # returns 2, removes
```

### Dict comprehension

```python
{x: x*x for x in range(5)}   # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

### Merging dicts

```python
a = {"x": 1, "y": 2}
b = {"y": 99, "z": 3}
{**a, **b}             # {'x': 1, 'y': 99, 'z': 3}  — b wins on conflict
a | b                  # same result (Python 3.9+)
```

## Sets

Unordered, unique, mutable.

```python
s = {1, 2, 3}
s.add(4)                  # {1, 2, 3, 4}
s.remove(2)               # KeyError if not present
s.discard(99)             # no error if not present
s | {5, 6}                # union
s & {2, 3}                # intersection
s - {3}                   # difference
s ^ {2, 5}                # symmetric difference
2 in s                    # membership — O(1)!

# Empty set is set(), NOT {} (that's a dict)
empty = set()
```

**Why sets matter:** membership check is O(1) average; for lists it's O(n). For "is this item in a collection of 10,000 things?" use a set, not a list.

## None

`None` is Python's null value. There is only **one** `None` in memory, so always compare with `is`:

```python
x = None
if x is None:           # ✅ correct
    pass
if x == None:           # ⚠️ works but linter warns
    pass
```

## Common MCQ traps

```python
# 1. Default argument mutability — biggest trap in interviews
def add(item, lst=[]):
    lst.append(item)
    return lst

print(add(1))   # [1]
print(add(2))   # [1, 2] — NOT [2]!
# Fix: use lst=None and create inside

# 2. Tuple of one
type(("hello"))    # str
type(("hello",))   # tuple

# 3. Integer caching (CPython implementation detail)
a = 256
b = 256
a is b             # True (small int cache)
c = 257
d = 257
c is d             # may be False — never rely on this; use ==

# 4. List slicing returns a NEW list
a = [1, 2, 3]
b = a[:]
b.append(4)
print(a)           # [1, 2, 3] — unaffected
```

## Practice

Take the **data-types quiz** to test yourself. Aim for >80% on the first try — these questions are 70% of TCS NQT's Python section.
