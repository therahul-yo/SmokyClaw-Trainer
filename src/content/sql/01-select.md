---
id: sql-select
title: SELECT, WHERE, ORDER BY
track: sql
topic: select
order: 1
estMinutes: 10
prerequisites: []
---

# SELECT, WHERE, ORDER BY

The SQL track uses two seed databases:

- **`employees`** — `employees(id, name, department, salary, hired_at)` and `departments(id, name, location)`
- **`ecommerce`** — `customers`, `orders`, `products`, `order_items`

Every SQL drill in this app runs against one of these. Schemas are shown above the editor when you open a query.

## SELECT essentials

```sql
-- All columns, all rows
SELECT * FROM employees;

-- Specific columns
SELECT name, salary FROM employees;

-- Filter rows
SELECT name FROM employees WHERE salary > 50000;

-- Multiple conditions
SELECT name FROM employees
WHERE salary > 50000 AND department = 'Engineering';

-- Pattern match
SELECT name FROM employees WHERE name LIKE 'A%';   -- starts with A
SELECT name FROM employees WHERE name LIKE '%a';   -- ends with a
SELECT name FROM employees WHERE name LIKE '_a%';  -- second char is a

-- Membership
SELECT name FROM employees WHERE department IN ('Engineering', 'Sales');

-- Range
SELECT name FROM employees WHERE salary BETWEEN 40000 AND 60000;

-- NULL — IMPORTANT: never use `= NULL`, use `IS NULL`
SELECT name FROM employees WHERE department IS NULL;
SELECT name FROM employees WHERE department IS NOT NULL;
```

## ORDER BY

```sql
SELECT name, salary FROM employees ORDER BY salary DESC;
SELECT name FROM employees ORDER BY department, salary DESC;
```

## LIMIT (SQLite, MySQL, PostgreSQL)

```sql
SELECT name FROM employees ORDER BY salary DESC LIMIT 5;
SELECT name FROM employees ORDER BY salary DESC LIMIT 5 OFFSET 10;   -- skip 10, take 5
```

## DISTINCT

```sql
SELECT DISTINCT department FROM employees;
SELECT COUNT(DISTINCT department) FROM employees;
```

## Common MCQ traps

- `WHERE` is evaluated **before** `SELECT`, so you can't reference column aliases there.
- `ORDER BY` **can** use column aliases (it runs after SELECT).
- `NULL = NULL` is NULL, not TRUE. Always use `IS NULL`.
- `COUNT(*)` counts all rows; `COUNT(column)` skips NULLs.

Practice the SELECT/WHERE queries first — they're 40% of any SQL round.
