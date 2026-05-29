---
id: dsa-20-worked-windows-prefix
title: Worked examples: sliding window and prefix sums
track: dsa
topic: worked-examples
order: 20
estMinutes: 38
prerequisites: [dsa-18-pattern-recognition-machine]
pattern: sliding-window
---

# Worked examples: sliding window and prefix sums

Many learners confuse sliding window and prefix sums because both talk about
subarrays. The difference is mechanical:

```text
Sliding window: maintain a valid moving range.
Prefix sum: convert range sum into difference of two prefixes.
```

## Decision rule

Use sliding window when:

- the range is contiguous,
- you can expand right,
- you can shrink left when invalid,
- the condition changes predictably.

Use prefix sum when:

- you need many subarray sums,
- numbers can be negative,
- the condition is about exact sum or count of sums.

## Example 1: Longest substring without repeating characters

Problem:

```text
Given a string s, return the length of the longest substring with no repeated characters.
```

### Pattern classifier

Keywords:

```text
longest
substring
no repeated characters
```

Contiguous string + longest valid range -> sliding window.

### State builder

```text
left = start of current window
seen = set of characters inside current window
best = max window length seen
```

### Solution

```python
def length_of_longest_substring(s):
    left = 0
    seen = set()
    best = 0

    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)

    return best
```

### Dry run

```text
s = "abba"
right=0 a -> seen={a}, best=1
right=1 b -> seen={a,b}, best=2
right=2 b -> duplicate
remove a, left=1, still b duplicate
remove b, left=2
add b, window="b", best=2
right=3 a -> window="ba", best=2
```

### Mistake rule

The window must be valid before updating `best`.

## Example 2: Minimum size subarray sum

Problem:

```text
Given positive integers nums and target, return the minimum length of a contiguous subarray with sum >= target.
Return 0 if none exists.
```

### Constraint signal

All numbers are positive. When you move right, sum increases. When you move
left, sum decreases. This monotonic behavior enables sliding window.

### Solution

```python
def min_subarray_len(target, nums):
    left = 0
    cur = 0
    best = float("inf")

    for right, x in enumerate(nums):
        cur += x
        while cur >= target:
            best = min(best, right - left + 1)
            cur -= nums[left]
            left += 1

    return 0 if best == float("inf") else best
```

### Why the loop shrinks

Once the sum is enough, the current window is valid. Shrinking tests whether a
shorter valid window exists.

### Mistake rule

Minimum window problems update the answer before shrinking. Maximum window
problems often shrink until valid, then update.

## Example 3: Subarray sum equals k

Problem:

```text
Given nums that may include negative numbers, count subarrays whose sum equals k.
```

### Why not sliding window?

Negative numbers break monotonic behavior. Adding a value can decrease the sum,
and removing a value can increase it. A left/right shrinking rule is unsafe.

### Prefix idea

```text
sum(i..j) = prefix[j] - prefix[i-1]
```

If current prefix is `p`, we need an earlier prefix:

```text
p - earlier = k
earlier = p - k
```

### Solution

```python
def subarray_sum(nums, k):
    prefix = 0
    count = {0: 1}
    ans = 0

    for x in nums:
        prefix += x
        ans += count.get(prefix - k, 0)
        count[prefix] = count.get(prefix, 0) + 1

    return ans
```

### Dry run

```text
nums=[1,2,3], k=3
prefix=0, count={0:1}
x=1 -> prefix=1, need=-2, ans=0, count[1]=1
x=2 -> prefix=3, need=0, ans=1, count[3]=1
x=3 -> prefix=6, need=3, ans=2, count[6]=1
```

Subarrays are `[1,2]` and `[3]`.

## Window vs prefix final test

Ask:

```text
Can I safely move left based only on the current condition?
```

If yes, sliding window may work.

If no, especially with negative numbers or exact counts, try prefix sum.
