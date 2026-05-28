---
id: dsa-10-linked-lists
title: Linked lists — the pointer gymnastics interview classic
track: dsa
topic: linked-list
order: 10
estMinutes: 12
prerequisites: [dsa-08-recursion]
pattern: linked-list
---

# Linked lists

A linked list is a chain of nodes, each holding a value and a pointer to the next. No random access — you walk from the head. In Python you almost never use them in real code (a `list` is better), but interviewers love them because the pointer manipulation is unforgiving.

## The node

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

A list `1 → 2 → 3 → None` is built as `ListNode(1, ListNode(2, ListNode(3)))`.

## The dummy-node trick

When the answer might change the head, prepend a dummy and return `dummy.next`. Eliminates the entire "is this the first node?" special case.

```python
def remove_value(head, target):
    dummy = ListNode(0, head)
    cur = dummy
    while cur.next:
        if cur.next.val == target:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return dummy.next
```

Without the dummy you'd need `if head.val == target: head = head.next` plus a loop. The dummy makes the head case look exactly like every other case.

## Reverse a linked list

The single most asked linked list question.

```python
def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next     # save next
        cur.next = prev    # flip
        prev = cur         # advance prev
        cur = nxt          # advance cur
    return prev            # new head
```

The four-line core: save, flip, advance, advance. Memorize it.

Recursive version:

```python
def reverse(head):
    if not head or not head.next:
        return head
    new_head = reverse(head.next)
    head.next.next = head
    head.next = None
    return new_head
```

The recursive version uses `O(n)` stack — the iterative one is `O(1)`. Both are correct; pick whichever you can write under pressure.

## Fast/slow pointers

Two pointers, one moving twice as fast. Three classic uses:

### Find the middle
```python
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow
```

When `fast` hits the end, `slow` is at the middle. For even length, this returns the *second* middle — adjust if you need the first.

### Detect a cycle (Floyd's algorithm)
```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

If there's a cycle, the fast pointer laps the slow one and they meet. `O(n)` time, `O(1)` space — beats the hashmap-of-seen-nodes approach on space.

### Find n-th from end
Move `fast` `n` steps ahead, then walk both in lockstep. When `fast` hits `None`, `slow` is at the n-th-from-end.

## Merge two sorted lists

```python
def merge(a, b):
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a or b             # whichever is non-empty
    return dummy.next
```

`O(n + m)` time, `O(1)` extra space. The dummy + tail pattern is your bread and butter for any list-builder problem.

## Patterns this unlocks

- **Reverse / reverse a sub-list / reverse in k-groups** — the four-line core, applied carefully.
- **Detect / find start of cycle** — Floyd's. (Start of cycle: after meeting, reset one pointer to head, walk both at slow speed; they meet at the cycle start.)
- **Palindrome check** — find middle, reverse second half, compare.
- **LRU cache** — doubly-linked list + hashmap.
- **Merge K sorted lists** — heap of head pointers.

## Common bugs

- **Losing the rest of the list.** If you do `cur.next = something_new` without first saving `cur.next`, you've leaked the tail. Save first.
- **Off-by-one on fast pointer.** `while fast and fast.next` — both checks needed, or you NPE on the second `.next`.
- **Forgetting to null-terminate the new tail.** After splitting or reversing, the new tail's `.next` must be `None`. Otherwise the list loops.
- **Returning `head` when you should return `dummy.next`.** If you used a dummy, return `dummy.next`. `head` may have been removed.
