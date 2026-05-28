---
id: python-15-oop
title: OOP — classes, dunder methods, dataclasses
track: python
topic: oop
order: 15
estMinutes: 12
prerequisites: [python-06-functions]
pattern: python-oop
---

# OOP in Python

Python's OOP is duck-typed and intentionally lighter than Java/C++ — but it has its own machinery worth knowing for interviews.

## Classes 101

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

    def distance_to(self, other):
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5

p = Point(1, 2)
p.distance_to(Point(4, 6))   # 5.0
```

`self` is just convention — it's the first parameter to instance methods, the instance itself.

## The dunder methods that earn their keep

| Method | What it controls |
|---|---|
| `__init__(self, ...)` | Constructor (called after `__new__`). |
| `__repr__(self)` | Unambiguous string — what you see in the REPL. |
| `__str__(self)` | Human-readable string. Falls back to `__repr__`. |
| `__eq__(self, other)` | `==` behavior. Define alongside `__hash__`. |
| `__hash__(self)` | Makes the object usable as a dict key / set member. |
| `__lt__(self, other)` | `<` for sorting (plus `__le__`, `__gt__`, `__ge__`, or `@total_ordering`). |
| `__len__(self)` | `len(obj)`. |
| `__iter__(self)` / `__next__(self)` | Custom iteration. |
| `__getitem__(self, key)` | `obj[key]`. With `__len__`, also makes it iterable. |
| `__enter__` / `__exit__` | Context manager (`with obj:`). |
| `__call__(self, ...)` | Makes the instance callable like a function. |

## Inheritance & MRO

```python
class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "woof"

class GuideDog(Dog):
    def speak(self):
        return super().speak() + "!"
```

`super().speak()` follows the **Method Resolution Order** — for multiple inheritance, MRO is computed by C3 linearization. `Dog.__mro__` shows the order Python checks attributes.

Prefer composition over inheritance. Use inheritance for genuine "is-a" relationships, not for reuse.

## Dataclasses

The boilerplate-killer. Auto-generates `__init__`, `__repr__`, `__eq__`:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
p.x                 # 1.0
p == Point(1, 2)    # True
hash(p)             # works because frozen=True makes it hashable
```

`frozen=True` makes the instance immutable. Always use it unless you genuinely need to mutate.

## Class vs instance attributes (classic trap)

```python
class Bag:
    items = []          # SHARED across all instances!

a, b = Bag(), Bag()
a.items.append("x")
b.items             # ['x']   ← surprise
```

Class-level mutables are shared. For per-instance defaults, set them in `__init__`:

```python
class Bag:
    def __init__(self):
        self.items = []
```

## Properties

```python
class Celsius:
    def __init__(self, t):
        self._t = t

    @property
    def fahrenheit(self):
        return self._t * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self._t = (value - 32) * 5 / 9

c = Celsius(0)
c.fahrenheit        # 32.0  — accessed like an attribute
c.fahrenheit = 212  # setter runs; c._t is now 100.0
```

Use properties when an attribute needs validation, lazy computation, or a backing field — but don't reach for them when a plain attribute will do.

## What interviewers ask

1. **Implement `__eq__` and `__hash__`** so an object works as a dict key.
2. **Difference between `@classmethod` and `@staticmethod`.** `classmethod` gets `cls`; `staticmethod` gets nothing — it's just a function in the class namespace.
3. **What does `super().__init__()` do?** Chains to the parent class's initializer, respecting MRO.
4. **What's a metaclass?** A class whose instances are classes. `type` is the default. You almost never need to write one — knowing it exists is enough.
