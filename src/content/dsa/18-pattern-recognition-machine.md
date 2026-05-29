---
id: dsa-18-pattern-recognition-machine
title: Pattern recognition machine
track: dsa
topic: pattern-recognition
order: 18
estMinutes: 32
prerequisites: [dsa-00-foundations]
pattern: dsa-pattern-recognition-machine
---

# Pattern recognition machine

LeetCode becomes manageable when you stop asking, "Have I seen this problem?"
and start asking, "Which pattern is the constraint forcing?"

The goal is to build a mechanical decision process. You read the problem, detect
signals, pick a pattern, write the template, and test edge cases.

## The four-question filter

Before writing code, answer these:

1. What is the input size?
2. Is the data sorted, contiguous, graph-like, or decision-based?
3. What repeated work would brute force do?
4. Which state would remove that repeated work?

Example:

```text
Find two numbers that sum to target.
Brute force checks every pair.
Repeated work: searching for the matching value.
State: set or hashmap of values seen so far.
Pattern: hashing.
```

## Constraint-to-complexity map

| Constraint | Usually acceptable |
|---|---|
| `n <= 20` | Backtracking, bitmask, subsets, `O(2^n)` |
| `n <= 100` | Nested loops, `O(n^2)` |
| `n <= 1000` | Sometimes `O(n^2)`, often better |
| `n <= 10^5` | `O(n)` or `O(n log n)` |
| `n <= 10^9` | Math, binary search, greedy insight |

If `n` is `10^5`, brute-force pairs are usually dead. Look for hashing, sorting
plus two pointers, prefix sums, heap, stack, or binary search.

## Pattern triggers

| Problem wording | Pattern to test first |
|---|---|
| Pair in sorted array | Two pointers |
| Pair in unsorted array | Hashing |
| Contiguous subarray count/sum | Prefix sum |
| Longest substring/subarray with condition | Sliding window |
| Minimum possible maximum | Binary search on answer |
| Next greater / previous smaller | Monotonic stack |
| Top K / kth largest | Heap or quickselect |
| Connected components | DFS/BFS |
| Shortest path, unweighted | BFS |
| All valid combinations | Backtracking |
| Best value after choices | Dynamic programming |
| Intervals overlap/merge | Sort by start, scan |

Do not memorize the table blindly. Use it to form a hypothesis, then verify it
against constraints.

## Brute force is not wasted

Always write the brute force idea in words first:

```text
Try every subarray and compute its sum.
This is O(n^2) or O(n^3).
Repeated work: the same partial sums are recomputed.
Use prefix sums to get each subarray sum in O(1).
```

Brute force exposes the repeated work. The optimal pattern usually removes that
specific repeated work.

## Template bank

### Hashing

```python
seen = {}
for i, x in enumerate(nums):
    need = target - x
    if need in seen:
        return [seen[need], i]
    seen[x] = i
```

Use when the question needs fast lookup of "have I seen the complement, count,
or previous index?"

### Two pointers

```python
left, right = 0, len(nums) - 1
while left < right:
    cur = nums[left] + nums[right]
    if cur == target:
        return True
    if cur < target:
        left += 1
    else:
        right -= 1
return False
```

Usually needs sorted input or a reason moving a pointer cannot skip the answer.

### Sliding window

```python
left = 0
state = {}
best = 0

for right, x in enumerate(nums):
    # add nums[right] to state

    while window_is_invalid:
        # remove nums[left] from state
        left += 1

    best = max(best, right - left + 1)
```

Use for longest/shortest contiguous window problems where expanding and
shrinking is valid.

### Prefix sum

```python
prefix = 0
seen = {0: 1}
answer = 0

for x in nums:
    prefix += x
    answer += seen.get(prefix - target, 0)
    seen[prefix] = seen.get(prefix, 0) + 1
```

Use when a subarray sum can be represented as `prefix[j] - prefix[i]`.

### Binary search on answer

```python
lo, hi = min_possible, max_possible
while lo < hi:
    mid = (lo + hi) // 2
    if can_do(mid):
        hi = mid
    else:
        lo = mid + 1
return lo
```

Use when the answer is numeric and feasibility is monotonic:

```text
If capacity X works, any capacity larger than X also works.
```

## Edge-case checklist

For every DSA solution, test:

- Empty input if allowed.
- Single element.
- Duplicates.
- Negative values.
- All equal values.
- No answer.
- Answer at the beginning.
- Answer at the end.
- Maximum input size.

If the problem is string-based, also test repeated characters and case
sensitivity. If it is graph-based, test disconnected nodes and cycles.

## Explanation script

Use this structure after coding:

```text
The brute force would be ...
That repeats ...
I store ...
For each element, I update ...
Correctness comes from ...
Time is ...
Space is ...
```

Good interview answers are not only code. They are code plus proof.

## Training rule

When you fail a problem, do not only read the solution. Write one line:

```text
I missed this because the trigger was ______ and the pattern was ______.
```

This converts failure into recognition memory. Recognition memory is what makes
future problems feel mechanical.
