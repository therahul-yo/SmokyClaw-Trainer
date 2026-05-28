---
id: sql-04-subqueries
title: Subqueries — IN, EXISTS, correlated
track: sql
topic: subqueries
order: 4
estMinutes: 10
prerequisites: [sql-02-joins, sql-03-group-by]
pattern: sql-subqueries
---

# Subqueries

A subquery is a SELECT inside another SELECT. Used to compute a value or set used by the outer query.

## Three places subqueries appear

### 1. In the WHERE clause — scalar or set

**Scalar subquery** — returns one value.

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

**Set subquery** with `IN`:

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE budget > 1000000);
```

### 2. In the FROM clause — derived table

A subquery becomes a temporary table you query against:

```sql
SELECT dept, AVG(headcount)
FROM (
  SELECT dept_id AS dept, COUNT(*) AS headcount
  FROM employees
  GROUP BY dept_id
) t
GROUP BY dept;
```

The derived table must have an alias (`t`). Equivalent to a CTE — and CTEs are usually clearer; see the next lesson.

### 3. In the SELECT clause — scalar per row

```sql
SELECT e.name,
       (SELECT name FROM departments d WHERE d.id = e.dept_id) AS dept_name
FROM employees e;
```

Works but a JOIN is usually clearer.

## Correlated vs uncorrelated

**Uncorrelated**: the inner query doesn't reference the outer. Runs once.

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE name = 'Eng');
```

**Correlated**: the inner query references the outer. Conceptually runs *per outer row*. Watch for performance.

```sql
SELECT e.name
FROM employees e
WHERE e.salary > (SELECT AVG(salary)
                  FROM employees e2
                  WHERE e2.dept_id = e.dept_id);
-- "employees whose salary is above their department's average"
```

The inner query depends on `e.dept_id` (the outer row's dept). Engines may rewrite this as a join + window function for efficiency, but in interview-speak the complexity is `O(n²)` worst case.

## IN vs EXISTS vs JOIN

These three often produce the same result with different mechanics.

### IN
```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE budget > 1000000);
```

### EXISTS
```sql
SELECT name FROM employees e
WHERE EXISTS (SELECT 1 FROM departments d
              WHERE d.id = e.dept_id AND d.budget > 1000000);
```

### JOIN (DISTINCT to dedupe)
```sql
SELECT DISTINCT e.name
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE d.budget > 1000000;
```

For most workloads they perform similarly today (planners are smart). Stylistic guide:
- **EXISTS** when you just want to ask "is there a match?" — the inner can return anything, even `SELECT 1`.
- **IN** for short, readable list checks.
- **JOIN** when you need columns from both tables.

## NOT IN — the NULL trap

```sql
SELECT name FROM employees
WHERE dept_id NOT IN (SELECT id FROM closed_departments);
```

If any row in `closed_departments.id` is NULL, the whole result is empty. Because `x NOT IN (1, 2, NULL)` translates to `x != 1 AND x != 2 AND x != NULL`, and `x != NULL` is `UNKNOWN`, which is not TRUE.

**Fixes:**
- Use `NOT EXISTS` instead — handles NULLs sensibly.
- Filter NULLs in the subquery: `WHERE id IS NOT NULL`.

## ANY and ALL

```sql
WHERE salary > ANY (SELECT salary FROM employees WHERE dept_id = 10)
-- salary is greater than at least one engineer's salary

WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 10)
-- salary is greater than every engineer's salary (i.e. > MAX)
```

Rare in practice — usually a `MIN`/`MAX` or `EXISTS` reads more clearly.

## When NOT to use a subquery

- A join would be more efficient and clearer.
- The same logic is needed multiple times → use a CTE (next lesson) and reference it by name.
- Nested 3 levels deep — refactor into CTEs. Your interviewer will thank you.

## Common bugs

- **NOT IN with NULL** in the subquery → silently empty result.
- **Forgetting the derived-table alias** — `FROM (SELECT ...)` without `AS t` is a syntax error in standard SQL.
- **Correlated subquery in SELECT** firing per outer row — `O(n²)` blowups. Convert to a JOIN or window function.
- **`= (SELECT ...)`** when the subquery can return multiple rows — runtime error. Use `IN` or aggregate to one row.
