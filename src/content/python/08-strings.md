---
id: python-08-strings
title: Strings — formatting & common operations
track: python
topic: strings
order: 8
estMinutes: 9
prerequisites: [python-02-data-types]
---

# Strings

Strings are immutable sequences of Unicode characters. The methods you actually use in interviews:

## Splitting and joining

```python
"a,b,c".split(",")          # ['a', 'b', 'c']
"hello world".split()       # ['hello', 'world'] — whitespace + collapses runs
",".join(["a", "b", "c"])   # 'a,b,c'
```

Never build a string by `+=` in a loop — each step copies. Build a list and `join` at the end.

```python
# Bad — O(n^2)
out = ""
for s in parts:
    out += s

# Good — O(n)
out = "".join(parts)
```

## Stripping and case

```python
"  hi  ".strip()        # 'hi'
"abc.txt".rstrip(".txt")# 'a'  ← NOT 'abc'! .rstrip removes any chars in the set
"abc.txt".removesuffix(".txt")  # 'abc' (3.9+)
"Hello".lower()         # 'hello'
"hello".title()         # 'Hello'
```

`strip("chars")` removes any of those characters from the ends — it does NOT remove an exact substring. `removeprefix` / `removesuffix` do.

## Searching

```python
"hello".find("ll")      # 2
"hello".find("xx")      # -1
"hello".index("xx")     # raises ValueError
"hello".count("l")      # 2
"l" in "hello"          # True
```

`in` is the most pythonic substring check.

## Formatting — f-strings

```python
name, age = "Alice", 30
f"{name} is {age}"              # 'Alice is 30'
f"{age:>5}"                     # '   30' — right-align, width 5
f"{3.14159:.2f}"                # '3.14'
f"{255:#x}"                     # '0xff'
f"{name=}"                      # "name='Alice'" — debug form, 3.8+
```

f-strings are the standard. Avoid `%`-formatting; avoid `.format()` for new code.

## Slicing tricks

```python
s = "abcdef"
s[::-1]            # 'fedcba'  — reverse
s[1:4]             # 'bcd'
s[::2]             # 'ace'
```

## Comparing two strings as anagrams

```python
sorted("listen") == sorted("silent")   # True
# Or use Counter for O(n)
from collections import Counter
Counter("listen") == Counter("silent")
```

## Unicode

Python 3 strings are Unicode by default. Length is in code points, not bytes:

```python
len("é")            # 1 — one code point
len("é".encode())   # 2 — two UTF-8 bytes
```

For interview questions on ASCII text this rarely matters, but know `s.encode()` gives `bytes` and `b.decode()` gives `str`.
