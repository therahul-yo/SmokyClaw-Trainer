---
id: python-06-functions
title: Functions, args & lambdas
track: python
topic: functions
order: 6
estMinutes: 10
prerequisites: [python-01-syntax]
---

# Functions, args & lambdas

Functions are first-class objects in Python — you can pass them, return them, store them. That single fact powers decorators, callbacks, and most of the functional patterns.

## Parameter kinds

```python
def f(pos1, pos2, /, both, *, kw1, kw2):
    ...
```

- `pos1, pos2` before `/` — positional-only.
- `both` — can be passed positionally or by keyword.
- `kw1, kw2` after `*` — keyword-only.

You won't write `/` often, but reading docs that use it is the goal here.

## `*args` and `**kwargs`

```python
def log(*args, **kwargs):
    print("args:", args)        # tuple of positional args
    print("kwargs:", kwargs)    # dict of keyword args

log(1, 2, name="Alice")
# args: (1, 2)
# kwargs: {'name': 'Alice'}
```

Use this for forwarding to another function:

```python
def trace(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper
```

## Default arguments — careful with mutables

See the [Mutability lesson](#) — `def f(x=[])` shares the same list across every call. Use `None` and check inside.

## Lambdas

A `lambda` is just an inline function with one expression. No statements, no annotations.

```python
double = lambda x: x * 2
sorted(words, key=lambda w: (len(w), w))
```

Don't assign a lambda to a name — if it needs a name, write `def`. Use lambdas only as inline arguments.

## Closures

A function defined inside another function remembers the enclosing variables:

```python
def counter():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    return inc

c = counter()
c(); c(); c()   # 1, 2, 3
```

Without `nonlocal`, an assignment inside `inc` would create a new local `n`, not touch the outer one. This is the trap behind most closure interview questions.

## Returning multiple values

```python
def divmod_(a, b):
    return a // b, a % b

q, r = divmod_(17, 5)
```

The return is a tuple — Python just doesn't make you write the parentheses.

## Function annotations

```python
def add(x: int, y: int = 0) -> int:
    return x + y
```

Annotations are accessible at runtime via `__annotations__`, used by type checkers (mypy, Pyright) and frameworks (FastAPI, Pydantic). They're optional and not enforced at runtime by Python itself.
