# Authoring guide

Content here is plain Markdown + JSON. Vite's `import.meta.glob` picks up new files automatically — no wiring needed beyond writing them.

## Product content mission

SmokyClaw Trainer should not feel like a random notes app. It should feel like
an interview training machine: it takes a learner from basics to automatic
problem recognition, then forces repeated execution until the concept sticks.

The content must cover:

- **Basics first** — no skipped foundations. Teach syntax, arithmetic, tables,
  arrays, loops, complexity, and input/output before advanced tricks.
- **Python knowledge** — core language, data structures, functions, OOP,
  exceptions, standard library, and coding-test input/output.
- **DSA + LeetCode patterns** — arrays, strings, two pointers, sliding window,
  hashing, prefix sums, binary search, stacks, queues, linked lists, trees,
  heaps, graphs, recursion, backtracking, greedy, dynamic programming, bits,
  and math.
- **SQL + DBMS** — SELECT, joins, aggregation, subqueries, CTEs, windows, NULLs,
  indexes, normalization, transactions, and practical query drills.
- **Aptitude** — arithmetic foundations, formulas, quant, logical reasoning,
  verbal, and timed company-style sections.
- **Limited-time adaptation** — every concept must be teachable through a
  daily plan, with weak areas repeated more often than strong areas.

## Lesson quality bar

Every serious lesson should use this structure:

1. **Why this matters** — where it appears in interviews or tests.
2. **Basics** — the minimum foundation needed before solving problems.
3. **Mental model** — the idea in plain language.
4. **Recognition triggers** — words or constraints that reveal the pattern.
5. **Template** — reusable Python/SQL/formula skeleton.
6. **Worked example** — trace the algorithm or calculation step by step.
7. **Common traps** — off-by-one, edge cases, TLE, NULL behavior, formula misuse.
8. **Drills** — easy → medium → hard.
9. **Recall hook** — one short rule the learner should remember under pressure.

## Problem quality bar

Every coding or SQL drill should train the learner like an interview:

- Show the prompt in 1-3 crisp sentences.
- Include constraints so the learner must think about complexity.
- Include at least 2 examples, including one edge case.
- Provide 3 progressive hints: nudge, data structure/pattern, algorithm sketch.
- Include brute force and optimal approaches.
- Explain what repeated work the optimal approach removes.
- Include complexity check after solving.
- Include tags for pattern, company, and difficulty when honest.

## Training loop

Each topic should move through this loop:

1. **Learn** the foundation.
2. **Recognize** the pattern from keywords and constraints.
3. **Solve** using a reusable template.
4. **Stress test** with edge cases and timed practice.
5. **Review** every wrong answer through the Leitner queue.
6. **Retest** through mock-test sections.

The goal is not to claim that a learner can magically solve every problem. The
goal is to build the habit that strong interviewers use: classify the problem,
choose the pattern, write the clean template, handle edge cases, and explain
complexity under time pressure.

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

## Content counts — current vs target (authoritative)

> **This table is the single source of truth for content targets.** `CURRICULUM.md`
> defers to it. The *current* column is whatever `pnpm validate` reports — run it
> for live numbers; the snapshot below was taken 2026-06-13 (314 items + 82 lessons).

| Track | Lessons (cur → target) | MCQs (cur → target) | Coding/SQL (cur → target) |
|---|---|---|---|
| Python | 20 → 25 | 46 → 80 | 23 → 40 |
| DSA | 26 → 20¹ | 44 → 60 | 65 → 120² |
| SQL | 15 → 15 | 33 → 60 | 21 → 50³ |
| Aptitude | 21 → n/a | 82 → 120 | n/a |
| **Total** | **82** | **205** | **109** → **314 items** |

¹ DSA already exceeds the "one lesson per pattern" floor — the extra lessons are
  worked-examples and company machine-plans; the bar is ≥1 teaching lesson per pattern.
² ≥ 6 coding drills per pattern × 20 patterns (2 easy / 3 medium / 1 hard).
³ Split across `employees`, `ecommerce`, `social` — weight new drills toward the
  under-used `social` and `ecommerce` schemas.

The catalog in `src/data/patterns.json` is intentionally aspirational — it may list
item ids that don't yet exist. The loader filters those out, so the UI shows you
what's authored vs. what remains. `pnpm validate` warns on every such unauthored
reference, so the gap is always visible.

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
- [x] `arrays-basics` — 6 coding drills authored
- [x] `two-pointer` — 6 coding drills authored
- [x] `sliding-window` — 6 coding drills authored
- [x] `prefix-sums` — 6 coding drills authored
- [x] `hashing` — 6 coding drills authored
- [x] `binary-search` — 6 coding drills authored
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
