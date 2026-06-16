---
id: sql-14-set-operations
title: Set operations — UNION, INTERSECT, EXCEPT
track: sql
topic: set-operations
order: 14
estMinutes: 11
prerequisites: [sql-01-select]
pattern: sql-advanced
---

# Set operations

JOINs combine tables **side by side** (adding columns). Set operations stack the
results of two queries **on top of each other** (combining rows). They answer
"give me everything in A or B", "only what's in both", "what's in A but not B".

## The four operators

| Operator | Returns | Duplicates |
|---|---|---|
| `UNION` | Rows in **either** query | removed (distinct) |
| `UNION ALL` | Rows in **either** query | **kept** |
| `INTERSECT` | Rows in **both** queries | removed |
| `EXCEPT` | Rows in the first **but not** the second | removed |

`EXCEPT` is called `MINUS` in Oracle; everything else is standard. SQLite (this
sandbox) supports all four.

## The compatibility rule

Both queries must produce the **same number of columns**, in the same order, with
compatible types. The result takes its column **names from the first** query:

```sql
SELECT name FROM employees          -- 1 column
UNION
SELECT name, salary FROM employees; -- 2 columns  ->  ERROR: SELECTs do not have
                                    --                the same number of result columns
```

Match the column lists and you're fine; mismatch and the database rejects the
whole statement before running it.

## UNION vs UNION ALL

`UNION` does a distinct pass over the combined rows — extra work. If you *know*
the two sets can't overlap, or you don't care about duplicates, `UNION ALL` is
faster because it skips deduplication:

```sql
-- distinct departments that match EITHER condition
SELECT department FROM employees WHERE salary > 50000
UNION
SELECT department FROM employees WHERE hired_at >= '2024-01-01'
ORDER BY department;
```

```sql
-- keeps every row, including repeats across the two halves
SELECT department FROM employees WHERE salary > 70000
UNION ALL
SELECT department FROM employees WHERE salary < 40000
ORDER BY department;
```

The first collapses any department that satisfies both conditions to a single
row; the second keeps Engineering twice if two queries each surface it.

> NULLs are treated as **equal to each other** for deduplication here — two NULL
> rows collapse to one under `UNION`/`INTERSECT`/`EXCEPT`, unlike the usual
> `NULL = NULL → unknown` rule in `WHERE`.

## EXCEPT — the "anti" set

Rows in the first query that are **absent** from the second. Classic use:
"which departments have no employees?"

```sql
SELECT id FROM departments
EXCEPT
SELECT department_id FROM employees;     -- 5 (HR)
```

This is an alternative to the `LEFT JOIN ... WHERE IS NULL` anti-join from the
JOINs lesson — same answer, often more readable when both sides are single
columns.

## INTERSECT — what's common

Rows present in **both** queries. "Which departments have both a high earner and
a low earner?"

```sql
SELECT department_id FROM employees WHERE salary >= 70000
INTERSECT
SELECT department_id FROM employees WHERE salary <= 50000;   -- 1 (Engineering)
```

Engineering qualifies because it contains Carol (92000) *and* Hugo (50000).

## ORDER BY goes last — once

A set operation produces a single combined result, so a trailing `ORDER BY`
sorts the **whole** thing and may appear only at the very end (not inside either
half):

```sql
SELECT name FROM employees WHERE department = 'Sales'
UNION
SELECT name FROM employees WHERE department = 'Finance'
ORDER BY name;        -- sorts the merged result
```

## Set ops vs JOIN vs OR

- Combining **columns** from related tables → **JOIN**.
- Combining **rows** from union-compatible queries → **set operation**.
- "Either condition" on one table can often be a simple `WHERE a OR b` — reach
  for `UNION` when the two halves come from genuinely different queries (different
  tables, different shapes) or when you specifically want the distinct pass.

## Common mistakes

- **Column count / order mismatch** — the most frequent error; the two SELECTs
  must align positionally, not by name.
- **`UNION` when you meant `UNION ALL`** — silently dropping legitimate duplicate
  rows (e.g. losing repeated transactions), plus a needless sort.
- **`ORDER BY` inside a branch** — it belongs only at the end, governing the
  whole result.
- **Assuming `EXCEPT`/`INTERSECT` are symmetric** — `A EXCEPT B ≠ B EXCEPT A`.
  `INTERSECT` is symmetric; `EXCEPT` is directional.
- **Forgetting NULLs collapse** — set operators dedupe NULLs together, which can
  surprise you if a NULL row appears on both sides.
