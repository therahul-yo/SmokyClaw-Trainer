# SmokyClaw Trainer Curriculum

SmokyClaw is a basics-to-interview-execution curriculum. The training order is:

1. **Foundations** — Python syntax, arithmetic, tables, arrays, loops, Big-O, and input/output.
2. **Recognition** — learn trigger words and constraints that reveal the pattern.
3. **Templates** — memorize clean Python, SQL, and formula skeletons.
4. **Drills** — solve easy, medium, and hard problems with examples, hints, brute force, optimal solution, and complexity checks.
5. **Recall** — wrong answers enter spaced repetition until the idea is automatic.
6. **Mocks** — prove speed and accuracy in timed TCS/Infosys-style sections.

## Track Map

| Phase | Python | DSA / LeetCode | SQL / DBMS | Aptitude |
|---|---|---|---|---|
| 1 | syntax, variables, loops | Big-O, arrays, strings | tables, SELECT, WHERE | arithmetic, percentages |
| 2 | lists, dicts, sets, functions | two pointers, sliding window | joins, GROUP BY | ratios, averages |
| 3 | strings, input/output, stdlib | hashing, prefix sums, binary search | subqueries, CTEs | profit/loss, time-work |
| 4 | OOP, exceptions, file I/O | stacks, queues, linked lists | windows, NULLs | speed-distance, number system |
| 5 | interview coding patterns | trees, heaps, graphs | indexes, normalization, ACID | reasoning, verbal |
| 6 | timed Python drills | DP, greedy, backtracking | practical query mocks | company-style mocks |

## DSA Pack Standard

Each core DSA pattern should have exactly this minimum before it is marked complete:

- 1 focused lesson.
- 2 conceptual MCQs.
- 6 coding drills: 2 easy, 3 medium, 1 hard.
- Progressive hints.
- Brute-force explanation.
- Optimal solution and complexity.
- Edge-case tests.

The first completed packs should be arrays, two pointers, sliding window,
hashing, prefix sums, and binary search. These are the base patterns that make
most beginner-to-medium LeetCode questions solvable.

## Content Tone

Use professional-intense language. The promise is not magic. The promise is
repeatable training: classify the problem, choose the pattern, write the
template, handle edge cases, explain complexity, and retry weaknesses until the
response is fast.

## Zero-To-Machine System

The app should train a beginner into a repeatable interview operator, not just a
person who has watched lessons. The standard is:

1. Read the problem.
2. Classify the pattern from constraints and trigger words.
3. Choose the template.
4. Code or query from memory.
5. Prove with edge cases.
6. Explain brute force, optimal solution, and complexity.
7. Repair the mistake until the same weakness stops repeating.

This is a 90-120 day path for a serious beginner. Faster timelines can work for
users who already know programming, but the app should never pretend that total
mastery is instant.

## Stage Gates

Every item belongs to one of these stages. Content can declare the stage in its
metadata, and the app can infer it when older items do not yet have explicit
metadata.

| Stage | Gate | What it proves |
|---|---:|---|
| Foundation | 85% | Python syntax, SQL basics, arithmetic, arrays, loops, Big-O, and input/output are automatic. |
| Core Patterns | 80% | Arrays, hashing, prefix sums, two pointers, sliding window, and binary search are recognized fast. |
| Intermediate Patterns | 75% | Stacks, queues, recursion, sorting, linked lists, joins, CTEs, ratios, and time-work are usable without hints. |
| Advanced Patterns | 70% | Trees, heaps, graphs, backtracking, DP, windows, indexes, normalization, and harder probability are trainable. |
| Interview Simulation | 70% | Mixed timed sections can be handled under pressure. |
| Machine Mode | 85% | The learner is fast, accurate, and can explain decisions without memorized noise. |

An item is not counted as mastered just because it was once answered correctly.
The target behavior is correct, no give-up, low hint usage, and within a speed
target unless the item is intentionally hard.

## Daily Machine Loop

The daily loop is five blocks:

| Block | Purpose |
|---|---|
| Warm-up | Keep basics instant: syntax, formulas, definitions, and short MCQs. |
| Pattern Block | Train DSA recognition and template recall before jumping into random solving. |
| Mixed Block | Force switching across Python, DSA, SQL, and aptitude. |
| Repair Block | Repeat due review items and recently-wrong items until the weakness shrinks. |
| Speed Block | Redo easy or slow-solved items against strict time limits. |

This is the core "machine" idea: the learner does not choose random work. The
system chooses the next useful pressure point from attempts, review due dates,
wrong answers, hints, give-ups, and time spent.

## Readiness Targets

The app tracks four readiness scores:

| Score | Target | Pool |
|---|---:|---|
| Campus Interview | 85% | Aptitude, Python basics, easy DSA, and company-tagged items. |
| LeetCode Medium | 80% | Easy and medium DSA coding items. |
| SQL / DBMS | 85% | SQL query and database concept items. |
| Aptitude Speed | 90% | Quantitative and reasoning MCQs. |

These scores should be treated as gates, not vanity stats. A user below target
gets repair work. A user above target should move into mock pressure and mixed
sets.

## Content Expansion Targets

Per-track content targets and the current authored counts live in **[`CONTENT.md`
→ "Content counts — current vs target"](CONTENT.md#content-counts--current-vs-target-authoritative)**,
which is the single source of truth. Run `pnpm validate` for the live tally. This
file (CURRICULUM.md) describes the *pedagogy and ordering*; CONTENT.md owns the
*numbers and the authoring bar*.

The next highest-value expansion is not more theory. It is more graded drills
with clean explanations, edge cases, recognition prompts, speed targets, and
wrong-answer traps.

## How A Learner Should Use The Content

Lessons are not meant to be read like articles. Every lesson should be consumed
with active recall:

1. Read the mental model.
2. Close the page and restate it in your own words.
3. Copy the template once by hand.
4. Modify the template for one edge case.
5. Explain the complexity out loud.
6. Attempt drills only after the template is understood.

For Python, the learner should ask: which container does the work?

For DSA, the learner should ask: which repeated work does the pattern remove?

For SQL, the learner should ask: what does one row of the final result
represent?

For aptitude, the learner should ask: what is the topic and what is the fastest
formula path?

If a user cannot answer the track question, more random practice will not help.
They should return to the lesson, template, and mistake log.

## Worked Example Standard

For machine-brain training, a worked example is stronger than a solved answer.
Every major concept should eventually include examples with this shape:

1. Problem statement.
2. Input parser.
3. Output contract.
4. Constraint signal.
5. Brute force.
6. Repeated work.
7. Pattern classifier.
8. State builder.
9. Dry run.
10. Final solution.
11. Proof.
12. Mistake rule.

The current worked-example expansion adds this layer for:

- DSA arrays and hashing.
- DSA sliding window and prefix sums.
- DSA trees, graphs, and dynamic programming.
- Python implementation fluency.
- Python debugging and edge cases.
- SQL business queries.
- Aptitude speed math.

The long-term bar is one worked-example lesson for every important pattern,
plus at least three modeled examples per pattern before expecting the learner to
solve independently.
