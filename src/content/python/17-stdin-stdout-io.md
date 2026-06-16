---
id: python-17-stdin-stdout
title: Reading input — stdin/stdout for coding tests
track: python
topic: coding-io
order: 17
estMinutes: 11
prerequisites: [python-08-strings]
---

# stdin/stdout for coding tests

Many online assessments (TCS NQT, Infosys, HackerRank-style judges) don't hand you
a function to fill in — they pipe the input through **standard input** and read
your answer from **standard output**. Getting this plumbing right is half the
battle; the algorithm is the other half.

## The fundamentals

```python
import sys

line = input()              # one line, newline stripped, as a str
n = int(input())            # a single integer on its own line
a, b = map(int, input().split())   # two space-separated ints on one line
nums = list(map(int, input().split()))   # a whole line of ints -> list
```

`input()` reads one line and drops the trailing newline. `split()` with no
argument splits on **any** run of whitespace and ignores leading/trailing spaces —
exactly what you want for tokenized input. Use `print(...)` to emit your answer;
it adds a newline by default.

## The standard pattern: count, then loop

A very common format is "first line = how many items, then that many lines":

```python
n = int(input())
total = 0
for _ in range(n):
    total += int(input())
print(total)
```

For a known fixed shape, read exactly what you need — don't over-read or you'll
block waiting for input that never comes.

## Reading everything at once (fast & flexible)

When the count is unknown or input is large, slurp it all and tokenize:

```python
import sys

data = sys.stdin.read().split()    # every whitespace-separated token, flat
it = iter(data)
n = int(next(it))
nums = [int(next(it)) for _ in range(n)]
```

`sys.stdin.read()` is dramatically faster than many `input()` calls for big inputs
(thousands of lines), because it avoids per-line overhead. Pulling tokens from an
iterator lets you consume the flat stream in whatever shape the problem describes.

## Multiple test cases

```python
t = int(input())            # number of test cases
for _ in range(t):
    n = int(input())
    arr = list(map(int, input().split()))
    print(max(arr))
```

Read the case count first, then the per-case lines inside the loop. Print one
answer per case (usually one per line).

## Formatting output

```python
print(a, b, c)              # space-separated: "a b c"
print(*nums)                # unpack a list -> space-separated values
print(f"{ratio:.2f}")       # 2 decimal places
print("YES" if ok else "NO")
```

Match the **exact** expected format — judges compare output literally. A stray
space, wrong case ("Yes" vs "YES"), or extra blank line fails the test even when
your logic is right.

## Recognizing this format

- The prompt shows "Input:" and "Output:" blocks rather than a function signature.
- "The first line contains an integer N..." → read a count, then loop.
- Sample I/O uses spaces/newlines, not Python literals.

## Common bugs

- **Forgetting `int()`** — `input()` returns a `str`; `'5' + 1` raises `TypeError`,
  and `'5' < '10'` compares lexicographically (wrong for numbers).
- **`input()` keeps no newline, but extra prints add them** — an unexpected blank
  line at the end can fail a strict judge.
- **Reading the wrong number of lines** — over-reading blocks forever; under-reading
  leaves tokens that desync later reads.
- **Output format mismatches** — wrong separator, case, or precision. Print exactly
  what the spec shows.
- **Slow I/O on big inputs** — replace a hot loop of `input()` calls with one
  `sys.stdin.read()`.
