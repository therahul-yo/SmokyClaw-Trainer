---
id: sql-08-indexes
title: Indexes — making queries fast (intuition, not internals)
track: sql
topic: indexes
order: 8
estMinutes: 8
prerequisites: [sql-02-joins, sql-03-group-by]
pattern: sql-indexes
---

# Indexes

An index is a separate data structure (usually a B-tree) that lets the engine find rows by a column without scanning the whole table. Add one to a 10M-row table and a `WHERE column = ?` goes from seconds to milliseconds.

## The mental model

Picture a phone book sorted by last name. Finding "Patel" is `O(log n)` — binary search. Without the sort, you'd flip every page — `O(n)` full scan. An index gives a table that "sorted by last name" property without re-sorting the actual rows.

A typical B-tree index supports:
- Equality lookup: `WHERE col = x` → `O(log n)`.
- Range lookup: `WHERE col BETWEEN a AND b` → `O(log n + k)` for `k` matching rows.
- Sorted retrieval: `ORDER BY col` can skip the sort if the index already provides the order.

## Creating one

```sql
CREATE INDEX idx_employees_dept ON employees (dept_id);
CREATE UNIQUE INDEX idx_users_email ON users (email);
```

`UNIQUE INDEX` doubles as a uniqueness constraint.

## Composite (multi-column) indexes

```sql
CREATE INDEX idx_emp_dept_salary ON employees (dept_id, salary);
```

Sorted first by `dept_id`, then within each `dept_id` by `salary`. The **leftmost-prefix rule** governs which queries it accelerates:

- `WHERE dept_id = 5` → uses index ✓
- `WHERE dept_id = 5 AND salary > 100000` → uses index ✓
- `WHERE salary > 100000` → does NOT use this index (can't skip dept_id)
- `WHERE dept_id = 5 ORDER BY salary` → uses index, avoids sort ✓

Order matters when designing composite indexes — put the most selective equality column first.

## What makes a column a good index candidate

- **Frequently in WHERE / JOIN / ORDER BY clauses.**
- **High selectivity** (many distinct values). Indexing a `gender` column (~2 values) helps little — the engine may scan anyway.
- **Foreign keys.** Almost always index your FKs; joins to them are common.

## What indexes cost

Indexes are not free:

- **Write amplification.** Every `INSERT`/`UPDATE`/`DELETE` updates every index on the table.
- **Disk space.** A composite index on three columns can be ~30% of the table's size.
- **Plan complexity.** More indexes = more candidates the planner considers.

A table with 15 indexes can have inserts 5× slower than the same table with 2 well-chosen indexes. Don't index everything.

## When the index won't help

- **Functions on the column.** `WHERE LOWER(email) = 'x'` doesn't use an index on `email` (unless you have a *functional* index on `LOWER(email)`).
- **Leading wildcard.** `WHERE name LIKE '%smith'` can't use a B-tree index. `LIKE 'smith%'` can.
- **Type mismatch.** `WHERE int_col = '5'` may force a cast that disables the index in some engines.
- **`OR` across different columns** — engines may struggle. Split into a UNION of two indexed queries.
- **Small tables.** Below ~1000 rows, a full scan can beat an index lookup.

## Reading a query plan

```sql
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE dept_id = 5;
```

Look for: "USING INDEX" / "Index Scan" (good), "SCAN TABLE" / "Seq Scan" (table-wide read — bad if the table is big and you expected an index hit).

## What interviewers ask

1. **"Why is your slow query slow?"** Usually missing index on a WHERE/JOIN column.
2. **"What's the downside of adding more indexes?"** Slower writes, more space, plan complexity.
3. **"What order should I put columns in a composite index?"** Equality columns first, sorted by selectivity; range column last.
4. **"What's a covering index?"** One that contains every column the query needs, so the engine doesn't even visit the table. Often a big speedup.
5. **"Will `WHERE id = 5 OR name = 'x'` use my indexes?"** Sometimes — engines can do "index OR" via bitmap scans (Postgres) or merge them, but it depends. Often better to rewrite as a `UNION`.
