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

SQLite (this sandbox) supports INNER, LEFT, and CROSS. RIGHT and FULL are not implemented but can be simulated by flipping the tables or using `UNION`.

## Setup we'll use

Two tiny tables:

```
employees (id, name, dept_id)
  1, 'Alice', 10
  2, 'Bob',   20
  3, 'Cara',  NULL

departments (id, name)
  10, 'Eng'
  20, 'Sales'
  30, 'HR'
```

## INNER JOIN

```sql
SELECT e.name, d.name AS dept
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;
```

Result (intersection):
```
Alice  Eng
Bob    Sales
```

Cara is dropped (no dept). HR is dropped (no employees).

## LEFT JOIN

```sql
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;
```

Result (all employees, NULL on no match):
```
Alice  Eng
Bob    Sales
Cara   NULL
```

**Pattern: find rows in A with no match in B.**

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id
WHERE d.id IS NULL;       -- 'Cara'
```

The "anti-join" — left-join then filter for NULL on the right side. Common interview pattern.

## CROSS JOIN

```sql
SELECT e.name, d.name FROM employees e CROSS JOIN departments d;
```

Every combination — 3 × 3 = 9 rows. Useful for "generate all possible pairs" or padding a calendar table.

## JOIN order ≠ result order

These three are equivalent:

```sql
A INNER JOIN B ON ...
B INNER JOIN A ON ...
A, B WHERE A.x = B.y      -- old comma-join syntax; don't write this
```

For OUTER joins, order matters: `A LEFT JOIN B` ≠ `B LEFT JOIN A`. Use `LEFT` consistently and flip the table order rather than mixing LEFT and RIGHT.

## JOIN vs WHERE for the condition

```sql
-- correct: filter happens during the join
SELECT * FROM A LEFT JOIN B ON A.id = B.a_id AND B.flag = 1;

-- wrong-ish: filter happens AFTER the join, kills the outer-ness
SELECT * FROM A LEFT JOIN B ON A.id = B.a_id WHERE B.flag = 1;
```

Putting a B-side filter in `WHERE` of a `LEFT JOIN` turns it into an effective `INNER JOIN` (because NULL fails any equality test). Keep B-conditions inside the `ON` clause to preserve unmatched A rows.

## Multi-table joins

```sql
SELECT e.name, d.name AS dept, m.name AS manager
FROM employees e
JOIN departments d ON e.dept_id = d.id
JOIN employees m ON d.manager_id = m.id;
```

Each `JOIN` adds another table. Pick aliases that read naturally (`e`, `d`, `m`). Don't omit aliases — same-column-name collisions become unreadable fast.

## Self-join

A table joined to itself. Classic: "find employees who earn more than their manager."

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

Alias the table twice — once as `e` (employee), once as `m` (manager).

## Common mistakes

- **Forgetting the `ON` clause.** Without `ON`, INNER JOIN behaves like CROSS JOIN — Cartesian explosion.
- **Joining on the wrong key.** Especially when columns share names — `e.id = d.id` is almost never what you want; you usually want `e.dept_id = d.id`.
- **WHERE-filtering a LEFT JOIN's right side** and accidentally turning it into an inner.
- **Duplicate rows after a join.** Caused by one-to-many. Use `DISTINCT` or aggregate to dedupe.
- **`SELECT *` on a join** — ambiguous columns, brittle when the schema changes. Spell out columns.
