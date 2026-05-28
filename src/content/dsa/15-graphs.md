---
id: dsa-15-graphs
title: Graphs — BFS, DFS, topo sort, shortest path
track: dsa
topic: graphs
order: 15
estMinutes: 14
prerequisites: [dsa-13-tree-traversals, dsa-14-heaps]
pattern: graphs
---

# Graphs

A graph is a set of nodes and edges. Edges can be **directed** or **undirected**, **weighted** or unweighted. Trees are a special case (connected, acyclic, undirected).

## Representations

### Adjacency list (the right default)

```python
from collections import defaultdict

graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)             # omit this line for directed
```

`O(V + E)` space. Iterating neighbors is `O(degree)`.

### Adjacency matrix

```python
adj = [[0] * n for _ in range(n)]
for u, v in edges:
    adj[u][v] = 1
    adj[v][u] = 1
```

`O(V²)` space. Worse unless the graph is dense or you need `O(1)` edge-existence checks.

## BFS — shortest path in an unweighted graph

```python
from collections import deque

def bfs_shortest(graph, start, target):
    visited = {start}
    q = deque([(start, 0)])        # (node, distance)
    while q:
        node, d = q.popleft()
        if node == target:
            return d
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)
                q.append((nb, d + 1))
    return -1
```

Each node is visited once. `O(V + E)` time and space.

**Key idea:** BFS layer-by-layer explores all nodes at distance `d` before any at distance `d + 1`. The first time we reach the target is the shortest distance — in unweighted graphs.

## DFS — connectivity, cycle detection, components

```python
def dfs(graph, start, visited):
    visited.add(start)
    for nb in graph[start]:
        if nb not in visited:
            dfs(graph, nb, visited)
```

For deep graphs, the recursion stack can blow up. The iterative form uses an explicit stack — same shape as iterative preorder.

### Count connected components

```python
def count_components(n, edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v); graph[v].append(u)
    visited = set()
    count = 0
    for node in range(n):
        if node not in visited:
            dfs(graph, node, visited)
            count += 1
    return count
```

### Cycle detection in a directed graph (3-color DFS)

```python
WHITE, GRAY, BLACK = 0, 1, 2

def has_cycle(graph, n):
    color = [WHITE] * n
    def dfs(u):
        color[u] = GRAY
        for v in graph[u]:
            if color[v] == GRAY: return True          # back edge → cycle
            if color[v] == WHITE and dfs(v): return True
        color[u] = BLACK
        return False
    return any(color[u] == WHITE and dfs(u) for u in range(n))
```

GRAY means "on the current DFS path." Hitting a GRAY node means a back edge, which means a cycle.

## Topological sort — order tasks with prerequisites

For a **directed acyclic graph (DAG)**, list nodes so every edge `u → v` has `u` before `v`. Classic prerequisite problem: course schedule.

### Kahn's algorithm (BFS-based)

```python
def topo_sort(n, edges):
    graph = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    q = deque([u for u in range(n) if indeg[u] == 0])
    out = []
    while q:
        u = q.popleft()
        out.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return out if len(out) == n else []     # empty → cycle
```

Repeatedly emit a node with no remaining prerequisites. If you can't emit all `n`, there's a cycle.

## Shortest path — weighted, non-negative — Dijkstra

```python
import heapq

def dijkstra(graph, start, n):
    dist = [float("inf")] * n
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist
```

`O((V + E) log V)` with a binary heap. **Doesn't work with negative weights** — use Bellman-Ford for that.

## Union-Find (Disjoint Set Union)

For "are these two in the same group?" / "how many components?" / Kruskal's MST.

```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0] * n

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]    # path compression
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False
        if self.r[ra] < self.r[rb]: ra, rb = rb, ra
        self.p[rb] = ra
        if self.r[ra] == self.r[rb]: self.r[ra] += 1
        return True
```

With path compression + union by rank, both ops are effectively `O(α(n))` ≈ `O(1)`.

## Which algorithm for what

| Problem | Use |
|---|---|
| Shortest path, unweighted | BFS |
| Shortest path, non-negative weights | Dijkstra |
| Shortest path, negative weights | Bellman-Ford |
| All-pairs shortest path | Floyd-Warshall (`O(V³)`) |
| Topological order | Kahn's BFS or DFS postorder reversed |
| Cycle detection (directed) | 3-color DFS or Kahn's (no full topo → cycle) |
| Cycle detection (undirected) | DFS or DSU |
| Connected components | DFS / BFS / DSU |
| Minimum spanning tree | Kruskal (sort + DSU) or Prim (heap) |

## Common bugs

- **Visiting nodes more than once.** Always check `visited` before pushing/recursing — not after popping.
- **Marking visited on pop instead of push** — same node can land in the queue multiple times → revisits, but BFS distances still correct. For DFS it can blow up.
- **Forgetting both directions on an undirected edge.** `graph[u].append(v); graph[v].append(u)`.
- **Using Dijkstra with negative weights.** It silently gives wrong answers.
