---
id: python-00-absolute-zero
title: Python bootcamp for absolute beginners
track: python
topic: basics
order: -1
estMinutes: 15
prerequisites: []
---

# Python bootcamp for absolute beginners

Welcome to absolute zero. If you have never programmed before, or if computers feel like a black box of magic, this is where you start.

To program a computer, you do not need to be a math genius. You just need to build a mental map of how the computer's memory behaves. Let's look at how computers store and look up data using physical world analogies.

---

## 1. Variables: The Mailbox Analogy

In the physical world, if you want to store a piece of paper (like a phone number), you put it in a box and write a label on it (like "John's Number").

In Python, we call this box a **variable**.

```python
phone_number = 99887766
```

Here is exactly what the computer does when it reads that line:
1. It looks at the right side of the `=` sign (`99887766`).
2. It reserves a physical spot in the computer's memory (RAM) to hold that number.
3. It looks at the left side of the `=` sign (`phone_number`).
4. It creates a label named `phone_number` and points it at that physical spot in memory.

> [!IMPORTANT]
> The `=` sign in programming does **not** mean "equal to" like in math. It is an **assignment operator**. It means: *"Evaluate what is on the right side first, and assign it to the label on the left side."*

---

## 2. Namespaces: The Drawer Dividers

If you have two boxes labeled "Rent Bill", one in your kitchen drawer and one in your office drawer, you don't get them confused because they are in different places.

In Python, these boundaries are called **Namespaces**.
A namespace is simply a directory of variable labels. Python uses different namespaces so you can reuse common names (like `x` or `temp`) in different parts of your program without them overwriting each other.

* **Global Namespace**: The main table containing all variables defined at the top level of your script.
* **Local Namespace**: A temporary list created inside a function. It only exists while the function is executing and is destroyed as soon as the function finishes.

---

## 3. The Filing Cabinet: Stack vs. Heap Memory

Think of your computer's memory as a large filing cabinet with two separate sections: the **Stack** and the **Heap**.

### The Stack: Quick Post-it Notes
The Stack is organized, fast, and strict. When you run a function, Python writes a quick list of local variable names on a Post-it note and sticks it to the Stack.
* It only stores the **variable label** and **primitive/small references**.
* Once the function is done, the Post-it note is ripped off and thrown away.

### The Heap: The Giant Storage Bin
The Heap is a giant, chaotic storage room where all complex values (like long lists, dictionaries, or text documents) are placed.
* When you create a list: `my_list = [10, 20, 30]`, the actual numbers `[10, 20, 30]` are placed in a cardboard box in the **Heap**.
* Python then writes down the *warehouse coordinate* of that box on the Stack's Post-it note.
* This warehouse coordinate is called a **reference** (or pointer).

```text
STACK (Labels)                   HEAP (Warehouse Objects)
+--------------+                 +---------------------+
| my_list      | --------------> | List Box: [10, 20]  |
+--------------+                 +---------------------+
```

---

## 4. Mutability: The Shared Box Trap

Because variables are labels pointing to warehouse boxes, multiple labels can point to the **same box**. This is where beginners write their first major bugs.

Look at this code:

```python
box_a = [1, 2, 3]
box_b = box_a
box_b.append(4)

print(box_a)
```

If you guess that `box_a` is `[1, 2, 3]`, you are incorrect. The output is:
`[1, 2, 3, 4]`

### Why did this happen?
1. `box_a = [1, 2, 3]` creates a list box in the Heap and points `box_a` to it.
2. `box_b = box_a` does **not** make a new list box. It copy-pastes the *reference coordinate*. Now, both `box_a` and `box_b` point to the *exact same box* in the Heap.
3. `box_b.append(4)` modifies (mutates) the box.
4. Since `box_a` points to the same box, reading `box_a` reveals the modification.

If you want a separate, independent copy of the box, you must explicitly tell Python to duplicate the box's contents:

```python
box_b = box_a.copy()
```

---

## 5. Review Exercises
1. What does the expression `x = x + 1` mean to the computer?
2. If `a = [5, 6]` and `b = a`, what is `a` after running `b[0] = 9`?
3. Where is the actual list content `[1, 2, 3]` stored: the Stack or the Heap?
