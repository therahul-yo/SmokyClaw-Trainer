---
id: dsa-21-worked-trees-graphs-dp
title: Worked examples: trees, graphs, and DP
track: dsa
topic: worked-examples
order: 24
estMinutes: 42
prerequisites: [dsa-18-pattern-recognition-machine]
pattern: advanced-patterns
---

# Worked examples: trees, graphs, and DP

Advanced DSA feels hard because the state is less obvious. The trick is to name
the unit of work:

```text
Tree: what does one recursive call return?
Graph: what does one node/state represent?
DP: what subproblem am I solving?
```

## Example 1: Maximum depth of binary tree

Problem:

```text
Return the maximum depth of a binary tree.
```

### Pattern classifier

Tree + "depth" -> DFS recursion.

### State builder

One recursive call should answer:

```text
What is the max depth of this subtree?
```

### Solution

```python
def max_depth(root):
    if root is None:
        return 0
    left = max_depth(root.left)
    right = max_depth(root.right)
    return 1 + max(left, right)
```

### Proof

The depth of an empty tree is zero. The depth of a non-empty tree is one for the
current node plus the deeper of its two subtrees.

### Mistake rule

For tree recursion, define the return value in one sentence before coding.

## Example 2: Number of islands

Problem:

```text
Given a grid of '1' land and '0' water, count islands connected 4-directionally.
```

### Pattern classifier

Grid connected components -> DFS or BFS.

### State builder

```text
visited cells should not be counted twice
starting DFS from new land consumes one whole island
```

### Solution

```python
def num_islands(grid):
    if not grid:
        return 0

    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] != "1":
            return

        grid[r][c] = "0"
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)

    return count
```

### Why marking works

Changing visited land to water prevents revisiting the same island. Each DFS
call consumes exactly one connected component.

### Mistake rules

- Check bounds before reading `grid[r][c]`.
- Mark visited before recursive calls, not after.
- Know whether mutation is allowed; otherwise use a `visited` set.

## Example 3: Climbing stairs

Problem:

```text
You can climb 1 or 2 steps. How many ways to reach step n?
```

### Pattern classifier

The number of ways to reach `n` depends on smaller answers:

```text
ways(n) = ways(n-1) + ways(n-2)
```

This is DP.

### State builder

```text
dp[i] = number of ways to reach step i
```

### Solution

```python
def climb_stairs(n):
    if n <= 2:
        return n

    prev2 = 1
    prev1 = 2

    for _ in range(3, n + 1):
        cur = prev1 + prev2
        prev2 = prev1
        prev1 = cur

    return prev1
```

### Proof

The last move to step `i` is either from `i-1` using one step or from `i-2`
using two steps. These options do not overlap, so add them.

### Mistake rule

For DP, write:

```text
dp state:
transition:
base cases:
answer:
```

If one of those four is missing, do not code yet.

## Example 4: Coin change minimum coins

Problem:

```text
Given coins and amount, return the minimum number of coins needed.
Return -1 if impossible.
```

### State

```text
dp[x] = minimum coins needed to make amount x
```

### Transition

To make amount `x`, try each coin:

```text
dp[x] = min(dp[x], dp[x - coin] + 1)
```

### Solution

```python
def coin_change(coins, amount):
    INF = amount + 1
    dp = [INF] * (amount + 1)
    dp[0] = 0

    for x in range(1, amount + 1):
        for coin in coins:
            if x - coin >= 0:
                dp[x] = min(dp[x], dp[x - coin] + 1)

    return -1 if dp[amount] == INF else dp[amount]
```

### Mistake rules

- `dp[0] = 0` because zero coins make amount zero.
- Use a large impossible value, not zero, for unknown minimums.
- The answer is `dp[amount]`, not the whole table.

## Advanced pattern recall

```text
Tree -> define recursive return.
Graph -> define node/state and visited.
DP -> define subproblem, transition, base case, answer.
```

This turns advanced topics into mechanical checklists.
