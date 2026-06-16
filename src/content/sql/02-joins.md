---
id: sql-02-joins
title: JOINs — INNER, LEFT, RIGHT, FULL, CROSS
track: sql
topic: joins
order: 2
estMinutes: 12
prerequisites: [sql-01-select]
pattern: sql-joins
---

# JOINs

A JOIN combines rows from two (or more) tables based on a related column. Get this right and most "intermediate" SQL questions collapse.

## The five join types

Given tables `A` and `B`:

| Join | Returns |
|---|---|
| `INNER JOIN` | Rows where A and B match (intersection). |
| `LEFT JOIN` | All A rows; B columns NULL where no match. |
| `RIGHT JOIN` | All B rows; A columns NULL where no match. |
| `FULL OUTER JOIN` | All rows from both; NULLs where the other side is missing. |
| `CROSS JOIN` | Cartesian product — every A × every B. |

This sandbox runs a recent SQLite (≥3.39), so **all five join types work**, including `RIGHT JOIN` and `FULL OUTER JOIN`. (Older SQLite only supported INNER/LEFT/CROSS, which is why you'll still see advice to "simulate RIGHT by flipping the tables" — no longer necessary here.)

## The tables we'll use

This track ships a real `employees` database you can run every query against:

```
departments (id, name, location)
  1, 'Engineering', 'Bangalore'
  2, 'Sales',       'Chennai'
  3, 'Marketing',   'Mumbai'
  4, 'Finance',     'Delhi'
  5, 'HR',          'Pune'        -- intentionally has no employees

employees (id, name, department, department_id, salary, hired_at)
  1, 'Alice', 'Engineering', 1, 75000, ...
  ...
  6, 'Frank', NULL,          NULL, 30000, ...   -- no department
  ...
```

The link is `employees.department_id = departments.id`. Frank has a NULL
`department_id` (no department); HR has no matching employees. Those two
"missing" cases are exactly what the outer joins below expose.

## INNER JOIN

```sql
SELECT e.name, d.name AS dept
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
ORDER BY e.id;
```

Result (intersection):
```
Alice  Engineering
Bob    Sales
Carol  Engineering
...
```

Frank is dropped (no department). HR is dropped (no employees). An INNER JOIN
keeps only rows that match on **both** sides.

## LEFT JOIN

```sql
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY e.id;
```

Result (all employees, NULL on no match):
```
Alice  Engineering
...
Frank  NULL
...
```

Every employee appears; Frank's `dept` is NULL because his `department_id` matches
nothing.

**Pattern: find rows in A with no match in B (the anti-join).** Here, departments
with no employees:

```sql
SELECT d.name
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
WHERE e.id IS NULL;       -- 'HR'
```

Left-join, then filter for NULL on the right side. A staple interview pattern —
"customers with no orders", "products never sold", and so on.

## RIGHT JOIN and FULL OUTER JOIN

`RIGHT JOIN` keeps all rows of the *right* table; it's a mirror of `LEFT JOIN`.
This keeps every department (HR included, with NULL employee):

```sql
SELECT d.name AS dept, e.name
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id
ORDER BY d.id, e.id;       -- HR appears with a NULL name
```

`FULL OUTER JOIN` keeps unmatched rows from **both** sides at once — every
employee *and* every department, NULLs where either side is missing:

```sql
SELECT e.name, d.name AS dept
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.id
ORDER BY e.id;             -- Frank (no dept) AND HR (no employee) both show up
```

In practice most people write everything as `LEFT JOIN` for consistency — `A RIGHT JOIN B` is just `B LEFT JOIN A`.

## CROSS JOIN

```sql
SELECT e.name, d.name FROM employees e CROSS JOIN departments d;
```

Every combination — 8 employees × 5 departments = 40 rows. Useful for "generate
all possible pairs" or padding a calendar/grid table.

## JOIN order ≠ result order

These three are equivalent:

```sql
A INNER JOIN B ON ...
B INNER JOIN A ON ...
A, B WHERE A.x = B.y      -- old comma-join syntax; don't write this
```

For OUTER joins, order matters: `A LEFT JOIN B` ≠ `B LEFT JOIN A`. Pick `LEFT`
consistently and flip the table order rather than mixing LEFT and RIGHT.

## JOIN vs WHERE for the condition

```sql
-- correct: filter happens DURING the join, outer rows preserved
SELECT * FROM departments d
LEFT JOIN employees e ON e.department_id = d.id AND e.salary > 60000;

-- wrong-ish: filter happens AFTER the join, kills the outer-ness
SELECT * FROM departments d
LEFT JOIN employees e ON e.department_id = d.id WHERE e.salary > 60000;
```

Putting a B-side filter in the `WHERE` of a `LEFT JOIN` turns it into an effective
`INNER JOIN` (because NULL fails any comparison). Keep B-conditions inside the
`ON` clause to preserve unmatched A rows.

## Multi-table joins (and self-joins)

Each additional `JOIN` brings in another table. A table can even be joined to
**itself** — alias it twice. This finds same-department coworker pairs and labels
the department, using `employees` twice plus `departments`:

```sql
SELECT e.name AS employee, c.name AS coworker, d.name AS dept
FROM employees e
JOIN employees c ON e.department_id = c.department_id AND e.id < c.id
JOIN departments d ON e.department_id = d.id
ORDER BY e.id, c.id;
```

The `e.id < c.id` condition pairs each person with later colleagues only — without
it you'd get every pair twice plus everyone paired with themselves. Pick aliases
that read naturally (`e`, `c`, `d`); never omit them on a self-join or the columns
become hopelessly ambiguous.

## Common mistakes

- **Forgetting the `ON` clause.** Without `ON`, INNER JOIN behaves like CROSS JOIN — Cartesian explosion.
- **Joining on the wrong key.** Especially when columns share names — `e.id = d.id` is almost never what you want; you want `e.department_id = d.id`.
- **WHERE-filtering a LEFT JOIN's right side** and accidentally turning it into an inner join.
- **Duplicate rows after a join.** Caused by one-to-many. Use `DISTINCT` or aggregate to dedupe.
- **Self-join without an inequality** (`e.id < c.id`) — you get mirror duplicates and self-pairs.
- **`SELECT *` on a join** — ambiguous columns, brittle when the schema changes. Spell out columns.
