---
id: dsa-12-trees
title: Trees & BSTs — structure and the key invariants
track: dsa
topic: trees
order: 12
estMinutes: 10
prerequisites: [dsa-08-recursion]
pattern: trees
---

# Trees

A tree is a connected acyclic graph with `n - 1` edges. Most interview trees are **binary trees** — each node has at most a left and right child.

## The node

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

A node with no children is a **leaf**. The top is the **root**. **Depth** of a node = number of edges from root. **Height** of a tree = max depth.

## Properties to know

- A complete binary tree of height `h` has at most `2^(h+1) - 1` nodes.
- A tree with `n` nodes has height `log n` if balanced, `n` if a degenerate "linked list."
- DFS visits use **`O(height)`** stack space — `O(log n)` balanced, `O(n)` worst case.
- BFS uses **`O(width)`** queue space — for a complete tree, the bottom level is `~n/2` wide.

## Recursion is the natural shape

Trees and recursion are a perfect match. For most tree problems, the recursive structure is:

```
solve(node) = combine(solve(node.left), solve(node.right), something_about(node))
```

### Examples

```python
def max_depth(root):
    if not root: return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))

def is_same(a, b):
    if not a and not b: return True
    if not a or not b: return False
    return a.val == b.val and is_same(a.left, b.left) and is_same(a.right, b.right)

def invert(root):
    if not root: return None
    root.left, root.right = invert(root.right), invert(root.left)
    return root
```

The pattern: **base case (empty subtree)**, **recurse**, **combine**.

## BST — Binary Search Tree

A binary tree where for every node: all values in the **left** subtree are `< node.val`, all values in the **right** subtree are `> node.val`. (Some variants allow equal; pick a convention.)

### Implications
- **In-order traversal of a BST gives sorted values.** This is the single most useful fact about BSTs.
- **Search / insert / delete** are `O(height)` — `O(log n)` balanced, `O(n)` if it degenerates into a chain.
- **Find min**: walk left until you can't. **Find max**: walk right until you can't.

### Search

```python
def search(root, target):
    while root:
        if root.val == target: return root
        root = root.left if target < root.val else root.right
    return None
```

### Validate BST — classic interview trap

The naive "check left < root < right" recursion is **wrong**. Counterexample:

```
    5
   / \
  3   8
 / \
1   6      ← 6 > 5, violates BST even though 6 > 3
```

The fix: pass bounds down.

```python
def is_valid_bst(root, lo=float("-inf"), hi=float("inf")):
    if not root: return True
    if not (lo < root.val < hi): return False
    return (is_valid_bst(root.left, lo, root.val)
            and is_valid_bst(root.right, root.val, hi))
```

Every node must lie strictly inside the bounds inherited from its ancestors.

## LCA — Lowest Common Ancestor

For a general binary tree:

```python
def lca(root, p, q):
    if not root or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:             # p and q are in different subtrees
        return root
    return left or right
```

For a BST you can do better — if both `p.val` and `q.val` are less than `root.val`, go left; if both greater, go right; otherwise `root` is the LCA. `O(log n)`.

## Common bugs

- **`if root:` vs `if not root:`** — get the base case right at the top.
- **Modifying the tree while iterating** — usually you want a return-value style, not mutation.
- **Off-by-one on height vs depth.** A single-node tree has height 0 (some conventions) or height 1. Pick one and state it.
- **BST validation using only immediate children** — the bounds-down approach is the correct general fix.
