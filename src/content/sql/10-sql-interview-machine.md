---
id: sql-10-interview-machine
title: SQL interview machine guide
track: sql
topic: interview-training
order: 10
estMinutes: 30
prerequisites: [sql-00-foundations]
pattern: sql-interview-machine
---

# SQL interview machine guide

SQL interviews test whether you can turn a business question into a correct
result table. The skill is not memorizing syntax. The skill is shaping rows
step by step.

Think like this:

```text
What is one row of the final answer?
Which table contains that row?
Which joins add missing facts?
Which filters remove rows?
Which grouping level is needed?
Do I need ranking without collapsing rows?
```

## Clause order mental model

The written order is:

```sql
SELECT
FROM
JOIN
WHERE
GROUP BY
HAVING
ORDER BY
LIMIT
```

The thinking order is:

1. `FROM` chooses the base rows.
2. `JOIN` adds related rows.
3. `WHERE` filters individual rows.
4. `GROUP BY` collapses rows into groups.
5. Aggregates calculate group values.
6. `HAVING` filters groups.
7. `SELECT` chooses final columns.
8. `ORDER BY` sorts the result.

If a query is confusing, write it in this thinking order.

## Final-row rule

Before writing SQL, answer:

```text
One row in the final result represents ______.
```

Examples:

| Question | Final row represents |
|---|---|
| Total revenue per customer | One customer |
| Highest paid employee per department | One department |
| Every order with customer name | One order |
| Users with zero posts | One user |
| Top 3 posts per country | One ranked post inside a country |

This prevents wrong grouping.

## Join discipline

### Inner join

Use when both sides must exist.

```sql
SELECT o.id, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

### Left join

Use when all left-side rows must remain.

```sql
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
```

Important: if you put a right-table filter in `WHERE`, you can accidentally
destroy the left join.

Risky:

```sql
WHERE o.status = 'delivered'
```

Safer for left joins:

```sql
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.status = 'delivered'
```

## Aggregation rules

If you use `GROUP BY`, every selected column should be either:

- in the `GROUP BY`, or
- inside an aggregate like `COUNT`, `SUM`, `MAX`, `MIN`, `AVG`.

Template:

```sql
SELECT
  c.id,
  c.name,
  COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY order_count DESC;
```

Use `COUNT(*)` when counting rows. Use `COUNT(column)` when NULL should not be
counted.

## WHERE vs HAVING

Use `WHERE` before grouping:

```sql
WHERE status = 'delivered'
```

Use `HAVING` after grouping:

```sql
HAVING COUNT(*) >= 2
```

If the condition uses an aggregate, it belongs in `HAVING`.

## Window function mental model

Window functions calculate values across related rows while keeping each row.

Use them when the question says:

- top N per group
- rank within department
- running total
- previous or next row
- percentage of group total

Template:

```sql
WITH ranked AS (
  SELECT
    d.name AS dept_name,
    e.name AS employee_name,
    e.salary,
    ROW_NUMBER() OVER (
      PARTITION BY d.id
      ORDER BY e.salary DESC
    ) AS rn
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT dept_name, employee_name, salary
FROM ranked
WHERE rn = 1;
```

`GROUP BY` collapses rows. Window functions keep rows.

## NULL rules

`NULL` means unknown or missing. It is not equal to anything.

Use:

```sql
WHERE department_id IS NULL
```

Do not use:

```sql
WHERE department_id = NULL
```

Use `COALESCE` when you need a default value:

```sql
COALESCE(total_orders, 0)
```

## Interview debugging checklist

When a SQL answer is wrong, check:

1. Did I choose the right final row?
2. Did a join multiply rows?
3. Did I need `LEFT JOIN` instead of `JOIN`?
4. Did `WHERE` accidentally remove NULL rows?
5. Did I group by the right key?
6. Did I use `COUNT(*)` vs `COUNT(column)` correctly?
7. Did I need a window function instead of grouping?
8. Is the result ordered exactly as requested?

## Explanation script

Say:

```text
The final result has one row per ____.
I start from ____ because it preserves those rows.
I join ____ to add ____.
I filter ____ before grouping.
I group by ____ because the aggregate is per ____.
Time depends on table size and indexes; the important access path is ____.
```

SQL interview strength is precision. If you can define the final row and defend
each clause, your query becomes much easier to trust.
