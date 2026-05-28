---
id: dsa-14-heaps
title: Heaps — top-K, priority queues
track: dsa
topic: heap
order: 14
estMinutes: 8
prerequisites: [dsa-04-big-o]
pattern: heap
---

# Heaps

A heap is a binary tree where every parent is `≤` its children (min-heap) or `≥` (max-heap). The smallest element is always at the root. Implemented as an array — no pointers needed.

Operations:
- **push**: `O(log n)` — append, sift up.
- **pop** (smallest): `O(log n)` — swap with last, pop last, sift down.
- **peek**: `O(1)` — `heap[0]`.
- **build from n items**: `O(n)` — better than `n` pushes (which would be `O(n log n)`).

## Python — `heapq` only does min-heap

```python
import heapq

h = []
heapq.heappush(h, 3)
heapq.heappush(h, 1)
heapq.heappush(h, 2)
heapq.heappop(h)               # 1
h[0]                           # 2 — peek
heapq.heapify([3, 1, 4, 1, 5])  # in-place, O(n)
```

For a **max-heap**, push the negative:

```python
heapq.heappush(h, -value)
largest = -heapq.heappop(h)
```

Or store tuples `(-priority, item)` and `heappop` gives you the highest priority.

## Top-K patterns

### Top-K largest from a stream
Keep a min-heap of size K. For each new item, push; if size > K, pop. End with the K largest.

```python
def top_k_largest(stream, k):
    h = []
    for x in stream:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)       # remove the smallest of our K
    return sorted(h, reverse=True)
```

`O(n log k)` time, `O(k)` space. Crushes the `O(n log n)` sort-everything approach for large `n`, small `k`.

### Top-K smallest
Same but with a max-heap (negate values).

### One-shot
```python
heapq.nlargest(k, items)
heapq.nsmallest(k, items)
heapq.nlargest(k, items, key=lambda x: x.score)
```

If you have all items upfront, just use these. The streaming pattern is for when items arrive over time or `n` is enormous and you want to avoid storing it all.

## Priority queue

A heap is a priority queue. Dijkstra's shortest path, A*, task scheduling, Huffman coding all use it.

```python
# Dijkstra's outline
import heapq
def dijkstra(graph, start):
    dist = {start: 0}
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float("inf")): continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist
```

The `if d > dist[u]: continue` is the **lazy-deletion** trick — instead of trying to update entries inside the heap (which `heapq` doesn't support), you push a new better entry and skip stale ones on pop.

## Median of a stream

Two heaps: a max-heap for the lower half, a min-heap for the upper half. Keep them balanced. The median is on top.

```python
class MedianFinder:
    def __init__(self):
        self.lo = []                   # max-heap (negated)
        self.hi = []                   # min-heap

    def add(self, x):
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def median(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
```

`add` is `O(log n)`, `median` is `O(1)`. Asked at: Amazon India, Google.

## What to remember

- **`heapq` is min-heap only.** Negate for max-heap.
- **Building from a list is `O(n)`**, not `O(n log n)`. Use `heapify`.
- **Pop returns the smallest**, not the largest, of a min-heap.
- **No update-key** — use lazy deletion if you'd want one.
- **Top-K with a heap of size K is the standard move.** State the `O(n log k)` complexity confidently.
