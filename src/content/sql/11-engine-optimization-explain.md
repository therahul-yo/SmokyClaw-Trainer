---
id: sql-11-engine-optimization-explain
title: SQL indexes & query optimization
track: sql
topic: advanced-sql
order: 11
estMinutes: 25
prerequisites: [sql-08-indexes]
pattern: database-optimization
---

# SQL indexes & query optimization

To write high-performance SQL database systems, you must understand how the database engine executes queries under the hood and how indexes structure lookup paths on disk.

---

## 1. Database Index Anatomy: The B-Tree

By default, relational databases (like PostgreSQL, MySQL, and SQLite) use **B-Tree** structures for indexing.

A B-Tree (Balanced Tree) is a self-balancing search tree where each node contains sorted keys and pointers to children. Unlike binary trees, B-Tree nodes are wide—typically holding hundreds of keys per node to align with disk page blocks (typically 8KB).

```text
                        [ 50 | 100 ]  (Root)
                       /     |      \
         [ 10 | 30 ]     [ 60 | 80 ]   [ 120 | 150 ]  (Internal Nodes)
        /   |    \      /   |    \     /    |     \
     [1..9][11..29]... [51..59]...    [101..119]...   (Leaf Nodes - point to Heap rows)
```

### The Search Traversal
1.  The engine starts at the root node.
2.  It performs a binary search on the node's sorted keys to find the correct branch.
3.  It descends to the child page, repeating the search until it reaches a leaf node.
4.  The leaf node contains the key value and a physical pointer (Row ID or TID) to the actual table row stored in the data heap.

Because the tree height is balanced and stays low (usually 3 to 4 levels for millions of rows), lookup time is guaranteed to be **$O(\log N)$** disk page reads.

---

## 2. Table Scan Types

When a query is run, the Cost-Based Optimizer (CBO) decides which scan strategy is the cheapest:

### A. Sequential Scan (Seq Scan)
The database scans the entire table on disk from start to finish, checking every row against the `WHERE` filters.
*   **Complexity**: $O(N)$
*   **Usage**: Chosen for tiny tables, or when the query retrieves a large percentage of the table's total rows.

### B. Index Scan
The database navigates the B-Tree index to locate matching keys, retrieves the physical row pointers from the leaves, and then fetches the corresponding data pages from the heap.
*   **Complexity**: $O(\log N)$
*   **Usage**: Chosen for selective queries retrieving a small percentage of rows.

### C. Index-Only Scan (Covering Index)
The database reads *only* the B-Tree leaf nodes to answer the query. It does not visit the actual table heap pages at all.
*   **Requirements**: All columns requested in the `SELECT` and `WHERE` clauses must be present in the index.
*   **Complexity**: $O(\log N)$ (much faster since it avoids random disk I/O to heap pages).

---

## 3. Interpreting `EXPLAIN ANALYZE`

Adding `EXPLAIN ANALYZE` before your query forces the engine to compile, execute, and print the actual execution statistics.

Example output:
```text
EXPLAIN ANALYZE SELECT first_name FROM employees WHERE employee_id = 4501;

Index Scan using employees_pkey on employees  (cost=0.28..8.30 rows=1 width=9) (actual time=0.015..0.016 rows=1 loops=1)
  Index Cond: (employee_id = 4501)
Planning Time: 0.082 ms
Execution Time: 0.032 ms
```

### Key Metrics to Read
*   **`cost=0.28..8.30`**:
    *   `0.28`: Startup cost (estimated cost to retrieve the first row, e.g. navigating the tree).
    *   `8.30`: Total cost (estimated cost to complete the query, relative to disk page reads).
*   **`rows=1`**: The optimizer's estimate of how many rows will be returned.
*   **`actual time=0.015..0.016`**: Real execution times in milliseconds for the first and last row.
*   **Planning Time**: Time taken by the parser and optimizer to choose the execution path.
*   **Execution Time**: Time spent actually executing the plan on the database engine.

---

## 4. Common Indexing Optimization Patterns

### A. Left-Prefix Rule on Composite Indexes
If you create a composite index on `INDEX(last_name, first_name)`:
*   A query filtering on `WHERE last_name = 'Smith'` **will** use the index.
*   A query filtering on `WHERE last_name = 'Smith' AND first_name = 'John'` **will** use the index.
*   A query filtering on `WHERE first_name = 'John'` **cannot** use the index! (It must scan sequentially because the index is sorted primary by `last_name`).

### B. Index Suppressing Expressions
Using functions on indexed columns prevents the engine from using the B-Tree, because the index stores the raw column values, not the function results.
*   ❌ **Slow**: `WHERE YEAR(signup_date) = 2026` (Causes Seq Scan)
*   ✓ **Fast**: `WHERE signup_date >= '2026-01-01' AND signup_date < '2027-01-01'` (Uses Index Scan)
