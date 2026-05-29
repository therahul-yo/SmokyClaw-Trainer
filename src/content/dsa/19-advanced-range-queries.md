---
id: dsa-19-advanced-range-queries
title: Advanced range queries (Segment & Fenwick Trees)
track: dsa
topic: advanced-dsa
order: 19
estMinutes: 28
prerequisites: [dsa-12-trees]
pattern: range-queries
---

# Advanced range queries (Segment & Fenwick Trees)

In coding interviews, you may face problems that require querying properties of a subarray (like range sum, minimum, or maximum) while concurrently updating individual elements or ranges of elements.

---

## 1. The Core Trade-off

If you have an array of size $N$ and perform $Q$ operations:

| Approach | Query Complexity | Update Complexity | Total Complexity |
| :--- | :--- | :--- | :--- |
| **Brute Force** | $O(N)$ (scan range) | $O(1)$ (change value) | $O(Q \times N)$ |
| **Prefix Sums** | $O(1)$ (math check) | $O(N)$ (recompute sums) | $O(Q \times N)$ |
| **Segment / Fenwick Tree** | $O(\log N)$ | $O(\log N)$ | $O(Q \log N)$ |

Advanced range query structures break down the range into a set of precomputed intervals of size $2^k$, allowing updates and queries to complete in logarithmic time.

---

## 2. Segment Trees

A **Segment Tree** is a binary tree where each node represents an interval of the array. The root represents the entire array `[0, N-1]`, and its children represent divided halves.

```text
                  [0, 3] (sum=10)
                 /       \
         [0, 1] (sum=3)   [2, 3] (sum=7)
         /      \          /      \
      [0] (1)  [1] (2)   [2] (3)  [3] (4)
```

### Tree Size
If the array has size $N$, a safe size for the Segment Tree array representation is **$4N$** nodes.

### Segment Tree Implementation (Sum Query)

```python
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.build(arr, 0, 0, self.n - 1)

    def build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self.build(arr, 2 * node + 1, start, mid)
        self.build(arr, 2 * node + 2, mid + 1, end)
        self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2]

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if start <= idx <= mid:
            self.update(2 * node + 1, start, mid, idx, val)
        else:
            self.update(2 * node + 2, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2]

    def query(self, node, start, end, l, r):
        if r < start or end < l: # Out of range
            return 0
        if l <= start and end <= r: # Completely in range
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self.query(2 * node + 1, start, mid, l, r)
        p2 = self.query(2 * node + 2, mid + 1, end, l, r)
        return p1 + p2
```

---

## 3. Lazy Propagation (Range Updates)

If you need to update a whole range (e.g. add `5` to all elements from index `L` to `R`), updating elements one-by-one takes $O(N \log N)$ time. 

**Lazy Propagation** solves this in $O(\log N)$ by postponing updates to children.
* When updating a range, if a node represents a range completely inside the update interval, we update the node value and write a "lazy tag" on it.
* We only pass this lazy tag to its children later when we actually traverse down to read those children.

---

## 4. Fenwick Trees (Binary Indexed Trees)

A **Fenwick Tree** (or Binary Indexed Tree) is a compact, array-based tree that supports point updates and prefix sum queries in $O(\log N)$ time.

* It uses **$O(N)$ memory** (same size as the input array).
* It relies on bit manipulation. Each index `i` stores the sum of a range of length equal to the **least significant set bit (LSB)** of `i`.

$$\text{LSB}(x) = x \mathbin{\&} (-x)$$

```text
Index (1-based):   1    2    3    4    5    6    7    8
LSB(i):            1    2    1    4    1    2    1    8
Range covered:    [1]  [1-2] [3]  [1-4] [5]  [5-6] [7]  [1-8]
```

### Fenwick Tree Implementation

```python
class FenwickTree:
    def __init__(self, size):
        self.size = size
        self.tree = [0] * (size + 1) # 1-based indexing

    def update(self, i, delta):
        # Add delta to index i, propagate updates up to parents
        while i <= self.size:
            self.tree[i] += delta
            i += i & (-i) # Move to next interval parent

    def query(self, i):
        # Calculate sum from index 1 to i
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i) # Move to prefix sibling
        return s

    def range_query(self, l, r):
        return self.query(r) - self.query(l - 1)
```

---

## 5. Segment Tree vs. Fenwick Tree

| Feature | Segment Tree | Fenwick Tree |
| :--- | :--- | :--- |
| **Space Complexity** | $O(4N)$ (Large) | $O(N)$ (Compact) |
| **Constants/Speed** | Slower (more pointers/traversals) | Extremely fast (bit shifts) |
| **Query Types** | Anything (Sum, Min, Max, GCD) | Commutative operations (Sum, XOR, Product) |
| **Range Updates** | Highly flexible with Lazy Propagation | Requires auxiliary arrays, complex |
| **Implementation** | Long / Verbose | Very short and clean |
