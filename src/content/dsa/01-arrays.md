---
id: dsa-arrays
title: Arrays
track: dsa
topic: arrays
order: 1
estMinutes: 12
prerequisites: []
---

# Arrays

In Python, "array" = `list` for most purposes. (The `array` module exists for typed arrays, but service-company tests rarely use it.)

## Operations and Big-O

| Operation | Time |
|---|---|
| Access by index `a[i]` | O(1) |
| Append at end `a.append(x)` | O(1) amortized |
| Insert at front `a.insert(0, x)` | O(n) |
| Search `x in a` | O(n) |
| Delete by value `a.remove(x)` | O(n) |
| Sort `a.sort()` | O(n log n) |

## Patterns to memorize

### 1. Two-pointer (sorted array)

```python
def two_sum_sorted(a, target):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == target:
            return [i, j]
        if s < target:
            i += 1
        else:
            j -= 1
    return []
```

### 2. Sliding window

```python
def max_subarray_sum(a, k):
    s = sum(a[:k])
    best = s
    for i in range(k, len(a)):
        s += a[i] - a[i - k]
        best = max(best, s)
    return best
```

### 3. Prefix sum

```python
def prefix_sums(a):
    p = [0]
    for x in a:
        p.append(p[-1] + x)
    return p

# range_sum(l, r) = p[r+1] - p[l]
```

### 4. Kadane's algorithm (max subarray sum)

```python
def kadane(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

## Practice

Start with the easy MCQs ("what does `a.pop(0)` do?"), then move to coding drills for two-pointer and sliding-window. These two patterns alone solve ~30% of DSA interview problems at fresher level.
