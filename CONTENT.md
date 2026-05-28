# Authoring guide

Content here is plain Markdown + JSON. Vite's `import.meta.glob` picks up new files automatically — no wiring needed beyond writing them.

## Item-schema reference

All quiz items live under `src/data/quizzes/<track>.json` (or split into `<track>-coding.json`). Every item type accepts the following **optional** fields on top of the original required ones — author them when you can, the UI degrades gracefully when missing.

```jsonc
{
  // ── existing required fields per type, see src/types.ts ──

  // ── optional pedagogy fields (new) ──
  "pattern": "sliding-window",        // groups items in PatternsPage + planner
  "estMinutes": 12,                   // planner budgets time per item
  "companies": ["tcs", "infosys"],    // optional company-tagging
  "constraints": "1 <= n <= 10^5",    // shown as a small chip above the editor
  "examples": [
    {
      "input": "nums = [1,2,3], k = 2",
      "output": "5",
      "explanation": "Window [2,3] has sum 5."
    }
  ],
  "hints": [
    "Think about what changes when the window slides by one.",
    "Don't recompute the sum — add the new element, subtract the leaving one."
  ],
  "bruteForce": {
    "code": "def f(nums, k):\n    return max(sum(nums[i:i+k]) for i in range(len(nums)-k+1))",
    "complexity": "O(n*k) time, O(1) space",
    "explanation": "Recompute each window from scratch."
  },
  "optimal": {
    "code": "def f(nums, k):\n    s = sum(nums[:k]); best = s\n    for i in range(k, len(nums)):\n        s += nums[i] - nums[i-k]\n        best = max(best, s)\n    return best",
    "complexity": "O(n) time, O(1) space",
    "explanation": "Slide the window: each step adds one element and drops one."
  },
  "complexityCheck": {
    "question": "What's the time complexity of the optimal solution?",
    "choices": [
      { "label": "O(1)",       "correct": false },
      { "label": "O(log n)",   "correct": false },
      { "label": "O(n)",       "correct": true  },
      { "label": "O(n log n)", "correct": false }
    ]
  }
}
```

## Definition of done for a pattern

Each pattern in `src/data/patterns.json` should reach this bar before being declared "complete":

- **1 lesson** in `src/content/<track>/` covering the core mental model.
- **≥ 6 coding/SQL problems** at increasing difficulty (2 easy / 3 medium / 1 hard), each with `hints`, `examples`, `constraints`, `optimal`, `complexityCheck`.
- **≥ 2 MCQs** testing the conceptual edges (complexity, when not to use it).
- Lesson and item ids must be listed under the pattern entry in `patterns.json`.

## Target content counts

| Track | Lessons | MCQs | Coding/SQL |
|---|---|---|---|
| Python | 25 | 80 | 40 |
| DSA | 20 (one per pattern) | 60 | 120 (≥ 6 per pattern × 19 patterns) |
| SQL | 15 | 60 | 50 (across `employees`, `ecommerce`, `social`) |
| Aptitude | n/a | 120 | n/a |

The catalog in `src/data/patterns.json` is intentionally aspirational — it lists item ids that don't yet exist. The loader filters those out, so the UI shows you what's authored vs. what remains.

## Mock-test wiring

When you add new MCQ items tagged with the right `topic`, the existing TCS NQT / Infosys SP blueprints in `src/lib/mockTestFormats.ts` will auto-pick them — no change to the blueprint needed.

## SQL schemas

Three bundled schemas:

- `employees` — small HR-style data, joins + group-by + null handling.
- `ecommerce` — orders + customers + products, useful for medium-difficulty joins and subqueries.
- `social` — users + posts + follows + likes, designed for window functions, recursive CTEs, and self-joins. **Use this for harder senior-round drills.**

## Authoring checklist (the punch-list)

Tick patterns as their definition-of-done is met:

### DSA (`src/content/dsa/`, `src/data/quizzes/dsa.json`, `dsa-coding.json`)
- [x] `arrays-basics` — lesson exists, 2 MCQs exist, coding TBD
- [ ] `two-pointer`
- [ ] `sliding-window` (seed lesson + 2 problems shipped)
- [ ] `prefix-sums`
- [ ] `hashing`
- [ ] `binary-search`
- [ ] `recursion`
- [ ] `sorting`
- [ ] `linked-list`
- [ ] `stack-queue`
- [ ] `trees`
- [ ] `heaps`
- [ ] `graphs`
- [ ] `greedy`
- [ ] `dp-1d`
- [ ] `dp-2d`
- [ ] `bit-manipulation`
- [ ] `math`

### Python (`src/content/python/`, `src/data/quizzes/python.json`, `python-coding.json`)
- [ ] basics + control flow
- [ ] data model (mutability, identity, copy)
- [ ] comprehensions
- [ ] iterators & generators (seed lesson shipped)
- [ ] decorators & closures
- [ ] OOP + dunder methods + dataclasses
- [ ] exceptions
- [ ] stdlib essentials (collections, itertools, functools)
- [ ] typing + virtualenv
- [ ] file & I/O

### SQL (`src/content/sql/`, `src/data/quizzes/sql.json`)
- [ ] SELECT / WHERE / ORDER BY
- [ ] JOINs (all 5 kinds)
- [ ] GROUP BY + HAVING
- [ ] Subqueries
- [ ] CTEs
- [ ] Window functions (seed lesson + drill shipped on `social` schema)
- [ ] Set operations + NULL semantics
- [ ] Indexes + query plans
- [ ] Normalization 1NF–BCNF
- [ ] Transactions + ACID + isolation levels

### Aptitude (`src/data/quizzes/aptitude.json`)
- [ ] Quant: ratios, percentages, profit/loss, time-speed-distance, time-work
- [ ] Logical: series, syllogisms, blood relations, seating arrangements
- [ ] Verbal: reading comprehension, error spotting, sentence correction

## Style notes

- Keep prompts crisp — interview prompts are 1-3 sentences, not essays.
- For hints, escalate: hint 1 is a nudge, hint 2 names the data structure, hint 3 sketches the algorithm. Never give the answer in a hint.
- For brute force + optimal: explain *why* the optimal is faster (what redundant work the brute force does).
- Use the `companies` tag honestly — only tag it if the problem has actually been asked there.
