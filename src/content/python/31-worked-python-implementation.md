---
id: python-31-worked-implementation
title: Worked examples: Python implementation fluency
track: python
topic: worked-examples
order: 31
estMinutes: 34
prerequisites: [python-00-foundations, python-30-interview-machine]
pattern: python-implementation
---

# Worked examples: Python implementation fluency

Python interview strength is the ability to convert an idea into clean code
without fighting syntax or containers.

This lesson trains the implementation loop:

```text
choose container -> define state -> write loop -> test edge cases -> explain cost
```

## Example 1: Group anagrams

Problem:

```text
Given a list of words, group anagrams together.
```

### Input parser

```text
words: list[str]
output: list of groups
```

### Pattern classifier

Anagrams have the same character multiset. Need a key that is identical for
anagrams.

### State builder

```text
groups[key] = list of words with that key
key = sorted characters as tuple/string
```

### Solution

```python
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for word in words:
        key = "".join(sorted(word))
        groups[key].append(word)
    return list(groups.values())
```

### Complexity

If `n` is number of words and `k` is max word length, sorting each word costs
`O(k log k)`, so total time is `O(n * k log k)`.

### Mistake rule

The key must be immutable and equal for equivalent words. A list of characters
cannot be a dict key; a string or tuple can.

## Example 2: Flatten a nested list one level

Problem:

```text
Given [[1,2], [3], [], [4,5]], return [1,2,3,4,5].
```

### State

```text
out: final flat list
```

### Solution

```python
def flatten_one_level(groups):
    out = []
    for group in groups:
        for x in group:
            out.append(x)
    return out
```

### Pythonic version

```python
def flatten_one_level(groups):
    return [x for group in groups for x in group]
```

### Mistake rule

Nested comprehensions read in the same order as nested loops:

```python
for group in groups:
    for x in group:
```

If that order is confusing, write the loop first.

## Example 3: Safe dictionary transform

Problem:

```text
Given records with department and salary, return average salary per department.
```

### State builder

Need both total and count.

```text
totals[dept] = salary sum
counts[dept] = number of employees
```

### Solution

```python
def average_salary(records):
    totals = {}
    counts = {}

    for row in records:
        dept = row["department"]
        salary = row["salary"]
        totals[dept] = totals.get(dept, 0) + salary
        counts[dept] = counts.get(dept, 0) + 1

    return {
        dept: totals[dept] / counts[dept]
        for dept in totals
    }
```

### Mistake rule

Average means total divided by count. Do not average averages unless group sizes
are equal.

## Example 4: Queue simulation

Problem:

```text
Process push, pop, and peek operations on a queue.
```

### Pattern classifier

Queue requires fast removal from the front.

Use `deque`, not list.

### Solution

```python
from collections import deque

def queue_outputs(ops):
    q = deque()
    out = []

    for op in ops:
        if op.startswith("push:"):
            q.append(int(op.split(":")[1]))
        elif op == "pop":
            if q:
                q.popleft()
        elif op == "peek":
            out.append(q[0] if q else None)

    return out
```

### Complexity

Each operation is `O(1)` average. Using `list.pop(0)` would shift elements and
can become `O(n^2)` across many operations.

## Example 5: Sort with multiple rules

Problem:

```text
Sort students by score descending, then name ascending.
```

### Solution

```python
def rank_students(students):
    ordered = sorted(students, key=lambda row: (-row["score"], row["name"]))
    return [row["name"] for row in ordered]
```

### Dry run

```text
{"name": "Dan", "score": 90} -> key (-90, "Dan")
{"name": "Ana", "score": 90} -> key (-90, "Ana")
{"name": "Bob", "score": 80} -> key (-80, "Bob")
```

Smaller tuple comes first, so Ana comes before Dan when scores tie.

## Python machine checklist

Before submitting:

```text
Did I choose the right container?
Did I initialize state safely for empty/negative input?
Did I mutate only what I intend to mutate?
Did I return the exact required type?
Did I count hidden costs like sorting, pop(0), and nested membership?
```

If the answer is yes, the implementation is becoming mechanical.
