---
id: sql-09-normalization
title: Normalization — 1NF, 2NF, 3NF, BCNF
track: sql
topic: normalization
order: 9
estMinutes: 10
prerequisites: [sql-02-joins]
pattern: sql-schema-design
---

# Normalization

A theory of how to structure schema to eliminate redundancy and update anomalies. In practice you aim for **3NF** (or BCNF) — every fact stored in exactly one place.

## Why bother

A denormalized table has the same fact stored in many places. Updates must touch every copy. Miss one and you get inconsistencies — "the dept manager is Alice here, but Bob there." Normalization removes the possibility.

## 1NF — atomic values

Every cell holds one value. No lists, no comma-separated strings.

**Violates 1NF:**
| id | name | phones |
|---|---|---|
| 1 | Alice | "555-1234, 555-5678" |

**Fix:** split into a child table.
```
employees(id, name)
phones(employee_id, phone)
```

Once you've ever needed to query "who has phone 555-1234?", you appreciate this. Without 1NF you'd be writing `LIKE '%555-1234%'` — slow and wrong (false positives like 555-1234-extra).

## 2NF — no partial dependency on a composite key

Applies when the primary key is composite. Every non-key column must depend on the **whole** key, not just part of it.

**Violates 2NF:**
```
order_items(order_id, product_id, quantity, product_name, product_price)
PK = (order_id, product_id)
```

`product_name` and `product_price` depend only on `product_id`, not the full key.

**Fix:** move them to a `products` table.
```
order_items(order_id, product_id, quantity)
products(product_id, product_name, product_price)
```

## 3NF — no transitive dependency

Non-key columns must not depend on other non-key columns.

**Violates 3NF:**
```
employees(id, name, dept_id, dept_name, dept_location)
```

`dept_name` depends on `dept_id`, not directly on `id`. If a department renames, you'd update every employee row.

**Fix:** split out departments.
```
employees(id, name, dept_id)
departments(id, name, location)
```

## BCNF — Boyce-Codd Normal Form

Stricter than 3NF — every functional dependency `A → B` must have `A` as a superkey. Rarely matters in interview-level schemas; if you reach 3NF you're usually fine.

## Denormalization — the controlled opposite

Sometimes you intentionally duplicate data for **performance**:

- Store `order.customer_name` so listing orders doesn't need a join.
- Maintain `posts.like_count` instead of `COUNT(*)` over likes per page load.
- Materialized views.

The price: update logic must keep duplicates in sync, usually via triggers or app code. Acceptable when reads dominate and you've measured.

**Rule of thumb:** normalize first. Denormalize selectively based on profiling, not vibes.

## Worked example

Bad schema:
```
sales(invoice_no, date, customer_id, customer_name, customer_email,
      product_id, product_name, product_price, qty, line_total)
```

Problems:
- Customer info repeats every line.
- Product info repeats every sale.
- `line_total = product_price * qty` is computable; storing it can drift.

Normalized:
```
customers(id, name, email)
products(id, name, price)
invoices(no, date, customer_id)
invoice_lines(invoice_no, line_no, product_id, qty)
```

Six rows of customer data instead of N×3 (where N is line count). Updates to a product price hit one row.

## What interviewers ask

1. **"What's 3NF?"** No non-key column depends on another non-key column.
2. **"Give an example where you'd denormalize."** Pre-aggregated counters for hot read paths; analytics tables that combine dim + fact for star schemas.
3. **"Design a schema for X"** (library, social network, e-commerce). Start with entities (nouns), give each its own table with an id, link related entities via foreign keys, factor out repeating groups.
4. **"What's the difference between 3NF and BCNF?"** BCNF is stricter; every determinant must be a superkey. In practice, identical for ~98% of schemas.
