---
id: dsa-00-foundations
title: DSA and LeetCode foundations
track: dsa
topic: basics
order: 0
estMinutes: 15
prerequisites: []
pattern: dsa-foundations
---

# DSA and LeetCode foundations

DSA is not memorizing hundreds of problems. It is learning how to classify an
unknown problem, choose the right pattern, and write a correct implementation
under time pressure.

## The interview loop

Every coding problem should move through this sequence:

1. Understand the input, output, and edge cases.
2. Estimate constraints and required complexity.
3. Write the brute force idea.
4. Identify repeated work.
5. Pick the pattern that removes that repeated work.
6. Code the template.
7. Test edge cases.
8. Explain time and space complexity.

## Complexity basics

| Complexity | What it usually means |
|---|---|
| `O(1)` | Constant work |
| `O(log n)` | Binary search, divide by half |
| `O(n)` | One scan |
| `O(n log n)` | Sorting, divide-and-conquer |
| `O(n^2)` | Nested pair checks |
| `O(2^n)` | Subsets, brute-force recursion |

Constraints tell you what is allowed:

- `n <= 100` can often survive `O(n^2)`.
- `n <= 10^5` usually needs `O(n)` or `O(n log n)`.
- `n <= 10^9` usually needs math or binary search, not scanning.

## Pattern recognition

| Trigger | Likely pattern |
|---|---|
| Sorted array, pair, target | Two pointers |
| Contiguous subarray or substring | Sliding window or prefix sums |
| Frequency, duplicates, lookup | Hashmap or set |
| Find minimum possible answer | Binary search on answer |
| Next greater/smaller | Monotonic stack |
| Shortest path in unweighted graph | BFS |
| All combinations | Backtracking |
| Best answer from choices | Dynamic programming or greedy |

## Basic template

```python
def solve(nums):
    # 1. Handle empty or tiny input.
    if not nums:
        return 0

    # 2. Choose state.
    answer = 0

    # 3. Scan or recurse.
    for x in nums:
        ...

    # 4. Return exact type.
    return answer
```

## Common edge cases

- Empty input.
- One element.
- All values equal.
- Negative numbers.
- Duplicates.
- Already sorted input.
- Reverse sorted input.
- Very large input.
- No valid answer.

## Recall hook

Do not ask, "Have I seen this exact problem?" Ask, "What pattern is this
problem trying to hide?"
