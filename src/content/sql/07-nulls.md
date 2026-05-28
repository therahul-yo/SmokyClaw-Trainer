---
id: sql-07-nulls
title: NULL semantics — the trap that catches everyone
track: sql
topic: nulls
order: 7
estMinutes: 8
prerequisites: [sql-01-select]
pattern: sql-nulls
---

# NULLs

NULL is not "zero" or "empty string." It's "unknown." Three-valued logic — every boolean expression is `TRUE`, `FALSE`, or `UNKNOWN`. SQL's NULL behavior is *the* most common source of "but my query looks right" bugs.

## The cardinal rule

**You can never compare NULL with `=` or `!=`.**

- `NULL = NULL` → `NULL` (NOT TRUE)
- `NULL != 5` → `NULL`
- `5 = NULL` → `NULL`
- `NULL < 5` → `NULL`

To test for NULL, use `IS NULL` / `IS NOT NULL`. Always.

```sql
WHERE manager_id = NULL          -- WRONG — never true
WHERE manager_id IS NULL         -- CORRECT
```

## WHERE only keeps TRUE rows

`UNKNOWN` is filtered out by `WHERE` — same as FALSE. This bites in negation:

```sql
SELECT * FROM employees WHERE manager_id != 5;
```

Employees with `manager_id = NULL` are NOT in the result. The condition is `UNKNOWN`, treated as FALSE. If you want them, add `OR manager_id IS NULL`.

## Aggregates ignore NULL — except COUNT(*)

```
SUM(col), AVG(col), MIN(col), MAX(col)  → skip NULLs
COUNT(col)                              → counts non-NULL values of col
COUNT(*)                                → counts all rows, including those with NULL columns
COUNT(DISTINCT col)                     → counts distinct non-NULL values
```

`AVG(col)` is `SUM/COUNT(col)` (over non-NULLs), not `SUM/COUNT(*)`. If most values are NULL, the average can be very different from what naive intuition expects.

**Empty group:** `AVG`, `SUM`, `MIN`, `MAX` return `NULL` (not zero or error). `COUNT(*)` returns `0`.

## Three-valued AND / OR

| AND | TRUE | FALSE | NULL |
|---|---|---|---|
| TRUE | TRUE | FALSE | NULL |
| FALSE | FALSE | FALSE | FALSE |
| NULL | NULL | FALSE | NULL |

| OR | TRUE | FALSE | NULL |
|---|---|---|---|
| TRUE | TRUE | TRUE | TRUE |
| FALSE | TRUE | FALSE | NULL |
| NULL | TRUE | NULL | NULL |

Memorize: `TRUE OR NULL = TRUE`, `FALSE AND NULL = FALSE`, otherwise propagate NULL.

## NULL in joins

A NULL on either side of `ON e.dept_id = d.id` does not match. This is why `LEFT JOIN` returns NULL on no-match — the join failed because NULL ≠ anything.

## NULL in NOT IN — the silent killer

```sql
SELECT * FROM employees
WHERE dept_id NOT IN (SELECT id FROM closed_departments);
```

If `closed_departments.id` contains a NULL, **the result is empty**. Because `x NOT IN (1, 2, NULL)` is `x != 1 AND x != 2 AND x != NULL`, and the last conjunct is UNKNOWN, so the whole thing can never be TRUE.

**Fix:** use `NOT EXISTS` (handles NULL sanely), or filter NULLs out of the subquery.

## NULL in ORDER BY

Different engines disagree. PostgreSQL puts NULLs last on `ASC` (use `NULLS FIRST` / `NULLS LAST` to override). MySQL and SQLite put NULLs first. Always specify if it matters.

## NULL in UNIQUE constraints

`UNIQUE (col)` allows multiple NULLs in most engines — two NULLs are not "equal." This is a common source of "wait, I have a UNIQUE constraint, how did this dup get in?"

## Useful NULL functions

| Function | Meaning |
|---|---|
| `COALESCE(a, b, c, ...)` | First non-NULL argument. |
| `IFNULL(a, b)` / `NVL(a, b)` | SQLite/MySQL/Oracle; same as `COALESCE(a, b)`. |
| `NULLIF(a, b)` | Returns NULL if `a = b`, else `a`. Niche but useful for "treat zero as NULL." |

```sql
SELECT name, COALESCE(nickname, name) AS display_name FROM users;
-- if nickname is NULL, fall back to name
```

## What interviewers ask

1. **"What does `NULL = NULL` return?"** NULL (not TRUE). Use `IS NULL`.
2. **"What does `COUNT(col)` vs `COUNT(*)` count?"** `col` skips NULLs; `*` counts every row.
3. **"Why is my `WHERE x != 5` missing rows?"** NULLs in `x` produce UNKNOWN, which `WHERE` filters out.
4. **"Why is my `NOT IN` returning no rows?"** NULL in the subquery.
5. **"How would you join two tables where the key might be NULL on both sides?"** With `e.k IS NOT DISTINCT FROM d.k` in Postgres, or `(e.k = d.k OR (e.k IS NULL AND d.k IS NULL))` in standard SQL.
