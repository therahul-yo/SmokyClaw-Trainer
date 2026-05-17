---
id: python-control-flow
title: Control Flow & Loops
track: python
topic: control-flow
order: 3
estMinutes: 10
prerequisites: [python-data-types]
---

# Control Flow & Loops

Pseudocode questions on Infosys and DSA loop traces on TCS NQT both come down to: *can you walk through control flow without panicking?* This lesson is the playbook.

## `if` / `elif` / `else`

```python
x = 7
if x > 10:
    print("big")
elif x > 5:
    print("medium")
else:
    print("small")
```

- `elif` is `else if` smashed together. As many as you want.
- `else` is optional.
- No parentheses needed around the condition.
- Colon `:` ends the header. Indent the body.

### Ternary

```python
status = "adult" if age >= 18 else "minor"
```

## `for` loops

Python's `for` iterates over a sequence, not a counter.

```python
for x in [1, 2, 3]:
    print(x)

for ch in "hello":
    print(ch)

for i in range(5):           # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 8):        # 2, 3, 4, 5, 6, 7
    print(i)

for i in range(0, 10, 2):    # 0, 2, 4, 6, 8 — step
    print(i)

for i in range(10, 0, -1):   # 10, 9, ..., 1 — countdown
    print(i)
```

### Iterating with index

```python
for i, ch in enumerate("hello"):
    print(i, ch)
# 0 h
# 1 e
# 2 l
# 3 l
# 4 o
```

### Iterating two lists in parallel

```python
names = ["a", "b", "c"]
ages = [10, 20, 30]
for name, age in zip(names, ages):
    print(name, age)
```

`zip` stops at the shortest. To pad, use `itertools.zip_longest`.

### Iterating a dict

```python
d = {"a": 1, "b": 2}
for k in d:              # keys
    print(k)
for v in d.values():
    print(v)
for k, v in d.items():
    print(k, v)
```

## `while` loops

```python
n = 0
while n < 5:
    print(n)
    n += 1
```

## `break` and `continue`

```python
for i in range(10):
    if i == 3:
        continue        # skip this iteration
    if i == 7:
        break           # exit the loop entirely
    print(i)
# Output: 0 1 2 4 5 6
```

## `for ... else` — the trap

Python has a loop `else` clause. It runs **only if the loop completes without hitting `break`**.

```python
for i in range(5):
    if i == 99:
        break
else:
    print("loop finished normally")     # this runs

for i in range(5):
    if i == 2:
        break
else:
    print("won't run")                  # this does NOT run
```

This pattern is rare in real code but **absolutely shows up** in MCQ tests.

## `pass`

`pass` does nothing — it's a placeholder when syntactically a statement is required:

```python
def todo():
    pass     # function body can't be empty

if x > 0:
    pass     # placeholder
else:
    print("no")
```

## `match` (Python 3.10+, less common in service-company tests)

```python
match status:
    case 200:
        print("OK")
    case 404 | 410:
        print("not found")
    case _:
        print("other")
```

Treat this as "switch" with pattern matching. TCS/Infosys MCQs rarely test this — it's still relatively new.

## Trap: mutating a list while iterating

```python
nums = [1, 2, 3, 4, 5]
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)       # [1, 3, 5] — looks right but it skipped elements
```

This is a classic pitfall: when you remove element 2, the list shifts, so the iterator skips element 3. **Always iterate over a copy** if you're going to mutate:

```python
for n in nums[:]:        # iterate over a slice copy
    if n % 2 == 0:
        nums.remove(n)
```

Or build a new list:

```python
nums = [n for n in nums if n % 2 != 0]
```

## Practice

Coding drills for this lesson focus on **predicting loop output** — the exact skill TCS NQT tests in its programming logic section. Practice these until you can trace 10-line loops in under 60 seconds.
