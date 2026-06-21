---
id: sql-11-worked-business-queries
title: Worked examples: SQL business queries
track: sql
topic: worked-examples
order: 13
estMinutes: 38
prerequisites: [sql-00-foundations, sql-10-interview-machine]
pattern: sql-worked-queries
---

# Worked examples: SQL business queries

SQL interviews often sound like product questions:

```text
Which customers spent the most?
Which departments have no employees?
What are the top posts per country?
```

The machine method is to define the final row first, then build the query.

## Example 1: Revenue per customer

Question:

```text
Return each customer and total delivered revenue.
```

### Final-row rule

One row represents one customer.

### Tables needed

```text
customers -> customer name
orders -> order status and customer_id
order_items -> quantity
products -> price
```

### Join path

```text
customers -> orders -> order_items -> products
```

### Query

```sql
SELECT
  c.name,
  SUM(oi.quantity * p.price) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'delivered'
GROUP BY c.id, c.name
ORDER BY revenue DESC;
```

### Why this works

Each joined row represents one product line in an order. Revenue for that line
is `quantity * price`. Grouping by customer collapses all delivered order lines
into one row per customer.

### Mistake rules

- If money comes from line items, do not sum product prices without quantity.
- Filter delivered orders before grouping.
- Group by the stable customer key, not only by display name.

## Example 2: Customers with zero delivered orders

Question:

```text
Return customers who have no delivered orders.
```

### Final row

One row per customer.

### Join decision

We must keep customers even when matching delivered orders do not exist.

Use `LEFT JOIN`.

### Query

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.status = 'delivered'
WHERE o.id IS NULL
ORDER BY c.name;
```

### Why the filter belongs in ON

If `o.status = 'delivered'` goes in `WHERE`, unmatched rows have `NULL` status
and are removed. That turns the left join into an accidental inner join.

### Mistake rule

For "without" questions, think anti-join:

```text
LEFT JOIN matching thing
WHERE matching thing id IS NULL
```

## Example 3: Highest paid employee per department

Question:

```text
Return the highest-paid employee in each department.
```

### Final row

One row per department.

### Why GROUP BY alone is risky

`MAX(salary)` gives the salary, but not necessarily the employee row that owns
that salary.

Use a window function.

### Query

```sql
WITH ranked AS (
  SELECT
    d.name AS department_name,
    e.name AS employee_name,
    e.salary,
    ROW_NUMBER() OVER (
      PARTITION BY d.id
      ORDER BY e.salary DESC, e.name
    ) AS rn
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department_name, employee_name, salary
FROM ranked
WHERE rn = 1
ORDER BY department_name;
```

### Why this works

`PARTITION BY d.id` restarts ranking inside each department. `rn = 1` keeps the
top row per department.

### Mistake rule

When you need a full row attached to a max/min value, consider ranking instead
of grouping only.

## Example 4: Top 3 posts per country

Question:

```text
Return the top 3 posts per country by like count.
```

### Final row

One ranked post inside one country.

### Query shape

1. Count likes per post.
2. Rank posts inside country.
3. Keep rank <= 3.

### Query

```sql
WITH post_likes AS (
  SELECT
    u.country,
    p.id AS post_id,
    p.body,
    COUNT(l.user_id) AS like_count
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN likes l ON l.post_id = p.id
  GROUP BY u.country, p.id, p.body
),
ranked AS (
  SELECT
    country,
    post_id,
    body,
    like_count,
    ROW_NUMBER() OVER (
      PARTITION BY country
      ORDER BY like_count DESC, post_id
    ) AS rn
  FROM post_likes
)
SELECT country, post_id, body, like_count
FROM ranked
WHERE rn <= 3
ORDER BY country, rn;
```

### Mistake rules

- Use `LEFT JOIN likes` if zero-like posts should still exist.
- Rank after aggregation, not before.
- Use a deterministic tie-breaker like `post_id`.

## SQL machine checklist

Before submitting any query:

```text
One final row represents what?
Did my base table preserve those rows?
Can any join multiply rows?
Should unmatched rows survive?
Am I filtering rows or groups?
Do I need ranking instead of grouping?
Is ordering exactly requested?
```

SQL becomes mechanical when every clause has a reason.
