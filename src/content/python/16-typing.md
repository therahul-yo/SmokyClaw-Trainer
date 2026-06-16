---
id: python-16-typing
title: Type hints & virtual environments
track: python
topic: typing
order: 16
estMinutes: 13
prerequisites: [python-06-functions]
---

# Type hints & virtual environments

Two things every professional Python codebase relies on but tutorials often skip:
**type hints** (annotations that document and statically check your code) and
**virtual environments** (isolated, reproducible dependency sets). Interviewers
increasingly ask about both.

## Type hints are annotations, not enforcement

Hints describe expected types. The interpreter does **not** check them at runtime —
they're consumed by tools (mypy, pyright, your IDE) and stored in `__annotations__`:

```python
def greet(name: str, times: int = 1) -> str:
    return (name + " ") * times

greet(123, "x")     # runs without error — hints aren't enforced at runtime
```

That last call is wrong by the hints but Python won't complain; a type checker
would. Hints buy you earlier error detection, better autocomplete, and living
documentation — for free at runtime.

## The vocabulary

```python
from typing import Optional, Union, Any

x: int = 5
names: list[str] = []              # builtin generics (3.9+) — no import needed
scores: dict[str, int] = {}
maybe: Optional[int] = None        # == Union[int, None]; may be int or None
either: Union[int, str] = 0        # int OR str  (also written int | str in 3.10+)
whatever: Any = ...                # opts OUT of type checking for this value
```

- `Optional[T]` is exactly `Union[T, None]` — a nullable value.
- `list[int]`, `dict[str, int]` etc. work as builtins since Python 3.9 (PEP 585);
  the old `typing.List[int]` still works but isn't needed.
- `Any` disables checking (assignable both to and from anything); `object` accepts
  any value but lets you do almost nothing without narrowing first.

## Generics with TypeVar

A `TypeVar` ties types together so the checker can preserve them:

```python
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:    # return type follows the element type
    return items[0]
```

`first([1, 2])` is typed `int`; `first(["a"])` is typed `str`.

## Virtual environments — isolation per project

A virtualenv is a private copy of the interpreter and `site-packages`, so each
project pins its own dependency versions without polluting the system Python:

```bash
python -m venv .venv          # create it
source .venv/bin/activate     # activate (Windows: .venv\Scripts\activate)
pip install requests          # installs INTO .venv only
pip freeze > requirements.txt # record exact versions
deactivate                    # leave the environment
```

Why it matters: two projects can need incompatible versions of the same library;
without isolation, installing one breaks the other. `requirements.txt` (or a
`pyproject.toml`/lockfile) makes the environment reproducible on another machine.

## Recognizing where these matter

- A function's contract is non-obvious, or it's a library API others call → **add
  hints** so callers and checkers know the shapes.
- "Why does my code pass locally but fail in CI / on a teammate's machine?" →
  almost always a **dependency/environment** mismatch — pin versions in a venv.
- A value can legitimately be missing → `Optional[T]`, and handle the `None`.

## Common pitfalls

- **Expecting runtime enforcement.** Hints don't validate inputs; if you need
  runtime checks, write them (or use a library like pydantic).
- **`Optional` ≠ "has a default".** `Optional[int]` means "may be None"; it says
  nothing about default values.
- **Installing without an active venv** dumps packages into the global Python —
  the source of version conflicts. Activate first; check with `which python`.
- **Committing `.venv/`** to git — don't; commit `requirements.txt` instead and
  add `.venv/` to `.gitignore`.
- **Mutable types in annotations don't change behavior** — `list[int]` is a hint,
  not a constructor; you still create the list yourself.
