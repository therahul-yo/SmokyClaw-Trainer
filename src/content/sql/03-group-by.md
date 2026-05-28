---
id: sql-03-group-by
title: GROUP BY & HAVING — aggregating rows
track: sql
topic: aggregation
order: 3
estMinutes: 10
prerequisites: [sql-01-select]
pattern: sql-aggregation
---

# GROUP BY & HAVING

`GROUP BY` collapses rows that share a value. Aggregates (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) describe each group.

## The mental model

```sql
SELECT dept_id, COUNT(*) AS n, AVG(salary) AS avg_sal
FROM employees
GROUP BY dept_id;
```

1. Take all rows of `employees`.
2. Bucket them by `dept_id`.
3. Each bucket becomes one output row, with aggregate values computed over the bucket.

## The "one column per row" rule

Every column in the `SELECT` must either:
- Be in the `GROUP BY` clause, or
- Be wrapped in an aggregate function.

This is wrong:
```sql
SELECT dept_id, name, COUNT(*)    -- name is neither aggregated nor grouped
FROM employees GROUP BY dept_id;
```

Standard SQL rejects it. SQLite is lenient and will return a random row's `name` — but that "random" is undefined; never rely on it.

## The five core aggregates

| Function | Note |
|---|---|
| `COUNT(*)` | Count rows in the group. Counts NULLs. |
| `COUNT(col)` | Count non-NULL values of col. |
| `COUNT(DISTINCT col)` | Count distinct non-NULL values. |
| `SUM(col)` | Sum, ignoring NULLs. |
| `AVG(col)` | Average, ignoring NULLs. Returns NULL on empty group. |
| `MIN(col)` / `MAX(col)` | Min / max, ignoring NULLs. |

`COUNT(*)` vs `COUNT(col)` is a favorite interview gotcha. `*` counts every row. `col` skips NULLs in that column.

## HAVING — filtering groups

```sql
SELECT dept_id, COUNT(*) AS headcount
FROM employees
GROUP BY dept_id
HAVING COUNT(*) >= 5;
```

`WHERE` filters **rows** before grouping. `HAVING` filters **groups** after.

Order of operations: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.

So you can't use `SELECT` aliases in `WHERE` or `GROUP BY` (they don't exist yet), but you can in `HAVING` (in some engines), `ORDER BY` (everywhere), and `LIMIT`.

## GROUP BY multiple columns

```sql
SELECT dept_id, location, COUNT(*) AS n
FROM employees
GROUP BY dept_id, location;
```

Buckets by the combination — one row per unique `(dept_id, location)` pair.

## Aggregates without GROUP BY

```sql
SELECT COUNT(*), AVG(salary), MAX(salary) FROM employees;
```

When you aggregate without `GROUP BY`, the whole table is one group → one output row.

## Patterns

### Top N per group

The classic "top-3 paid employees per department." Pre-window-functions: use a correlated subquery or self-join. With window functions (covered later), `ROW_NUMBER()` + `WHERE rn <= 3` is cleaner.

### Distinct count per group

```sql
SELECT dept_id, COUNT(DISTINCT title) AS unique_titles
FROM employees
GROUP BY dept_id;
```

### Conditional aggregates (the SQL ternary)

```sql
SELECT dept_id,
       COUNT(*) AS total,
       SUM(CASE WHEN salary > 100000 THEN 1 ELSE 0 END) AS highly_paid,
       AVG(CASE WHEN gender = 'F' THEN salary END) AS avg_female_salary
FROM employees
GROUP BY dept_id;
```

`SUM(CASE WHEN ...)` is "count rows matching a condition per group." Indispensable for pivot-like reports.

## Common bugs

- **`SELECT` lists a column not in `GROUP BY`** — undefined in standard SQL; lenient in SQLite/MySQL.
- **`COUNT(col)` when you meant `COUNT(*)`** — silently undercounts rows where `col IS NULL`.
- **`WHERE COUNT(*) > 5`** — wrong; aggregates can't be in `WHERE`. Use `HAVING`.
- **Forgetting `GROUP BY` entirely** — and getting one row per group is collapsed to one row total.
- **`AVG` on integer columns** — in some engines truncates. Cast to float / use `AVG(col * 1.0)` if needed.
