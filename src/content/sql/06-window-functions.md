---
id: sql-06-window-functions
title: Window functions
track: sql
topic: window-functions
order: 6
estMinutes: 12
prerequisites: []
pattern: sql-window
---

# Window functions

Window functions are the senior-round filter. They let you compute aggregates *without collapsing rows* — every output row gets a value computed over a "window" of related rows.

## The shape

```sql
SELECT col1, col2,
       <fn>(...) OVER (
         PARTITION BY ...   -- the group, optional
         ORDER BY ...       -- the order inside the group, optional
         <frame clause>     -- ROWS/RANGE, optional
       ) AS derived
FROM ...
```

## The interview-essential functions

| Function | What it does |
|---|---|
| `ROW_NUMBER()` | 1, 2, 3, ... within partition. Unique. |
| `RANK()` | 1, 2, 2, 4, ... — ties share rank, leaves gaps. |
| `DENSE_RANK()` | 1, 2, 2, 3, ... — ties share rank, no gaps. |
| `LAG(col, n)` | Value `n` rows before in the partition. |
| `LEAD(col, n)` | Value `n` rows after in the partition. |
| `SUM/AVG/MIN/MAX(col) OVER (...)` | Running aggregate over the frame. |
| `NTILE(n)` | Buckets rows into `n` quantiles. |
| `FIRST_VALUE / LAST_VALUE` | First / last value in the frame. |

## Classic examples

### Top N per group

"Top 2 highest-paid employees per department":

```sql
SELECT name, department, salary
FROM (
  SELECT name, department, salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
  FROM employees
) t
WHERE rn <= 2;
```

### Running total

"Cumulative posts per user over time":

```sql
SELECT user_id, posted_at,
       COUNT(*) OVER (PARTITION BY user_id ORDER BY posted_at) AS posts_so_far
FROM posts;
```

### Day-over-day change with LAG

```sql
SELECT posted_at,
       COUNT(*) AS daily,
       COUNT(*) - LAG(COUNT(*), 1) OVER (ORDER BY posted_at) AS delta
FROM posts
GROUP BY posted_at;
```

## Frame clauses (worth knowing once)

The default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` when `ORDER BY` is present. That's why `SUM(...) OVER (ORDER BY ...)` gives a running total.

`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` would give a 3-row trailing average — useful for moving averages.

## When window functions over GROUP BY

If you need both the original row data **and** an aggregate, you want a window function. `GROUP BY` collapses rows; windows preserve them. Choose `GROUP BY` only when the per-row data is genuinely uninteresting.
