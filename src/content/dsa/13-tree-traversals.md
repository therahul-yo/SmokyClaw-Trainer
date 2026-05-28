---
id: dsa-13-tree-traversals
title: Tree traversals — DFS, BFS, level-order
track: dsa
topic: trees
order: 13
estMinutes: 8
prerequisites: [dsa-12-trees]
pattern: trees
---

# Tree traversals

Four core traversals. The first three are DFS (depth-first), the last is BFS (breadth-first / level order).

## DFS — three flavors

The flavor is defined by *when* you visit the current node relative to its children.

```
       1
      / \
     2   3
    / \
   4   5
```

| Traversal | Order | Output |
|---|---|---|
| **Preorder** | node, left, right | 1, 2, 4, 5, 3 |
| **Inorder** | left, node, right | 4, 2, 5, 1, 3 |
| **Postorder** | left, right, node | 4, 5, 2, 3, 1 |

### Recursive

```python
def preorder(root, out):
    if not root: return
    out.append(root.val)
    preorder(root.left, out)
    preorder(root.right, out)

def inorder(root, out):
    if not root: return
    inorder(root.left, out)
    out.append(root.val)
    inorder(root.right, out)

def postorder(root, out):
    if not root: return
    postorder(root.left, out)
    postorder(root.right, out)
    out.append(root.val)
```

### Iterative preorder (using a stack)

```python
def preorder_iter(root):
    if not root: return []
    out, stack = [], [root]
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right: stack.append(node.right)      # right first → left popped first
        if node.left:  stack.append(node.left)
    return out
```

Iterative inorder uses a "go left while you can, then visit, then go right" stack pattern.

## When to use which

- **Inorder on a BST** gives sorted values. The single most useful traversal.
- **Preorder** is good for serializing / cloning a tree — you see each node before its subtree.
- **Postorder** is right for "compute something from children first" — e.g., subtree size, balance check, where you need both children's results before deciding for the parent.

## BFS — level order

```python
from collections import deque

def level_order(root):
    if not root: return []
    out = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):    # snapshot the level size
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out
```

The `for _ in range(len(q))` trick keeps levels separated. Without it, you get one flat list.

## Complexity

All four are `O(n)` time — every node visited once. Space:

- DFS recursive: `O(height)` — `O(log n)` balanced, `O(n)` skewed.
- DFS iterative: `O(height)` — same.
- BFS: `O(width)` — `O(n)` for a complete tree's bottom level. So BFS can use more memory than DFS on a wide-ish balanced tree.

## What interviewers ask

- **"Print level by level"** → BFS with the `for _ in range(len(q))` trick.
- **"Zigzag level order"** → BFS, but alternate appending each level left-to-right vs right-to-left.
- **"Right side view"** → BFS, take last node of each level.
- **"Minimum depth"** → BFS — first leaf you encounter is the answer. DFS would explore the deeper branches needlessly.
- **"Serialize/deserialize binary tree"** → preorder DFS with `None` markers.

## DFS vs BFS — picking one

- **Need shortest path / fewest steps**: BFS.
- **Need to explore a single deep branch / answer "is there any path"**: DFS.
- **Need values in sorted order from a BST**: inorder DFS.
- **Need to compute from leaves up**: postorder DFS.
- **Tree is very deep and narrow**: BFS to avoid recursion stack overflow.
- **Tree is very wide and shallow**: DFS to avoid huge queue.
