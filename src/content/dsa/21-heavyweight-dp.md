---
id: dsa-21-heavyweight-dp
title: Heavyweight DP (Bitmask, Digit, and Tree DP)
track: dsa
topic: advanced-dsa
order: 21
estMinutes: 28
prerequisites: [dsa-17-dp-1d]
pattern: dynamic-programming
---

# Heavyweight DP (Bitmask, Digit, and Tree DP)

Standard dynamic programming (like Knapsack or LCS) is common. Advanced interviews, however, test multi-dimensional state tracking over subsets, counting constraints, and tree subgraphs.

---

## 1. Bitmask DP: Tracking Subsets

When an algorithm requires matching or traveling through a subset of elements (where $N \le 20$), we can represent the subset state as an integer **bitmask**.

*   Each bit `i` in the mask is `1` if element `i` is included in the subset, and `0` otherwise.
*   Total subset states: $2^N$.

### Bitwise Operator Cheat Sheet

| Operation | Bitwise Syntax |
| :--- | :--- |
| Check if `i`-th element is in subset | `(mask & (1 << i)) != 0` |
| Add `i`-th element to subset | `new_mask = mask | (1 << i)` |
| Remove `i`-th element from subset | `new_mask = mask & ~(1 << i)` |
| Toggle `i`-th element in subset | `new_mask = mask ^ (1 << i)` |

### Traveling Salesperson Problem (TSP) Template

Find the shortest path visiting all nodes from `0` to `N-1` exactly once:

```python
def tsp(n, dists):
    # memo table: state is (current_node, mask of visited nodes)
    memo = {}

    def solve(curr, mask):
        if mask == (1 << n) - 1: # Visited all nodes
            return dists[curr][0] # Return back to starting city 0
        if (curr, mask) in memo:
            return memo[(curr, mask)]

        ans = float('inf')
        for next_node in range(n):
            # If next_node is not visited yet
            if not (mask & (1 << next_node)):
                cost = dists[curr][next_node] + solve(next_node, mask | (1 << next_node))
                ans = min(ans, cost)

        memo[(curr, mask)] = ans
        return ans

    return solve(0, 1) # Start at node 0, with only node 0 visited (mask = 1)
```

---

## 2. Digit DP: Counting Ranges

Digit DP counts the number of integers in a range `[A, B]` that satisfy a specific property (e.g. "numbers with no consecutive digit duplicates").

*   Instead of checking numbers one-by-one (which is $O(N)$), we build digits one-by-one from left to right.
*   **Key trick**: To find numbers in `[A, B]`, calculate `solve(B) - solve(A - 1)`.

### State Variables
1.  **`idx`**: The current digit position we are choosing.
2.  **`tight`**: A boolean indicating if we are restricted by the prefix of the boundary number. If `tight` is True, we can only place digits up to `limit = int(num[idx])`. If False, we can place any digit `0..9`.
3.  **`leading_zero`**: True if we haven't placed a non-zero digit yet.

```python
def count_numbers(limit_str):
    memo = {}

    def dp(idx, tight, leading_zero, prev_digit):
        if idx == len(limit_str):
            return 1 # Valid number formed

        state = (idx, tight, leading_zero, prev_digit)
        if state in memo:
            return memo[state]

        limit = int(limit_str[idx]) if tight else 9
        ans = 0

        for d in range(limit + 1):
            new_tight = tight and (d == limit)
            new_leading = leading_zero and (d == 0)

            # Insert problem-specific checks here
            # Example: Avoid consecutive matching digits
            if not new_leading and d == prev_digit:
                continue

            ans += dp(idx + 1, new_tight, new_leading, d)

        memo[state] = ans
        return ans

    return dp(0, True, True, -1)
```

---

## 3. DP on Trees

DP on Trees involves computing states on subtrees recursively using DFS.
*   The state is usually `dp[u][0]` (value when node `u` is not included) and `dp[u][1]` (value when node `u` is included).

### Maximum Independent Set (House Robber on a Tree)

Find the maximum subset of nodes in a tree such that no two adjacent nodes are both chosen:

```python
def max_independent_set(root, adj):
    memo = {}

    def dfs(u, p):
        # Returns (max sum if u is NOT chosen, max sum if u IS chosen)
        # adj contains undirected tree edges
        
        not_chosen_sum = 0
        chosen_sum = u # Node value or weight

        for v in adj[u]:
            if v != p:
                v_not, v_yes = dfs(v, u)
                # If u is NOT chosen, v can be chosen or not chosen
                not_chosen_sum += max(v_not, v_yes)
                # If u IS chosen, v MUST NOT be chosen
                chosen_sum += v_not

        return not_chosen_sum, chosen_sum
```
*   **Time Complexity**: $O(V)$ since each node is processed exactly once in a single DFS traversal.
