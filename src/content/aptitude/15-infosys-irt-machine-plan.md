---
id: aptitude-15-infosys-irt-machine-plan
title: Infosys IRT and InfyTQ machine preparation plan
track: aptitude
topic: company-prep
order: 15
estMinutes: 42
prerequisites: [aptitude-00-foundations, python-30-interview-machine, sql-10-interview-machine]
pattern: company-infosys-irt
---

# Infosys IRT and InfyTQ machine preparation plan

Infosys preparation is different from pure LeetCode preparation. It rewards
logical reasoning, verbal accuracy, pseudocode tracing, puzzles, and clean basic
technical thinking.

## Research basis

Infosys official sample material includes quantitative/logical questions,
logical reasoning, verbal/critical reasoning, reading comprehension, pseudocode
output questions, and puzzle solving.

Prep-market 2026 breakdowns commonly describe sections such as:

| Section | Questions | Time |
|---|---:|---:|
| Logical Ability | 15 | 25 min |
| Technical Ability | 10 | 35 min |
| Verbal Ability | 20 | 20 min |
| Pseudocode | 5 | 10 min |
| Puzzle Solving | 4 | 10 min |
| English Grammar | 5 | 10 min |
| English Writing | 1 | 10 min |

Exact formats vary by on-campus/off-campus, Systems Engineer, DSE, SP, and
InfyTQ route. Train a general IRT mock plus pseudocode sprint.

## Infosys failure modes

1. Logical reasoning is underestimated.
2. Pseudocode is read like normal English instead of traced line by line.
3. Puzzle section consumes too much time.
4. Verbal answers are chosen by "sounds right" instead of grammar rule.
5. Technical interview answers are shallow after clearing the test.

## Machine strategy

```text
logic first -> trace pseudocode exactly -> protect puzzle time -> write clean technical explanations
```

## Logical Ability

High-priority topics:

- syllogism
- data sufficiency
- coding-decoding
- visual reasoning
- arrangements
- sequence/series
- statement and conclusion
- analytical puzzles

### Logic solving method

```text
Convert text into symbols.
Draw the smallest possible diagram.
Eliminate impossible options.
Do not carry assumptions not stated in the question.
```

## Technical Ability

Prepare breadth, not just coding:

| Area | Must know |
|---|---|
| OOP | class, object, inheritance, polymorphism, abstraction, encapsulation |
| DBMS | keys, joins, normalization, transactions, indexes |
| OS | process, thread, deadlock, memory basics |
| Networks | IP, TCP/UDP, HTTP, DNS basics |
| Programming | loops, arrays, strings, recursion basics, complexity |
| SDLC | testing, debugging, requirements, agile basics |

### Technical answer rule

For every concept, prepare:

```text
definition -> example -> why it matters -> common mistake
```

## Pseudocode section

Pseudocode is a CPU-tracing test.

Use this table:

| Code element | What to track |
|---|---|
| assignment | new variable value |
| if condition | true/false |
| loop | start, stop, increment |
| nested loop | outer value and inner value |
| function | arguments, return value |
| array | index and value |
| modulo | remainder |

### Pseudocode tracing method

```text
Create columns: step, variable values, condition result, output.
Update one line at a time.
Never mentally skip loop iterations until pattern is proven.
```

Example:

```text
a=6, b=3, c=2
if b>a and a>c and c>b
```

Trace:

```text
b>a -> 3>6 false
Whole AND condition false
Run else branch
```

The first false in an AND chain is enough to know the branch.

## Puzzle Solving

Puzzle questions reward structure.

Types:

- number grids
- missing number figures
- arrangements
- constraints with people/places
- pattern transformations

### Puzzle method

```text
Write givens.
Mark fixed facts.
List possible positions.
Apply constraints one by one.
Stop if no progress after 90 seconds.
```

For number figures, test:

- sum of outside numbers,
- product/difference,
- diagonal relation,
- square/cube relation,
- alternate operation.

## Verbal and grammar

Priority topics:

- reading comprehension
- sentence correction
- fill blanks
- para jumbles
- critical reasoning
- grammar error spotting
- one-word substitution

### Verbal method

```text
Find the grammatical role first.
Eliminate options that break subject-verb agreement, tense, article, or preposition.
For RC, choose only what the passage supports.
```

## English writing

For email/short writing tasks:

```text
Greeting
Purpose sentence
2-3 clear detail sentences
Action/request/closing
Polite sign-off
```

Keep it simple. Correct language beats decorative language.

## Coding for DSE/SP variants

If the role is DSE/SP or coding-heavy:

Priority patterns:

- arrays and strings
- hashmap/frequency
- sorting
- two pointers
- stack
- recursion basics
- simple dynamic programming

Prepare to explain:

```text
brute force -> repeated work -> optimized pattern -> complexity
```

## 14-day Infosys plan

| Day | Work |
|---:|---|
| 1 | Logical reasoning basics: syllogism, coding-decoding |
| 2 | Quant and data sufficiency |
| 3 | Pseudocode: conditions and loops |
| 4 | Pseudocode: arrays, nested loops, functions |
| 5 | Verbal grammar and sentence correction |
| 6 | Puzzle solving: number figures and arrangements |
| 7 | Infosys IRT mock, repair lowest section |
| 8 | Technical ability: OOP and DBMS |
| 9 | Technical ability: OS, networks, SDLC |
| 10 | Reading comprehension and critical reasoning |
| 11 | Pseudocode sprint under timer |
| 12 | Coding basics for DSE/SP variants |
| 13 | Full Infosys IRT mock |
| 14 | Interview answers: project, OOP, DBMS, code explanation |

## Mock strategy in SmokyClaw

Use:

- `infosys-irt` for full Systems Engineer-style preparation.
- `infosys-pseudocode-sprint` for output-tracing speed.
- `infosys-sp` for coding-heavy specialist practice.

## Infosys readiness gate

```text
Logical: 75%+
Pseudocode: 80%+ and no tracing skips
Verbal: 75%+
Technical: can explain OOP, DBMS, OS, networks basics
Puzzle: no more than 90 seconds stuck before skip
Coding variant: one easy-medium solution cleanly explained
```

## Source notes

- Infosys official sample test PDF: https://infytq.onwingspan.com/public-assets/InfosysCampusRecruitmentSampleTest-SystemsEngineer.pdf
- Infosys 2026 prep-market pattern reference: https://prepinsta.com/infosys-syllabus/
