---
id: python-20-stdlib
title: Standard library — collections, itertools, functools
track: python
topic: stdlib
order: 20
estMinutes: 10
prerequisites: [python-10-generators]
pattern: python-stdlib
---

# Standard library essentials

These three modules are the interview cheat sheet. Knowing them turns 15-line solutions into 3-line solutions.

## `collections`

### `Counter` — frequency map

```python
from collections import Counter
Counter("mississippi")          # Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})
Counter([1, 2, 2, 3, 3, 3]).most_common(2)   # [(3, 3), (2, 2)]
```

`Counter` is the right tool for anagram checks, top-K frequencies, character histograms.

### `defaultdict` — auto-init values

```python
from collections import defaultdict
groups = defaultdict(list)
for word in words:
    groups[len(word)].append(word)
# No 'if key not in dict' boilerplate.
```

`defaultdict(int)` for counting, `defaultdict(list)` for grouping, `defaultdict(set)` for unique grouping.

### `deque` — O(1) ends

```python
from collections import deque
q = deque([1, 2, 3])
q.appendleft(0)     # O(1) — list.insert(0, x) is O(n)
q.popleft()         # O(1)
```

The right data structure for BFS queues and sliding-window-of-recent-items.

### `OrderedDict` (rarely needed since 3.7)

Plain `dict` preserves insertion order since Python 3.7. Reach for `OrderedDict` only when you need `move_to_end`.

## `itertools`

| Function | One-liner |
|---|---|
| `count(start, step)` | Infinite counter — pair with `zip` to enumerate. |
| `cycle(iter)` | Loops forever. |
| `repeat(x, n)` | `x` `n` times. |
| `chain(a, b, ...)` | Concatenate iterables lazily. |
| `chain.from_iterable(iters)` | Flatten one level. |
| `islice(iter, start, stop, step)` | `iter[start:stop:step]` without materializing. |
| `groupby(iter, key)` | Run-length grouping. **Input must be sorted by key.** |
| `combinations(iter, r)` | All r-element combos (order doesn't matter). |
| `permutations(iter, r)` | All r-length permutations (order matters). |
| `product(a, b)` | Cartesian product — beats nested `for`. |
| `accumulate(iter, op)` | Running sum/product/max — same as a prefix sum. |
| `pairwise(iter)` (3.10+) | Adjacent pairs: `(a, b), (b, c), (c, d), ...` |

### One example each

```python
list(itertools.product([1,2], "ab"))     # [(1,'a'),(1,'b'),(2,'a'),(2,'b')]
list(itertools.accumulate([1,2,3,4]))    # [1, 3, 6, 10]
list(itertools.pairwise([1,2,3,4]))      # [(1,2),(2,3),(3,4)]
```

## `functools`

| Function | Use |
|---|---|
| `cache` (3.9+) | Unbounded memoization. `@functools.cache`. |
| `lru_cache(maxsize=N)` | Bounded LRU cache. Use for recursive memoization. |
| `reduce(fn, iter, [init])` | Fold. Prefer `sum`, `math.prod`, comprehensions — only reach for `reduce` when no specific fn exists. |
| `partial(fn, *args, **kwargs)` | Partially apply: `add5 = partial(add, 5)`. |
| `wraps(fn)` | Inside decorators — preserves `__name__`, `__doc__`. |
| `cmp_to_key(cmp_fn)` | Use a C-style comparator with `sorted(..., key=cmp_to_key(cmp))`. |
| `total_ordering` | Class decorator — define `__eq__` and one of `<, <=, >, >=`, get the rest. |

### Memoizing a recursive function

```python
from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(100)   # instant — without @cache, would never finish
```

This is the #1 interview use case: take a naive recursive solution, add `@cache`, you've implemented memoized DP.

## `heapq` — min-heap

Not in `collections` but always interview-relevant.

```python
import heapq
h = []
heapq.heappush(h, 3); heapq.heappush(h, 1); heapq.heappush(h, 2)
heapq.heappop(h)   # 1 — smallest

# For top-K largest:
heapq.nlargest(3, [5, 1, 9, 2, 8])   # [9, 8, 5]
```

`heapq` is a **min-heap** only. For a max-heap, push the negative.

## `bisect` — binary search on a sorted list

```python
import bisect
arr = [1, 3, 5, 7, 9]
bisect.bisect_left(arr, 5)    # 2 — insert before equal
bisect.bisect_right(arr, 5)   # 3 — insert after equal
bisect.insort(arr, 4)         # keeps sorted: [1, 3, 4, 5, 7, 9]
```

Two-line replacement for hand-written binary search — and it's correct.
