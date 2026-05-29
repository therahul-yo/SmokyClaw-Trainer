---
id: dsa-20-advanced-graph-algorithms
title: Advanced graph algorithms (SCC, shortest paths, flow)
track: dsa
topic: advanced-dsa
order: 20
estMinutes: 30
prerequisites: [dsa-15-graphs]
pattern: graphs
---

# Advanced graph algorithms (SCC, shortest paths, flow)

For top-tier software engineering and competitive programming roles, basic DFS/BFS is not enough. You must master strongly connected components, negative-weight shortest paths, and network flow dynamics.

---

## 1. Strongly Connected Components (SCC)

A **Strongly Connected Component (SCC)** of a directed graph is a maximal subgraph where every vertex is reachable from every other vertex in that subgraph.

```text
       A ----> B <----> C
       ^      /
        \    v
         \-- D
     
     SCC 1: {A, B, D}   SCC 2: {C}
```

### Tarjan's Algorithm (Single DFS Pass)
Tarjan's algorithm uses a DFS traversal to find SCCs in $O(V + E)$ time. It tracks:
1.  **Discovery Time (`disc[u]`)**: The order index in which node `u` was first visited.
2.  **Low-Link Value (`low[u]`)**: The smallest discovery time reachable from `u` using at most one back-edge.

```python
def find_sccs(n, adj):
    disc = [-1] * n
    low = [-1] * n
    on_stack = [False] * n
    stack = []
    time = 0
    sccs = []

    def dfs(u):
        nonlocal time
        disc[u] = low[u] = time
        time += 1
        stack.append(u)
        on_stack[u] = True

        for v in adj[u]:
            if disc[v] == -1: # Unvisited child
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on_stack[v]: # Back-edge to ancestor
                low[u] = min(low[u], disc[v])

        # If u is a root of an SCC, pop from stack
        if low[u] == disc[u]:
            scc = []
            while True:
                node = stack.pop()
                on_stack[node] = False
                scc.append(node)
                if node == u:
                    break
            sccs.append(scc)

    for i in range(n):
        if disc[i] == -1:
            dfs(i)
    return sccs
```

---

## 2. Advanced Shortest Paths

While Dijkstra handles positive weights in $O((E + V) \log V)$ time, other algorithms handle negative weights or compute all-pairs paths.

### A. Bellman-Ford (Single Source, Negative Weights)
Bellman-Ford relaxes all edges $V-1$ times.
*   **Time Complexity**: $O(V \times E)$
*   **Edge Case**: Detects negative-weight cycles (if a value decreases on the $V$-th iteration, a negative cycle exists).

```python
def bellman_ford(n, edges, src):
    dist = [float('inf')] * n
    dist[src] = 0

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Check for negative cycle
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            raise ValueError("Graph contains a negative weight cycle")

    return dist
```

### B. Floyd-Warshall (All-Pairs Shortest Path)
Floyd-Warshall is a dynamic programming algorithm that finds the shortest path between *all* pairs of vertices.
*   **Time Complexity**: $O(V^3)$
*   **Space Complexity**: $O(V^2)$

```python
def floyd_warshall(n, graph):
    dist = [[float('inf')] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
        for j, w in graph[i]:
            dist[i][j] = w

    for k in range(n): # Intermediate helper nodes
        for i in range(n):
            for j in range(n):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
    return dist
```

---

## 3. Network Flow

A **flow network** is a directed graph where each edge has a capacity. We want to route the maximum possible flow from a source ($s$) to a sink ($t$).

### Min-Cut Max-Flow Theorem
The maximum flow through a network is exactly equal to the capacity of the **minimum cut** (the set of edges whose deletion splits the graph into two parts, grouping $s$ and $t$ separately).

### Ford-Fulkerson Algorithm (Augmenting Paths)
1.  Find an augmenting path (a path from $s$ to $t$ with available residual capacity) using DFS/BFS.
2.  Find the bottleneck capacity along this path.
3.  Add this bottleneck flow to the total flow.
4.  Update the **residual graph** by subtracting the bottleneck from the forward edges and adding it to reverse edges.
5.  Repeat until no augmenting path exists.

*   **Time Complexity**: $O(E \times f)$, where $f$ is the maximum flow. For large flow capacities, **Dinic's Algorithm** ($O(V^2 E)$) or **Edmonds-Karp** ($O(V E^2)$) is preferred.
