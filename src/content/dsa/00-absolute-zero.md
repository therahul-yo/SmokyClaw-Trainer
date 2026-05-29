---
id: dsa-00-absolute-zero
title: DSA bootcamp for absolute beginners
track: dsa
topic: basics
order: -1
estMinutes: 15
prerequisites: []
---

# DSA bootcamp for absolute beginners

Data Structures and Algorithms (DSA) sounds intimidating, but it is actually the most mechanical, physical part of programming.

Before you write code, you need to understand that data structures are physical shapes in computer memory, and algorithms are the physical instructions for moving things around those shapes. Let's build a clean, physical mental model.

---

## 1. Memory as a Grid of Lockers

Imagine a warehouse with a giant wall of numbered storage lockers. Each locker holds exactly one piece of data (like a number or a letter) and has a unique address (like `101`, `102`, `103`).

```text
+-----+-----+-----+-----+-----+
| 101 | 102 | 103 | 104 | 105 |
+-----+-----+-----+-----+-----+
| 10  | 20  | 30  | 40  | 50  |
+-----+-----+-----+-----+-----+
```

* A **pointer** (or reference) is just a label containing the locker number.
* A **data structure** is how we choose to reserve and organize these lockers.

---

## 2. The Array: A Contiguous Conveyor Belt

An **Array** is a reserved block of consecutive lockers. If you create an array of size 5, the computer guarantees that it will reserve 5 lockers right next to each other (e.g., lockers `101` to `105`).

### The Formula of Instant Access
Because they are right next to each other, looking up *any* index is instant. If the array starts at address `start` (`101`) and each locker takes `1` byte, the address of index `i` is simply:
$$\text{Address} = \text{start} + i$$
This is why looking up an array value (like `arr[3]`) is immediate. It doesn't matter if the array has 5 items or 5 million items; the CPU calculates the address and opens the locker in one single step.

### The Downside: No Resizing
If locker `106` is already owned by another program, you cannot grow your array! If you want to add a 6th item, you must find a new spot in the warehouse that has 6 empty lockers in a row, copy all your items over, and delete the old array. This is what a **Dynamic Array** (like a Python `list` or C++ `vector`) does under the hood.

---

## 3. Big O Notation: The Deck of Cards

When we analyze algorithms, we don't count seconds (since a faster computer runs the same code faster). Instead, we count the **number of steps** relative to the number of input items ($n$). We call this **Big O complexity**.

Let's represent input items ($n$) as a deck of $n$ physical playing cards.

### O(1) - Constant Time: "Instant Lookup"
* **Action**: Draw the top card of the deck.
* **Why**: It takes exactly 1 step. It does not matter if the deck has 10 cards or 10,000 cards; drawing the top card is instant.

### O(n) - Linear Time: "The Single Scan"
* **Action**: Scan through the deck card-by-card to find the Ace of Spades.
* **Why**: If you have 10 cards, you might have to scan up to 10 cards (worst case). If you have 1,000 cards, you might scan up to 1,000 cards. The steps grow proportionally to the number of cards.

### O(n²) - Quadratic Time: "The Pairwise Check"
* **Action**: Check if there is any duplicate card in the deck.
* **Why**: For every card in the deck, you must loop through the *entire* deck again to compare it. If you have 10 cards, you do $10 \times 10 = 100$ steps. If you have 1,000 cards, you do $1,000 \times 1,000 = 1,000,000$ steps! Avoid $O(n^2)$ algorithms whenever possible.

---

## 4. Review Exercises
1. Why is looking up `arr[5000]` just as fast as looking up `arr[0]`?
2. If an algorithm takes $O(n)$ steps, and $n$ doubles, how many steps does the algorithm take relative to before?
3. If an algorithm takes $O(n^2)$ steps, and $n$ doubles, what happens to the number of steps?
