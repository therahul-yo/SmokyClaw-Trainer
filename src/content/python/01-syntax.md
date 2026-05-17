---
id: python-syntax
title: Python Syntax & Identifiers
track: python
topic: syntax
order: 1
estMinutes: 10
prerequisites: []
---

# Python Syntax & Identifiers

Python is the language TCS, Infosys, and Wipro accept for almost every coding round. The syntax is forgiving compared to C/Java, but a handful of rules trip up freshers in MCQ tests. This lesson covers the absolute basics — keywords, identifiers, indentation, comments — that show up in **every** TCS NQT and Infosys aptitude paper's "programming logic" section.

## Why this matters

Service-company tests don't just ask "write code". They also ask:

- *Which of these is a valid Python identifier?*
- *What is the output of `print(2 ** 3 ** 2)`?*
- *Which keyword cannot be used as a variable name?*

Answering these in 30 seconds requires fluency, not understanding. So memorize the rules.

## Identifiers

An identifier is a name you give to a variable, function, class, or module.

**Rules:**

1. Must start with a letter (a-z, A-Z) or underscore `_`.
2. Subsequent characters can include letters, digits, or underscores.
3. **Cannot** start with a digit.
4. **Cannot** contain spaces or special characters (`-`, `@`, `$`, etc.).
5. **Cannot** be a reserved keyword (`class`, `def`, `if`, `for`, ...).
6. Case-sensitive: `Name` and `name` are different identifiers.

**Valid:** `name`, `_var`, `var_1`, `MAX_VALUE`, `__init__`

**Invalid:** `1var` (starts with digit), `var-1` (hyphen), `class` (keyword), `my var` (space)

## Keywords

Python reserves 35+ keywords. You don't need to memorize all of them, but recognize the most-asked ones:

```python
False    None     True     and      as       assert
async    await    break    class    continue def
del      elif     else     except   finally  for
from     global   if       import   in       is
lambda   nonlocal not      or       pass     raise
return   try      while    with     yield
```

**MCQ trap**: `print`, `input`, `len`, `range` are **built-in functions**, not keywords. You can technically reassign them (`print = 5`) — bad idea, but legal.

## Indentation

Python uses **indentation**, not braces, to define code blocks. The official style is 4 spaces.

```python
if x > 0:
    print("positive")  # 4-space indent
    if x > 100:
        print("large")  # 8-space indent
else:
    print("not positive")
```

**Mixing tabs and spaces** raises `IndentationError` or `TabError`. Pick one (spaces) and stick to it.

## Comments

```python
# Single-line comment

"""
Multi-line strings work as block "comments"
but technically they are string literals.
"""

x = 5  # inline comment
```

## Statements and expressions

A **statement** does something: `x = 5`, `print(x)`, `if x > 0:`.
An **expression** evaluates to a value: `x + 1`, `len([1,2,3])`, `5 ** 2`.

```python
# Statement (assignment)
total = 10

# Expression (evaluates to 11)
total + 1

# Statement that contains an expression
result = total + 1
```

## Operators precedence — high to low

Order matters in tests. Memorize the top of this table:

| Precedence | Operators |
|---|---|
| 1 (highest) | `**` (right-associative) |
| 2 | unary `+x`, `-x`, `~x` |
| 3 | `*`, `/`, `//`, `%` |
| 4 | `+`, `-` |
| 5 | `<<`, `>>` |
| 6 | `&` |
| 7 | `^` |
| 8 | `\|` |
| 9 | `<`, `<=`, `>`, `>=`, `!=`, `==`, `in`, `not in`, `is`, `is not` |
| 10 | `not x` |
| 11 | `and` |
| 12 (lowest) | `or` |

**Trap:** `**` is **right-associative**, so `2 ** 3 ** 2` = `2 ** (3 ** 2)` = `2 ** 9` = `512`, not `64`.

## Truthiness

These all evaluate to `False` in a boolean context:

- `False`, `None`
- `0`, `0.0`, `0j`
- `""`, `''`, `b""`
- `[]`, `()`, `{}`, `set()`, `range(0)`

Everything else is `True`. This is why `if my_list:` works as a "is the list non-empty?" check.

## Try it yourself

Open the [Python sandbox](/sandbox/python) and run:

```python
print(2 ** 3 ** 2)
print(bool([]))
print(bool([0]))
print("hello" * 3)
print(True + True + True)
```

Predict the output **before** running. Then run and see if you were right.

## What's next

Once you can answer "which is a valid identifier" in your sleep, move on to **data types** — strings, lists, tuples, dicts, sets. That lesson is where 60% of Python MCQs live.
