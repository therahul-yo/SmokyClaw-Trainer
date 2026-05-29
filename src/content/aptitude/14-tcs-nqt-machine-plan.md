---
id: aptitude-14-tcs-nqt-machine-plan
title: TCS NQT machine preparation plan
track: aptitude
topic: company-prep
order: 14
estMinutes: 40
prerequisites: [aptitude-00-foundations, dsa-18-pattern-recognition-machine, python-30-interview-machine]
pattern: company-tcs-nqt
---

# TCS NQT machine preparation plan

TCS NQT preparation is not only DSA. It is a timed cognitive test plus coding
readiness. The learner must become fast at numerical, verbal, reasoning, and
basic implementation.

## Research basis

The official TCS iON Cognitive page lists this cognitive shape:

| Section | Questions | Time |
|---|---:|---:|
| Numerical Ability | 20 | 25 min |
| Verbal Ability | 25 | 25 min |
| Reasoning Ability | 20 | 25 min |

It also lists numerical topics such as number system, arithmetic, elementary
statistics, and data interpretation; verbal topics such as grammar and reading
comprehension; and reasoning topics such as word/numeric patterns, problem
solving, decision making, propositional reasoning, and visual/spatial reasoning.

Prep-market 2026 guides also commonly report an IT hiring variant with
Foundation sections plus advanced aptitude and two coding problems. Because
patterns vary by drive, train both cognitive-only and IT-full simulations.

## TCS failure modes

Most candidates fail in one of these ways:

1. Numerical section consumes too much time.
2. Reasoning is solved slowly because no elimination method is used.
3. Verbal is treated casually, then RC/grammar accuracy drops.
4. Coding solution passes sample tests but misses hidden edge cases.
5. Candidate knows the concept but cannot switch sections under timer pressure.

## Machine strategy

TCS needs this loop:

```text
classify section -> pick fastest method -> solve or skip -> protect time -> repair weak section
```

Do not train only accuracy. Train section movement.

## Numerical Ability

Target pace:

```text
20 questions / 25 minutes = 75 seconds per question
```

Priority topics:

| Topic | Machine method |
|---|---|
| Percentages | Convert to fractions, use original base |
| Profit/loss | CP, SP, profit, loss, percentage base |
| Time and work | Add work rates, not days |
| Time-speed-distance | Convert units before solving |
| Averages | Convert to total first |
| Ratios | Total parts -> one part -> target share |
| Number system | Divisibility, remainders, HCF/LCM |
| Data interpretation | Read table axis first, calculate only required value |

### Numerical skip rule

Skip immediately if:

- the calculation looks long and no option can be eliminated,
- the question needs more than two formulas,
- you are stuck after 45 seconds,
- units are unclear and options are far apart.

Come back only if time remains.

## Verbal Ability

Target pace:

```text
25 questions / 25 minutes = 60 seconds per question
```

Priority topics:

- reading comprehension
- grammar error spotting
- sentence correction
- para jumbles
- fill in the blanks
- vocabulary in context

### RC method

```text
Read question first.
Mark keyword.
Find matching sentence.
Eliminate extreme options.
Choose the option supported by text, not by personal opinion.
```

### Para jumble method

Find:

1. opening sentence,
2. pronoun references,
3. cause-effect links,
4. chronology,
5. conclusion sentence.

## Reasoning Ability

Target pace:

```text
20 questions / 25 minutes = 75 seconds per question
```

Priority topics:

- number series
- coding-decoding
- blood relations
- directions
- syllogism
- data sufficiency
- seating/arrangement basics
- visual/spatial reasoning

### Reasoning method

```text
Represent before calculating.
For relation questions, draw symbols.
For direction questions, draw axis.
For series, list difference, ratio, alternate pattern.
For syllogism, convert statements to diagrams.
```

## Programming Logic

TCS-style programming logic usually rewards fundamentals:

- loops
- conditions
- arrays
- strings
- output prediction
- time complexity basics
- Python/C/Java style syntax awareness

Train by tracing code manually:

```text
line -> variable state -> condition result -> loop update -> output
```

## Coding Round

Coding usually does not require extreme graph/DP first. The high-return patterns
are:

| Pattern | Examples |
|---|---|
| arrays | sum, second largest, rotate, kadane |
| strings | palindrome, anagram, compression, vowels |
| hashmap | two sum, frequency, first unique |
| simulation | story-based rules, counters |
| sorting | rank, merge, intervals basics |
| prefix/window | subarray sum, longest substring |

### Coding answer template

```python
def solve(...):
    # edge cases

    # state

    # loop / pattern

    # return exact type
```

Hidden tests usually attack:

- empty input,
- one value,
- duplicates,
- negative numbers,
- large input,
- no valid answer,
- boundary indexes.

## 14-day TCS plan

| Day | Work |
|---:|---|
| 1 | Numerical percentages, ratios, averages; one timed mini mock |
| 2 | Reasoning series, coding-decoding, blood relations |
| 3 | Verbal grammar, sentence correction, para jumbles |
| 4 | Python loops, arrays, strings, output tracing |
| 5 | Hashmap and frequency coding |
| 6 | TSD, time-work, DI |
| 7 | TCS cognitive mock, repair lowest section |
| 8 | Sliding window and prefix sums basics |
| 9 | Reasoning arrangements and syllogism |
| 10 | Verbal RC under timer |
| 11 | Two coding problems under 90 minutes |
| 12 | Advanced aptitude mixed set |
| 13 | Full TCS IT mock |
| 14 | Repair log, redo weak topics, final speed run |

## 30-day TCS plan

Repeat the 14-day plan twice, but in the second cycle:

- reduce numerical time per question,
- increase coding hidden-edge testing,
- add two full mocks per week,
- keep a mistake log by section.

## Mock strategy in SmokyClaw

Use:

- `tcs-nqt-cognitive` for official cognitive-style practice.
- `tcs-nqt-it-full` for Foundation + programming logic + advanced aptitude + coding pressure.
- `tcs-nqt` for the legacy mixed simulator already in the app.

## TCS readiness gate

Do not call yourself ready until:

```text
Numerical: 70%+ under timer
Reasoning: 75%+ under timer
Verbal: 75%+ under timer
Coding: 2 easy-medium problems in 90 minutes with edge cases
Mistake log: no repeated failure type for 3 days
```

## Source notes

- TCS iON NQT Cognitive official page: https://www.tcsion.com/hub/national-qualifier-test/cognitive-ability/
- TCS NQT 2026 prep-market pattern reference: https://bharatnqt.com/tcs-nqt-exam-pattern-2026/
