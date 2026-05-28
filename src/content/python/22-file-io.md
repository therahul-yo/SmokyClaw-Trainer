---
id: python-22-file-io
title: File I/O & context managers
track: python
topic: file-io
order: 22
estMinutes: 8
prerequisites: [python-07-exceptions]
---

# Files & context managers

## Reading and writing files

```python
# Read whole file
with open("data.txt") as f:
    content = f.read()

# Read line by line — memory friendly for large files
with open("data.txt") as f:
    for line in f:
        process(line.rstrip("\n"))

# Write
with open("out.txt", "w") as f:
    f.write("hello\n")
```

`with open(...) as f:` is the right way — `f.close()` runs automatically even if your code raises. Never write `f = open(...)` followed by `f.close()` at the end of a function.

## File modes

| Mode | Meaning |
|---|---|
| `"r"` | Read text (default). |
| `"w"` | Write — truncates the file first. |
| `"a"` | Append. |
| `"x"` | Exclusive — fails if file exists. |
| `"b"` | Add `b` for binary (`"rb"`, `"wb"`). |
| `"+"` | Add `+` for read+write (`"r+"`). |

Always pass `encoding="utf-8"` for text files — relying on the platform default bites you cross-platform.

## CSV — use the stdlib `csv` module

```python
import csv

with open("data.csv") as f:
    for row in csv.DictReader(f):
        print(row["name"], row["age"])

with open("out.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "age"])
    writer.writeheader()
    writer.writerow({"name": "Alice", "age": 30})
```

Don't `.split(",")` CSVs — quoting and escaping bite you.

## JSON

```python
import json

# Load from string / file
data = json.loads(s)
with open("x.json") as f:
    data = json.load(f)

# Dump
s = json.dumps(data, indent=2)
with open("x.json", "w") as f:
    json.dump(data, f)
```

`json.loads` parses a string; `json.load` parses a file-like. Same pattern for `dumps` / `dump`.

## `pathlib` — modern paths

```python
from pathlib import Path

p = Path("data") / "file.txt"     # OS-agnostic separator
p.exists()
p.read_text(encoding="utf-8")
p.write_text("hi\n")
list(Path(".").glob("**/*.py"))
```

Prefer `pathlib.Path` over `os.path` joins in new code.

## Custom context managers

If you find yourself writing matching setup/teardown, build a context manager:

```python
from contextlib import contextmanager

@contextmanager
def timer():
    t = time.perf_counter()
    try:
        yield
    finally:
        print(f"took {time.perf_counter() - t:.3f}s")

with timer():
    heavy_work()
```

Class-based form, if you need attributes:

```python
class Timer:
    def __enter__(self):
        self.t = time.perf_counter()
        return self
    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.t
        # return True here to suppress exceptions; usually return None
```

## Multiple files in one `with`

```python
with open("a") as fa, open("b") as fb:
    ...
```

Cleaner than nesting two `with` blocks.
