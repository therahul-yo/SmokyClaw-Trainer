---
id: sql-00-foundations
title: SQL foundations for interviews
track: sql
topic: basics
order: 0
estMinutes: 12
prerequisites: []
pattern: sql-foundations
---

# SQL foundations for interviews

SQL interviews test whether you can turn a business question into rows,
filters, joins, groups, and rankings. Start with the table model before jumping
to advanced queries.

## The table mental model

A table is a collection of rows. Each row has columns. A query transforms one or
more tables into a new result table.

```sql
SELECT column_name
FROM table_name
WHERE condition
ORDER BY column_name;
```

The execution idea is:

1. Choose the table with `FROM`.
2. Keep matching rows with `WHERE`.
3. Group rows if needed with `GROUP BY`.
4. Filter groups with `HAVING`.
5. Choose output columns with `SELECT`.
6. Sort with `ORDER BY`.

## Core building blocks

| Need | SQL tool |
|---|---|
| Pick columns | `SELECT` |
| Filter rows | `WHERE` |
| Combine tables | `JOIN` |
| Count or sum groups | `GROUP BY` |
| Filter grouped results | `HAVING` |
| Compare against another query | Subquery or CTE |
| Rank rows inside groups | Window function |
| Handle missing values | `NULL`, `COALESCE` |

## Interview query template

```sql
SELECT
  key_column,
  COUNT(*) AS total
FROM some_table
WHERE condition
GROUP BY key_column
HAVING COUNT(*) > 1
ORDER BY total DESC;
```

## Common traps

- `WHERE` filters rows before grouping; `HAVING` filters after grouping.
- `NULL` is not equal to anything, even another `NULL`.
- `COUNT(*)` counts rows; `COUNT(column)` ignores NULL values.
- A `LEFT JOIN` can become an accidental `INNER JOIN` if you filter the right
  table in `WHERE`.
- Window functions calculate values without collapsing rows.

## Recall hook

Think in result tables: every clause should explain how the result table is
being shaped.
