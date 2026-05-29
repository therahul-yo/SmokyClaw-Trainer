---
id: sql-00-absolute-zero
title: SQL bootcamp for absolute beginners
track: sql
topic: basics
order: -1
estMinutes: 15
prerequisites: []
---

# SQL bootcamp for absolute beginners

SQL (Structured Query Language) is the language we use to read and write information stored in databases.

If you have never worked with databases, they can seem complex. But a database is simply a highly organized digital **filing cabinet**. Let's build a physical model of how it works.

---

## 1. The Database as a Filing Cabinet

Imagine you run an online store. You have a physical **filing cabinet** labeled "Store Database".

Inside this filing cabinet, you keep folders. In SQL, these folders are called **Tables**.

* **Tables (Folders)**: You have one folder labeled `customers`, another folder labeled `orders`, and a third folder labeled `products`.
* **Rows (Sheets of Paper)**: Inside the `customers` folder, every customer has their own individual sheet of paper. Each sheet of paper represents a single **Row** (or record).
* **Columns (Blank Blanks on the Sheet)**: Every sheet of paper in the `customers` folder is printed with the exact same form fields: `first_name`, `email`, and `signup_date`. These fields are the **Columns**.

---

## 2. Keys: The Unique ID Label

In a physical filing cabinet, names can duplicate (you might have two customers named "Rahul"). To prevent mix-ups, you stamp a unique, sequential number at the top of each sheet of paper (e.g., `Customer ID: 101`).

In SQL, this is called the **Primary Key**.
* A Primary Key is a column that guarantees every row in that table is unique.

```text
CUSTOMERS TABLE (Folder)
+-------------+------------+-------------------+
| customer_id | first_name | email             | <--- Columns (Fields)
+-------------+------------+-------------------+
| 101         | Rahul      | rahul@domain.com  | <--- Row 1 (Sheet 1)
| 102         | Sarah      | sarah@domain.com  | <--- Row 2 (Sheet 2)
+-------------+------------+-------------------+
```

---

## 3. JOINs: Linking Folders Together

What happens when Rahul buys a product? Do we write Rahul's address and email directly on the order sheet?

No! If Rahul places 50 orders, we would have to copy his address 50 times. If he moves, we would have to find and change his address on all 50 sheets. That is a waste of paper and a recipe for bugs.

Instead, we use a **Relationship**.

Inside the `orders` folder, we create an order sheet that looks like this:
* `order_id`: `5001`
* `order_date`: `2026-05-29`
* `customer_id`: `101`  *(A reference pointing back to Customer ID 101)*

In SQL, the `customer_id` inside the `orders` table is called a **Foreign Key**. It is a string link tied from the `orders` folder back to the `customers` folder.

A **JOIN** query tells the database engine: *"Open the orders folder, grab sheet 5001, look at the customer_id tag, jump over to the customers folder, find sheet 101, and read the customer's name."*

```text
ORDERS TABLE                             CUSTOMERS TABLE
+----------+-------------+               +-------------+------------+
| order_id | customer_id |               | customer_id | first_name |
+----------+-------------+               +-------------+------------+
| 5001     | 101         | ------------> | 101         | Rahul      |
+----------+-------------+               +-------------+------------+
```

---

## 4. Review Exercises
1. What is the difference between a Table, a Row, and a Column?
2. Why do we store a `customer_id` on the order record instead of copying the customer's full address?
3. What makes a Primary Key different from a Foreign Key?
