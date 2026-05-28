---
id: dsa-11-stacks-queues
title: Stacks & queues — LIFO, FIFO, monotonic
track: dsa
topic: stack
order: 11
estMinutes: 10
prerequisites: [dsa-04-big-o]
pattern: stack
---

# Stacks & queues

Two of the simplest data structures, surprisingly powerful.

## Stack — LIFO

Use a plain Python `list`. `append` to push, `pop` to pop. Both `O(1)` amortized.

```python
stack = []
stack.append(1); stack.append(2); stack.append(3)
stack.pop()     # 3
stack[-1]       # 2 — peek
not stack       # False — empty check
```

### Pattern: balanced parens
```python
def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in "([{":
            stack.append(c)
        elif c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
    return not stack
```

### Pattern: evaluate RPN
```python
def eval_rpn(tokens):
    stack = []
    for t in tokens:
        if t in "+-*/":
            b = stack.pop(); a = stack.pop()
            if t == "+": stack.append(a + b)
            elif t == "-": stack.append(a - b)
            elif t == "*": stack.append(a * b)
            else: stack.append(int(a / b))    # truncate toward 0
        else:
            stack.append(int(t))
    return stack[0]
```

The general "evaluate / parse" shape: numbers push, operators pop their args.

## Queue — FIFO

Use `collections.deque`. `append` to enqueue, `popleft` to dequeue. Both `O(1)`.

```python
from collections import deque
q = deque()
q.append(1); q.append(2); q.append(3)
q.popleft()     # 1
q[0]            # 2 — front peek
```

**Never use `list.pop(0)` as a queue.** It's `O(n)` because of the shift.

`deque` also gives you `appendleft` and `pop` if you need a double-ended queue — useful for sliding window maximum and BFS variations.

## Monotonic stack — the one interviewers love

A stack where elements stay sorted. Pops elements that violate the order. Used for "next greater element," "largest rectangle in histogram," "daily temperatures."

```python
def daily_temperatures(temps):
    """For each day, how many days until a warmer day? 0 if none."""
    n = len(temps)
    answer = [0] * n
    stack = []                     # indices of days with not-yet-warmer
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer
```

**Why it's `O(n)` despite the inner `while`:** each index is pushed once and popped at most once. Total pops over the whole loop is at most `n`. Amortized `O(1)` per step.

## Stack ↔ queue conversions

Sometimes asked: "implement a queue using two stacks." Push to `in_stack`; for pop, if `out_stack` empty, dump all of `in_stack` into `out_stack`, then pop. Amortized `O(1)` per operation.

## When each shines

- **Stack:** undo, parse expressions, balanced things, monotonic problems, iterative DFS, function call simulation.
- **Queue:** BFS, level-order traversal, task scheduling, sliding-window-of-N.
- **Deque:** sliding window max/min (`O(n)`), palindrome check, work-stealing.

## Common bugs

- **`stack[-1]` on an empty stack** → `IndexError`. Check `if stack:` first.
- **Confusing index vs value** on a monotonic stack — usually you push *indices* so you can compute distances.
- **`list.pop(0)` as a queue.** Slow. Use `deque`.
- **Wrong order of pop in RPN.** First pop is `b` (the right operand), second is `a`.
