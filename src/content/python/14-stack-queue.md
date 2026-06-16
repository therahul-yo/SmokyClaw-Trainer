---
id: python-14-stack-queue
title: Stacks & queues in Python
track: python
topic: stack-queue
order: 14
estMinutes: 11
prerequisites: [python-02-data-types]
---

# Stacks & queues

A **stack** is last-in-first-out (LIFO); a **queue** is first-in-first-out
(FIFO). Both are workhorses for interview problems — matching brackets, undo,
BFS, sliding windows — and Python gives you the right tool for each so the
operations stay `O(1)`.

## Stack — just use a list

A Python `list` is a perfect stack: `append` pushes, `pop` removes the top, both
amortized `O(1)`:

```python
stack = []
stack.append(1)      # push
stack.append(2)
top = stack[-1]      # peek (2) without removing
x = stack.pop()      # pop -> 2
```

`pop()` with no index removes the **last** element. Checking emptiness is just
`if not stack:`.

**Classic use — balanced brackets:**

```python
def is_balanced(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
```

## Queue — use collections.deque

A `list` makes a *bad* queue: `list.pop(0)` is `O(n)` because every other element
shifts left. `collections.deque` gives `O(1)` at **both** ends:

```python
from collections import deque

q = deque()
q.append(1)          # enqueue at the right
q.append(2)
first = q.popleft()  # dequeue from the left -> 1
```

`deque` is also the standard structure for BFS, and as a double-ended queue it
backs sliding-window and "monotonic deque" problems.

## Don't reach for queue.Queue

`queue.Queue` exists but is built for **thread-safe** producer/consumer pipelines,
with locking overhead. For single-threaded algorithm work, `deque` is the right,
faster choice.

## A quick comparison

| Need | Use | Push/pop cost |
|---|---|---|
| Stack (LIFO) | `list` (`append`/`pop`) | `O(1)` amortized |
| Queue (FIFO) | `deque` (`append`/`popleft`) | `O(1)` both ends |
| Fixed-size recent window | `deque(maxlen=k)` | `O(1)`, auto-drops oldest |
| Thread-safe handoff | `queue.Queue` | locked, slower |

`deque(maxlen=k)` is a neat trick: appends past the limit silently discard the
opposite end — a ready-made sliding window of the last `k` items.

## Recognizing a stack/queue problem

- "Matching / nesting / most recent unmatched" → **stack** (brackets, undo, the
  monotonic-stack family like next-greater-element).
- "Process in arrival order", "level-by-level", "shortest path in an unweighted
  graph" → **queue / BFS** with `deque`.
- "Last k items", "sliding window of fixed size" → `deque(maxlen=k)`.

## Common bugs

- **`list.pop(0)` for a queue** — `O(n)` each call, turning an `O(n)` algorithm
  into `O(n²)`. Use `deque.popleft()`.
- **Popping an empty stack/queue** raises `IndexError` — guard with `if stack:`.
- **Confusing `pop()` (right) with `popleft()` (left)** on a deque — mixing them
  turns your queue into a stack.
- **Peeking with `stack[0]`** — the top of a list-stack is `stack[-1]`, not `[0]`.
