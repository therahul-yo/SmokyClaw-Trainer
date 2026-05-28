---
id: python-07-exceptions
title: Exceptions & try / except / else / finally
track: python
topic: exceptions
order: 7
estMinutes: 9
prerequisites: [python-01-syntax]
---

# Exceptions

Python uses exceptions for error signaling — there's no `error` return convention. Even `for x in iter` ends because `StopIteration` is raised.

## The full shape

```python
try:
    risky()
except (ValueError, KeyError) as e:
    print(f"expected: {e}")
except Exception as e:
    print(f"unexpected: {e}")
else:
    # runs ONLY if no exception was raised in try
    print("ok")
finally:
    # runs always — exception or not, return or not
    cleanup()
```

`else` is the part most people skip. It belongs anywhere you'd be tempted to put "the success path" *after* the try block — put it in `else` instead so cleanup logic in `finally` can tell which path you took.

## Catch what you can handle

```python
# Bad — swallows everything including KeyboardInterrupt and bugs
try:
    do_stuff()
except:
    pass

# Better
try:
    do_stuff()
except (FileNotFoundError, PermissionError) as e:
    log.warning("io: %s", e)
```

`except Exception` catches all user-raisable exceptions but lets `KeyboardInterrupt` and `SystemExit` through. Bare `except:` catches everything — almost always wrong.

## Raising

```python
raise ValueError("bad input: %r" % x)

# Re-raise while adding context
try:
    parse()
except ValueError as e:
    raise RuntimeError("config invalid") from e
```

`raise X from Y` sets `__cause__` so the traceback shows both — Python prints "The above exception was the direct cause…".

## Custom exceptions

```python
class ConfigError(Exception):
    """Raised when the configuration file is malformed."""

class MissingKey(ConfigError):
    pass
```

Inherit from `Exception`, not `BaseException` (which sits above `KeyboardInterrupt` etc.). Use class hierarchies so callers can catch broad or narrow.

## Common interview gotchas

1. **Catch specific exceptions first.** `except Exception` before `except ValueError` makes the second branch dead code.
2. **`finally` overrides return.** A `return` in `finally` replaces any earlier `return` — almost always a bug.
3. **`else` runs even after a `continue` / `break`?** No — `else` runs only when the `try` block exits normally without exception. A `return` inside `try` skips `else` but still runs `finally`.
4. **Exceptions are not free.** Don't use them for control flow in hot loops — `dict.get(k, default)` over `try: d[k] except KeyError`.
