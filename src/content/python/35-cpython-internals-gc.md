---
id: python-35-cpython-internals-gc
title: CPython internals & garbage collection
track: python
topic: advanced-python
order: 35
estMinutes: 25
prerequisites: [python-11-oop]
---

# CPython internals & garbage collection

To turn your Python code into an interview-solving machine, you must understand how Python's default runtime, **CPython**, manages your objects, operates memory layouts, and collects garbage under the hood.

---

## 1. The Anatomy of a `PyObject`

In CPython, every object is wrapped in a C structure called `PyObject` (or `PyVarObject` for variable-length items like lists or strings).

```c
typedef struct _object {
    _PyObject_HEAD_EXTRA // doubly linked list pointer for GC tracking
    Py_ssize_t ob_refcnt; // Reference count
    struct _typeobject *ob_type; // Pointer to object's type
} PyObject;
```

When you define `x = 42`, the computer allocates a `PyObject` containing:
1. **Reference Count (`ob_refcnt`)**: An integer tracking how many labels point to this value.
2. **Type Pointer (`ob_type`)**: Points to the `<class 'int'>` type object.
3. **Value Payload**: The actual bytes representing the integer value `42`.

---

## 2. Integer and String Interning (Caching)

To optimize memory, CPython caches and reuses small, immutable objects.

### Small Integer Caching
During startup, CPython allocates an array of integer objects for values from **`-5` to `256`** inclusive.
When you write:
```python
a = 100
b = 100
print(a is b) # True -> pointing to the exact same cached object
```
However:
```python
x = 300
y = 300
print(x is y) # False -> two separate objects allocated in memory
```

### String Interning
CPython automatically interns string literals that look like identifiers (alphanumeric and underscores). This allows CPython to compare strings using quick pointer comparison (`is`) instead of character-by-character scans (`==`).

---

## 3. Dynamic Structure Internals

How do Python's main containers scale and manage their allocations?

### How Lists Resize
A Python list is a wrapper around a contiguous array of C pointers. When you `append()` to a list, CPython does not allocate memory for just one single element. Instead, it **over-allocates** to ensure subsequent appends are `O(1)` amortized time.

The growth formula in CPython is roughly:
$$\text{new\_allocated} = \text{new\_size} + (\text{new\_size} \gg 3) + (\text{new\_size} < 9 \,?\, 3 \,:\, 6)$$
If a list grows past its allocated capacity, CPython allocates a new chunk of memory, copies the pointers over, and frees the old block.

### How Dictionaries Work (Hash Tables)
Python dictionaries are highly optimized hash tables.
1. **Hash Code**: Python computes `hash(key)`.
2. **Bucket Mapping**: It maps the hash code to an index in an underlying sparse array (using open addressing for collision resolution).
3. **Open Addressing**: If a collision occurs, CPython uses a perturbation recurrence formula to jump to other indices:
   $$\text{next\_index} = (5 \times \text{index} + 1 + \text{perturb}) \pmod{\text{mask}}$$
4. **Resizing**: Dicts resize when they are 2/3 full (load factor $\approx 0.66$) to prevent collision cascades.

---

## 4. Reference Counting: The First Line of Defense

CPython's primary memory management system is **Reference Counting**.

* Every time you point a variable, list element, or class field to an object, its `ob_refcnt` increases by 1.
* Every time a variable goes out of scope, is deleted (`del`), or gets reassigned, the reference count decreases by 1.
* As soon as an object's `ob_refcnt` hits **`0`**, CPython immediately deallocates the memory.

```python
import sys

a = [1, 2, 3]
print(sys.getrefcount(a) - 1) # Expected: 1 (retaining temporary ref in getrefcount)
b = a
print(sys.getrefcount(a) - 1) # Expected: 2 (both a and b point to the list)
```

---

## 5. Generational Garbage Collection: Handling Cycles

Reference counting cannot handle **reference cycles** (objects that point to each other).

```python
class Node:
    def __init__(self):
        self.ref = None

x = Node()
y = Node()
x.ref = y
y.ref = x

del x
del y
```
* Even though variables `x` and `y` are gone, the objects are unreachable, but their reference counts are still `1` because they point to each other.
* This is a memory leak. CPython resolves this using the **Generational Garbage Collector** (`gc`).

### The Three Generations
The GC groups objects into three generations based on survival:
* **Generation 0**: Newly allocated objects. Checked frequently.
* **Generation 1**: Objects that survived Gen 0 collection. Checked less frequently.
* **Generation 2**: Long-lived objects (survived Gen 1). Checked rarely.

### How Cyclic Detection Works
The GC looks at objects in a generation. It temporarily copies all reference counts, then traverses the objects and *subtracts* reference counts that come from internal references within the group. 
Any object whose reference count drops to `0` after subtracting internal references is unreachable outside the group and is marked for deletion.

---

## 6. Practical Tuning for Interviews
* **Disabling GC**: In high-throughput, short-lived CLI tasks (or certain execution runtimes like competitive programming templates), importing `gc` and running `gc.disable()` can speed up execution by 5-10% by avoiding collection pauses.
* **Avoiding Cycles**: Use the `weakref` module (`weakref.ref` or `weakref.proxy`) to refer to parent/sibling nodes without incrementing reference counts, preventing cycle locks entirely.
