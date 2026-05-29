---
id: sql-12-transactions-isolation-mvcc
title: SQL transactions, locks & MVCC
track: sql
topic: advanced-sql
order: 12
estMinutes: 25
prerequisites: [sql-00-sql-foundations]
pattern: transactions
---

# SQL transactions, locks & MVCC

Understanding how databases manage concurrent modifications, isolation levels, and locking mechanisms is essential for designing resilient database architectures.

---

## 1. Concurrency Anomalies

When multiple transactions read and write to the same table rows concurrently, several anomalies can occur:

*   **Dirty Read**: Transaction A reads data modified by Transaction B, but Transaction B subsequently rolls back. Transaction A acted on uncommitted data.
*   **Non-repeatable Read**: Transaction A reads a row. Transaction B updates that row and commits. Transaction A reads the row again and finds different values.
*   **Phantom Read**: Transaction A runs a query scanning a range of rows (e.g. `WHERE age > 30`). Transaction B inserts a *new* row satisfying the criteria and commits. Transaction A re-runs the query and finds a new "phantom" row that was not there before.

---

## 2. Transaction Isolation Levels

To protect against these anomalies, SQL standard defines four transaction isolation levels. High isolation levels provide correctness but restrict concurrency and throughput.

| Isolation Level | Dirty Read | Non-repeatable Read | Phantom Read | Mechanism (Typical) |
| :--- | :---: | :---: | :---: | :--- |
| **Read Uncommitted** | Allowed | Allowed | Allowed | No locks or isolation |
| **Read Committed** | Prevented | Allowed | Allowed | Short-lived read locks / MVCC |
| **Repeatable Read** | Prevented | Prevented | Allowed | Long-held read locks / MVCC |
| **Serializable** | Prevented | Prevented | Prevented | Strict 2-Phase Locking or SSI |

*PostgreSQL's default is Read Committed. SQLite default is Serializable.*

---

## 3. Concurrency Control: 2-Phase Locking vs. MVCC

Relational engines use one of two primary strategies to handle concurrent reads and writes:

### A. Two-Phase Locking (2PL)
Reads and writes use locks to block each other.
*   **Shared Lock (S)**: Required to read a row. Multiple transactions can hold shared locks on the same row.
*   **Exclusive Lock (X)**: Required to write/update a row. Only one transaction can hold it, blocking both readers and other writers.
*   *Rule*: **Readers block Writers, and Writers block Readers.** This can cause severe performance bottlenecks on highly concurrent systems.

### B. Multi-Version Concurrency Control (MVCC)
Instead of locking a row, the database keeps **multiple versions of the same row** in storage.
*   When a row is updated, a new version is written with transaction timestamps.
*   Each transaction is assigned a read-timestamp snapshot upon start. When reading, it traverses the row versions and only reads the version that was committed *before* its snapshot timestamp.
*   *Rule*: **Readers never block Writers, and Writers never block Readers.**

---

## 4. MVCC Internals in PostgreSQL

Every table row in Postgres contains hidden metadata columns:
*   **`xmin`**: The transaction ID that inserted this row version.
*   **`xmax`**: The transaction ID that deleted or updated this row version (set to `0` if active).

```text
Row Storage Page on Disk
+---------------------+-------------------+----------+----------+
| Data Payload        | Customer Name     | xmin     | xmax     |
+---------------------+-------------------+----------+----------+
| Row Version 1 (Old) | Rahul (Apt 10)    | Tx 1001  | Tx 1005  | <--- Visible to old Tx
| Row Version 2 (New) | Rahul (Apt 12)    | Tx 1005  | Tx 0     | <--- Visible to new Tx
+---------------------+-------------------+----------+----------+
```

When Transaction 1005 runs `UPDATE customers SET address = 'Apt 12'`:
1.  It does not overwrite Version 1 on disk.
2.  It sets `xmax` of Version 1 to `1005` (marking it deleted).
3.  It inserts a new Row Version 2 containing `'Apt 12'`, with `xmin` set to `1005`.
4.  Older transactions running before Tx 1005 can still read Version 1 without blocking.
5.  An offline process called **VACUUM** sweeps the table pages later to clean up and delete dead row versions (like Version 1) once no transactions require them.

---

## 5. Explicit Locking in SQL

Sometimes you need to manually force locks to prevent race conditions (like checking account balance before deducting money).

### Select For Update (Exclusive Lock)
```sql
BEGIN;
SELECT balance FROM accounts WHERE account_id = 5 FOR UPDATE;
-- This blocks any other transaction from reading with FOR UPDATE or modifying this row
UPDATE accounts SET balance = balance - 100 WHERE account_id = 5;
COMMIT; -- Locks are automatically released when transaction ends
```

### Select For Share (Shared Lock)
```sql
SELECT * FROM parent_table WHERE id = 10 FOR SHARE;
-- Ensures the parent row cannot be deleted while we are inserting child rows
```
