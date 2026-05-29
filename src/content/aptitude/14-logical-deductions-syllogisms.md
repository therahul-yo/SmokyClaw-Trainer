---
id: aptitude-14-logical-deductions-syllogisms
title: Logical deductions, syllogisms & crypto-arithmetic
track: aptitude
topic: reasoning
order: 14
estMinutes: 20
prerequisites: [aptitude-00-absolute-zero]
---

# Logical deductions, syllogisms & crypto-arithmetic

In advanced reasoning rounds, hiring assessments evaluate your formal logic deduction capability under time constraints.

---

## 1. Syllogisms (Formal Logic)

A **Syllogism** is a three-part deductive argument consisting of major/minor statements (Premises) and a Conclusion.

### The 4 Quantifier Statements
1.  **A-Type (All A are B)**: Universal Affirmative.
2.  **E-Type (No A are B)**: Universal Negative.
3.  **I-Type (Some A are B)**: Particular Affirmative.
4.  **O-Type (Some A are not B)**: Particular Negative.

```text
  All A are B             No A are B             Some A are B
  +-----------+           +---+   +---+          +-----+---+-----+
  |  B        |           | A |   | B |          |  A  |   |  B  |
  |  +-----+  |           +---+   +---+          +-----+---+-----+
  |  |  A  |  |                                        |Both|
  |  +-----+  |                                        +----+
  +-----------+
```

### Core Solving Rules (Venn Diagram Method)
1.  Draw the **minimum overlap** diagram representing all premises.
2.  Draw any **alternative** diagrams that satisfy the premises but represent boundary cases.
3.  A conclusion is only **valid** if it holds true in **all possible** Venn diagrams.

---

## 2. Crypto-Arithmetic Puzzles

Crypto-Arithmetic is a mathematical puzzle where digits are replaced by letters. Each letter represents a unique digit from `0` to `9`, and no two letters can share the same digit.

```text
    S E N D
  + M O R E
  ---------
  M O N E Y
```

### Boundary Constraints (The Key to Solving)
*   **The Carry-Over Rule**: The maximum sum of two single-digit numbers is $9 + 9 = 18$ (or $19$ if there is a carry-over of $1$ from the previous column). Therefore, the carry-over digit to a new column is **always `1`**.
    *   In `SEND + MORE = MONEY`, `M` is a carry-over digit from the thousands column. Thus, **`M = 1`** instantly.
*   **The Overflow Limit**: Since `M = 1`, look at the thousands column: `S + M = O` (plus a possible carry-over).
    *   `S + 1 = O` (or `S + 1 + 1 = O` with carry).
    *   Since `M = 1` and `O` must be a single digit, and `S` can be at most `9`:
    *   If `S = 9`, then $9 + 1 = 10 \implies O = 0$.
    *   If `S = 8` (with carry), then $8 + 1 + 1 = 10 \implies O = 0$.
    *   Thus, **`O = 0`** and **`S = 9` (or `8`)**.

---

## 3. Matrix Grid Deductions

Grid deduction puzzles present a set of clues matching multiple variables (e.g. "5 programmers use 5 different operating systems and write in 5 different languages").

### Solving Discipline: The Elimination Table
Create a cross-reference grid of all variables.

```text
            | Python | Java | SQL | Linux | MacOS | Windows |
------------+--------+------+-----+-------+-------+---------+
Rahul       |   O    |  X   |  X  |   O   |   X   |    X    |
Sarah       |   X    |  O   |  X  |   X   |   O   |    X    |
...         |        |      |     |       |       |         |
```

*   **`X`** = Elimination (impossible combination based on clues).
*   **`O`** = Confirmation (proven combination).
*   *Rule*: When you place an `O` in a row/column subgrid, you must place `X` in all other remaining cells of that row/column.
*   *Trap*: Always re-read clues after filling parts of the grid. Confirmations often unlock previously unusable clues.
