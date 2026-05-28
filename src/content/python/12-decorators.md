---
id: python-12-decorators
title: Decorators & closures
track: python
topic: decorators
order: 12
estMinutes: 12
prerequisites: [python-06-functions, python-10-generators]
pattern: python-decorators
---

# Decorators

A decorator is a function that takes a function and returns a function. The `@dec` syntax is just sugar:

```python
@dec
def f():
    ...

# is exactly:

def f():
    ...
f = dec(f)
```

That's the whole concept. The rest is craft.

## The simplest useful decorator

```python
import time
from functools import wraps

def timed(fn):
    @wraps(fn)                          # preserves fn.__name__, __doc__
    def wrapper(*args, **kwargs):
        t = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__}: {time.perf_counter() - t:.3f}s")
        return result
    return wrapper

@timed
def heavy():
    sum(range(10_000_000))

heavy()
```

`@wraps(fn)` is non-negotiable — without it, `wrapper.__name__` becomes `"wrapper"` and stack traces lose information.

## Decorators that take arguments

You need one more layer:

```python
def retry(times):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if i == times - 1:
                        raise
        return wrapper
    return decorator

@retry(times=3)
def fetch():
    ...
```

Think of it as: `fetch = retry(times=3)(fetch)`.

## Stacking decorators

```python
@cache
@timed
def fib(n):
    ...
```

Applied bottom-up: `fib = cache(timed(fib))`. The outermost (`@cache`) runs first when you call `fib()`.

## Stdlib decorators worth knowing

| Decorator | Use |
|---|---|
| `@functools.cache` | Memoize a function. Unlimited size — use `@lru_cache(maxsize=128)` to bound it. |
| `@functools.lru_cache(maxsize=128)` | LRU-bounded memoization. |
| `@classmethod` | First arg is the class, not the instance. Useful for alternate constructors. |
| `@staticmethod` | Plain function inside a class namespace. |
| `@property` | Turns a method into an attribute access (`obj.foo` calls the method). |
| `@dataclass` | Auto-generates `__init__`, `__repr__`, `__eq__` from class fields. |

## Class-based decorators

If your decorator needs state, a class with `__call__` is often cleaner than nested functions:

```python
class CountCalls:
    def __init__(self, fn):
        self.fn = fn
        self.count = 0
    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.fn(*args, **kwargs)

@CountCalls
def greet():
    print("hi")

greet(); greet()
print(greet.count)   # 2
```

## What interviewers ask

1. **Write a decorator that times a function.** (The example above.)
2. **Write a decorator that caches return values.** Show you can use a dict keyed on `args` — and the limitation: kwargs are unhashable until you `frozenset(kwargs.items())`.
3. **Why `@wraps`?** Preserves metadata for debugging and introspection.
4. **What does `@dec` do at definition time?** Calls `dec(f)` *immediately* when the `def` is executed — not when `f` is called.
