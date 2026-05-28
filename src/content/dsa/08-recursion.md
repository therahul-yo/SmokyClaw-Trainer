---
id: dsa-08-recursion
title: Recursion — base case, recursive case, trust
track: dsa
topic: recursion
order: 8
estMinutes: 10
prerequisites: [dsa-04-big-o]
pattern: recursion
---

# Recursion

A function that calls itself. Three ingredients:

1. **Base case** — when do you stop?
2. **Recursive case** — solve a smaller version, combine.
3. **Trust** — assume the recursive call works. Don't trace it in your head past one level.

## The shape

```python
def factorial(n):
    if n <= 1:                     # base case
        return 1
    return n * factorial(n - 1)    # recursive case
```

`factorial(5)` → `5 * factorial(4)` → `5 * 4 * factorial(3)` → ... → `5 * 4 * 3 * 2 * 1 = 120`.

**The trust move:** when you write `factorial(n - 1)`, don't unroll it. Assume it returns the factorial of `n - 1`. Then `n * that` is correct by definition.

## Recursion = the call stack

Every call pushes a frame. The frames unwind in reverse. This is why deep recursion blows the stack — Python's default limit is 1000. For `factorial(2000)`, you'd hit `RecursionError`. Either rewrite iteratively or `sys.setrecursionlimit(10000)`.

## Classic example: fib (with and without memo)

```python
def fib_slow(n):                   # O(2^n) — recomputes the same subproblems
    if n < 2: return n
    return fib_slow(n - 1) + fib_slow(n - 2)

from functools import cache

@cache
def fib(n):                        # O(n) — memoized
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)
```

`@cache` is the bridge from "naive recursion" to "top-down DP." Recognize a recursive function with overlapping subproblems → slap `@cache` on it → you've implemented memoized DP.

## When recursion shines

- **Tree problems** — left subtree + right subtree + me.
- **Divide & conquer** — mergesort, quicksort, binary search recursively.
- **Backtracking** — try, recurse, undo (see the backtracking lesson).
- **Anything you can describe as "solve smaller version, combine."**

## When it doesn't

- **Deep linear recursion** without divide-and-conquer (e.g., walking a 10⁶-node linked list) — stack overflow. Use a loop.
- **No clear smaller subproblem** — sliding window, two pointers, sorting-and-walking are better.

## Tail recursion

Some languages optimize "the last thing the function does is call itself" into a loop. **Python does not.** Don't rely on tail-call optimization in Python — rewrite tail recursion as a loop.

## Helper-with-extra-args pattern

When the natural recursion signature loses state, wrap it:

```python
def has_path_sum(root, target):
    def go(node, remaining):
        if not node:
            return False
        if not node.left and not node.right:
            return remaining == node.val
        return go(node.left, remaining - node.val) or go(node.right, remaining - node.val)
    return go(root, target)
```

The outer function presents the clean API; the inner does the recursion with whatever state it needs.

## Building intuition

For any recursive solution, ask three questions:

1. **What does this function return?** Write it as a contract: *"Given subtree rooted at node, returns the max depth."* If you can't state it, you don't have a solution yet.
2. **What's the base case?** Often "empty input → identity value" — 0 for sum, 1 for product, [] for collection, True for "all," False for "any."
3. **What do I do with the recursive result(s)?** Combine them. Often: take max, take min, sum, or pick the better.

Once you've written the contract, the body usually writes itself.

## Pitfalls

- **Missing base case.** Infinite recursion → stack overflow.
- **Base case in the wrong place.** Usually check at the *start* of the function, before any work.
- **Modifying shared state across recursive calls** without undoing — see the backtracking lesson.
- **Returning `None` instead of a value** in some branches → mysterious `TypeError`. Make sure every branch returns.
