---
id: sql-05-cte
title: CTEs — WITH clauses for readable SQL
track: sql
topic: cte
order: 5
estMinutes: 8
prerequisites: [sql-04-subqueries]
pattern: sql-cte
---

# CTEs (Common Table Expressions)

A CTE names a subquery so you can reference it like a table. `WITH name AS (SELECT ...)`. Cleaner than nested subqueries; required reading for any non-trivial SQL.

## The shape

```sql
WITH dept_counts AS (
  SELECT dept_id, COUNT(*) AS n
  FROM employees
  GROUP BY dept_id
)
SELECT d.name, dc.n
FROM departments d
JOIN dept_counts dc ON d.id = dc.dept_id
ORDER BY dc.n DESC;
```

The `WITH ... AS (...)` block defines `dept_counts`. The main query then uses it like a table. No special semantics — it's a named subquery, scoped to this statement.

## Multiple CTEs

Chain them with commas. Each can reference earlier CTEs.

```sql
WITH
  big_depts AS (
    SELECT id FROM departments WHERE budget > 1000000
  ),
  big_dept_employees AS (
    SELECT * FROM employees WHERE dept_id IN (SELECT id FROM big_depts)
  )
SELECT COUNT(*) FROM big_dept_employees;
```

This is the main appeal: you read top-to-bottom, like a script. Nested subqueries read inside-out.

## CTE vs derived table

```sql
-- Derived table version
SELECT d.name, t.n
FROM departments d
JOIN (SELECT dept_id, COUNT(*) AS n FROM employees GROUP BY dept_id) t
  ON d.id = t.dept_id;

-- CTE version (same query)
WITH t AS (SELECT dept_id, COUNT(*) AS n FROM employees GROUP BY dept_id)
SELECT d.name, t.n
FROM departments d
JOIN t ON d.id = t.dept_id;
```

For one-off derived tables, either works. For multi-step queries, CTEs win on readability.

## Recursive CTEs

A CTE can reference itself. Used for hierarchies, graph traversal, sequence generation.

```sql
-- Generate numbers 1..10
WITH RECURSIVE nums(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 10
)
SELECT * FROM nums;
```

The shape is always **anchor `UNION ALL` recursive**:
- Anchor: the starting rows.
- Recursive: a query that references the CTE, producing the next level.

### Employee hierarchy traversal

```sql
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS level
  FROM employees
  WHERE manager_id IS NULL                      -- the CEO

  UNION ALL

  SELECT e.id, e.name, e.manager_id, o.level + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org ORDER BY level, name;
```

Start with rows that have no manager, then repeatedly add reports of already-found people.

Always include a stopping condition — either the recursive query naturally produces no rows (e.g., leaves of the tree), or you guard with a depth limit.

## When to reach for CTEs

- **Same subquery referenced twice.** Without a CTE, you'd duplicate it. With, name it once.
- **Step-by-step transformation.** Break a complex query into clear stages: filter → aggregate → join → final select.
- **Recursive structure.** Trees, graphs, sequences.
- **Readability.** Even a one-stage CTE is sometimes worth it just to give a meaningful name.

## When NOT to

- A simple JOIN reads fine — don't dress it up.
- The query plan suffers (some engines materialize CTEs even when they shouldn't). For PostgreSQL pre-12 specifically, `WITH` was an optimization fence; modern versions inline by default.

## Common bugs

- **Forgetting the comma between multiple CTEs.** `WITH a AS (...), b AS (...)` — comma separates, not `WITH`.
- **Recursive without `UNION ALL`** — only `UNION ALL` is allowed in recursive CTEs in most engines.
- **Recursive that doesn't terminate** — query runs forever. Always have a base case that eventually has zero rows.
- **Using a CTE expecting it to be evaluated lazily** — it may be materialized, may be inlined; depends on the engine.
