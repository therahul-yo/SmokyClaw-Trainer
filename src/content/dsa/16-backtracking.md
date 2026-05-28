---
id: dsa-16-backtracking
title: Backtracking — try, recurse, undo
track: dsa
topic: backtracking
order: 16
estMinutes: 10
prerequisites: [dsa-08-recursion]
pattern: backtracking
---

# Backtracking

Brute-force exploration with pruning. For each decision, **try** each option, **recurse**, then **undo**. Use it for permutations, subsets, combinations, N-queens, sudoku, word search.

## The template

```python
def backtrack(state, choices):
    if is_solution(state):
        record(state)
        return
    for choice in choices:
        if not is_valid(state, choice):
            continue                # prune
        apply(state, choice)        # try
        backtrack(state, next_choices(choices, choice))
        undo(state, choice)         # undo — CRUCIAL
```

Symmetric: every `apply` has a matching `undo`. Forget the undo, and sibling branches inherit your dirty state.

## Permutations

```python
def permutations(nums):
    out = []
    n = len(nums)
    used = [False] * n
    path = []

    def go():
        if len(path) == n:
            out.append(path[:])              # snapshot — append a copy
            return
        for i in range(n):
            if used[i]: continue
            used[i] = True
            path.append(nums[i])
            go()
            path.pop()                       # undo
            used[i] = False                  # undo
    go()
    return out
```

`out.append(path[:])` — without the slice, every entry would be the same (constantly mutated) list reference.

## Subsets

```python
def subsets(nums):
    out = []
    path = []
    def go(i):
        if i == len(nums):
            out.append(path[:])
            return
        # exclude nums[i]
        go(i + 1)
        # include nums[i]
        path.append(nums[i])
        go(i + 1)
        path.pop()
    go(0)
    return out
```

Each element: include or exclude. Two recursive branches, `2^n` total subsets.

## Combinations — "choose k of n"

```python
def combinations(n, k):
    out = []
    path = []
    def go(start):
        if len(path) == k:
            out.append(path[:])
            return
        for x in range(start, n + 1):
            path.append(x)
            go(x + 1)                        # x + 1 to avoid duplicates
            path.pop()
    go(1)
    return out
```

The `start` parameter enforces "later choices must be larger than earlier ones," which de-duplicates `{1,2,3}` and `{3,2,1}`.

## N-Queens

```python
def n_queens(n):
    out = []
    cols, diag1, diag2 = set(), set(), set()
    placement = []

    def go(r):
        if r == n:
            out.append(placement[:])
            return
        for c in range(n):
            if c in cols or (r - c) in diag1 or (r + c) in diag2:
                continue
            cols.add(c); diag1.add(r - c); diag2.add(r + c)
            placement.append(c)
            go(r + 1)
            placement.pop()
            cols.remove(c); diag1.remove(r - c); diag2.remove(r + c)
    go(0)
    return out
```

Three sets give `O(1)` conflict checking. The diagonals: `r - c` is constant along one diagonal direction, `r + c` along the other.

## Complexity

Pure brute force = `O(branches^depth)`. Worst case is huge, but **pruning** (skipping invalid branches early) brings most practical problems to acceptable times.

- Permutations: `O(n!)`.
- Subsets: `O(2^n)`.
- N-Queens (`n=8`): tens of thousands of nodes — instant after pruning.

## When backtracking is the right tool

- The problem says "enumerate all ...", "find all paths," "find one solution among many constraints."
- The search space is finite but combinatorial.
- You can prune — a partial solution can be ruled out before completing it.

## When it isn't

- The problem has overlapping subproblems → use DP instead. Backtracking re-explores; DP memoizes.
- The space is too large to enumerate (`n` items, `n = 30`+) and you need an exact answer — backtracking might not finish.

## Common bugs

- **Forgetting to undo.** Sibling branches inherit dirty state; results corrupted.
- **Appending the path without copying.** All saved paths point to the same mutating list.
- **Pruning too aggressively** and missing valid answers. When unsure, drop the prune and verify correctness first.
- **Re-recursing on already-visited choices.** Use a `used[]` flag or `start` index discipline to enforce no-revisit.
