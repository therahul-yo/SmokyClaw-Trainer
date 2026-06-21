---
id: dsa-19-worked-arrays-hashing
title: Worked examples: arrays and hashing
track: dsa
topic: worked-examples
order: 22
estMinutes: 35
prerequisites: [dsa-00-foundations, dsa-18-pattern-recognition-machine]
pattern: hashing
---

# Worked examples: arrays and hashing

This lesson trains the thinking process, not just the answer. Arrays and hashing
are the first real interview filter because they test whether you can replace
repeated searching with stored information.

## Example 1: Two Sum

Problem:

```text
Given nums and target, return indices of two numbers whose sum is target.
Assume exactly one answer.
```

### Input parser

```text
nums: list of integers
target: integer
output: two indices
```

### Constraint signal

If `n` can be large, checking every pair is too slow.

### Brute force

```python
for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        if nums[i] + nums[j] == target:
            return [i, j]
```

Complexity: `O(n^2)`.

### Repeated work

For each number, brute force searches the rest of the array for its complement.
The repeated work is lookup.

### Pattern classifier

Need fast lookup -> hashmap.

### State builder

```text
seen[value] = index where value appeared
```

### Machine solution

```python
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
```

### Dry run

```text
nums = [2, 7, 11, 15], target = 9
i=0, x=2, need=7, seen={}
7 not found, store 2 -> 0
i=1, x=7, need=2, seen={2:0}
2 found, return [0,1]
```

### Proof

When processing `x`, all earlier values are in `seen`. If a valid earlier
complement exists, it will be found immediately. If not, store `x` so it can
serve as complement for a later value.

### Mistake rules

- Do not store after checking if the same element cannot be used twice.
- Store indices, not just values, because output asks for indices.
- Duplicates are fine because the map stores the most recent usable index.

## Example 2: First unique character

Problem:

```text
Given a string, return the index of the first non-repeating character.
Return -1 if none exists.
```

### Classifier

The phrase "non-repeating" means frequency.

Pattern: hashmap count.

### State

```text
freq[char] = number of times char appears
```

### Solution

```python
def first_unique(s):
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1

    for i, ch in enumerate(s):
        if freq[ch] == 1:
            return i

    return -1
```

### Why two passes?

The first pass learns all frequencies. The second pass preserves original order
and finds the first character with count one.

### Edge cases

```text
"" -> -1
"a" -> 0
"aabb" -> -1
"leetcode" -> 0
"loveleetcode" -> 2
```

### Mistake rule

If the question asks "first", do not only find a value. Preserve or revisit the
original order.

## Example 3: Contains duplicate within k distance

Problem:

```text
Return true if the same value appears at indices i and j where abs(i-j) <= k.
```

### Brute force

Check each pair within distance `k`. This can be expensive.

### Pattern

Need latest index of each value -> hashmap.

### State

```text
last_seen[value] = latest index
```

### Solution

```python
def contains_nearby_duplicate(nums, k):
    last_seen = {}
    for i, x in enumerate(nums):
        if x in last_seen and i - last_seen[x] <= k:
            return True
        last_seen[x] = i
    return False
```

### Why latest index?

The latest index gives the smallest distance to the current index. If the latest
one is too far, older ones are even farther.

## The reusable machine rule

When a problem says duplicate, frequency, complement, first seen, last seen, or
lookup, ask:

```text
What should my hashmap key be?
What should my hashmap value be?
When do I check?
When do I update?
```

That four-question loop solves a large percentage of array/hashmap interviews.
