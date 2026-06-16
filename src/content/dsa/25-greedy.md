---
id: dsa-25-greedy
title: Greedy — take the locally best move
track: dsa
topic: greedy
order: 25
estMinutes: 13
prerequisites: [dsa-09-sorting]
pattern: greedy
---

# Greedy

A greedy algorithm builds the answer one step at a time, **always taking the choice that looks best right now** and never undoing it. It's fast and simple — when it works. The whole skill is knowing *when* the locally-best move is also globally optimal.

## The thinking pattern

1. **Find the greedy choice.** What single decision, made repeatedly, builds the answer? (Pick the earliest finish time, the largest coin, the closest gap…)
2. **Sort or heap.** Greedy almost always needs the data in a useful order first — usually a sort (`O(n log n)`) or a priority queue.
3. **Prove it (or trust a known pattern).** Greedy is only correct if the problem has the **greedy-choice property**: a locally optimal choice is part of some global optimum. If you can't argue that, suspect DP instead.
4. **Sweep once.** Walk the sorted data, applying the choice and tracking state.

## Activity selection — the canonical example

Given start/end times, pick the maximum number of non-overlapping intervals.

```python
def max_activities(intervals):
    intervals.sort(key=lambda x: x[1])   # sort by EARLIEST finish
    count, last_end = 0, float("-inf")
    for s, e in intervals:
        if s >= last_end:                # doesn't overlap the last pick
            count += 1
            last_end = e
    return count
```

**Why earliest-finish?** Finishing earliest leaves the most room for everything after. Picking by earliest *start* or shortest duration both have counterexamples — the finish-time ordering is the one that's provably optimal.

## Jump game — can you reach the end?

```python
def can_jump(nums):
    reach = 0
    for i, n in enumerate(nums):
        if i > reach:          # a gap we can't cross
            return False
        reach = max(reach, i + n)
    return True
```

The greedy state is "farthest index reachable so far." No need to try every jump combination — track the frontier.

## Coin change (greedy version) — and its trap

For *canonical* coin systems (1, 5, 10, 25) greedy works: always take the largest coin that fits.

```python
def coins_greedy(coins, amount):
    coins.sort(reverse=True)
    used = 0
    for c in coins:
        used += amount // c
        amount %= c
    return used if amount == 0 else -1
```

**The trap:** for coins `[1, 3, 4]` and amount `6`, greedy gives `4 + 1 + 1 = 3` coins, but `3 + 3 = 2` is better. Greedy is **wrong** for arbitrary coin sets — that's a DP problem (see [the 1D DP lesson](#)). Always ask: does my greedy choice have a counterexample?

## Interval merging & scheduling

Sort by start, then sweep, extending or closing the current interval:

```python
def merge(intervals):
    intervals.sort()
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)   # overlap -> extend
        else:
            out.append([s, e])
    return out
```

## When greedy needs a heap

"At each step take the smallest/largest available" often means a priority queue, not a sort, because the set of choices changes as you go (e.g. connect-ropes-with-min-cost, task scheduling with cooldowns). Reach for `heapq` when new candidates appear mid-sweep.

## Recognizing a greedy problem

- "Maximum number of ...", "minimum number of ...", "earliest / latest ...".
- A natural ordering (by time, size, ratio, deadline) makes the choice obvious.
- Each decision is **independent of future ones** once made — no need to reconsider.
- You can argue an **exchange argument**: swapping any optimal solution's choice for the greedy one doesn't make it worse.

## Greedy vs DP — the decision

| Signal | Reach for |
|---|---|
| Local choice provably optimal, no backtracking | Greedy |
| Choice now affects which choices are legal later | DP |
| Counterexample exists for the obvious greedy move | DP |
| `O(n log n)` feels achievable and the sort "lines up" the answer | Greedy |

## Common bugs

- **Wrong sort key.** Activity selection by finish time, not start time. Fractional knapsack by value/weight *ratio*, not value. The key *is* the algorithm.
- **Assuming greedy works without checking.** The coin-change trap. When unsure, hand-build a tiny counterexample before trusting it.
- **Mutating the input sort order** when the caller needs it preserved — sort a copy if so.
- **Ties.** Decide the tie-break deliberately; an arbitrary one can break correctness in scheduling problems.
