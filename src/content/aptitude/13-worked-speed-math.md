---
id: aptitude-13-worked-speed-math
title: Worked examples: aptitude speed math
track: aptitude
topic: worked-examples
order: 13
estMinutes: 35
prerequisites: [aptitude-00-foundations, aptitude-12-speed-machine]
pattern: aptitude-worked-speed
---

# Worked examples: aptitude speed math

Aptitude speed comes from recognizing the topic and taking the shortest safe
path. This lesson shows the machine process.

## Example 1: Successive percentage change

Question:

```text
A price increases by 20% and then decreases by 20%.
What is the net percentage change?
```

### Classifier

Topic: percentage change.

Trap: increases and decreases are on different bases.

### Machine method

Use a base of 100.

```text
Start = 100
After 20% increase = 120
After 20% decrease = 120 - 24 = 96
Net change = 96 - 100 = -4
Answer = 4% decrease
```

### Mistake rule

Do not cancel `+20%` and `-20%`. Bases changed.

## Example 2: Reverse percentage

Question:

```text
After a 25% discount, a shirt costs 600.
What was the original price?
```

### Classifier

Discount means final is less than original.

### Formula

```text
final = original * (1 - discount)
600 = original * 0.75
original = 600 / 0.75 = 800
```

### Speed path

25% discount means customer pays 75%, which is `3/4`.

```text
3 parts = 600
1 part = 200
4 parts = 800
```

### Mistake rule

If final value is given after discount/increase, do reverse calculation. Do not
take the percentage of the final value.

## Example 3: Weighted average

Question:

```text
Class A has 20 students with average 70.
Class B has 30 students with average 80.
What is the combined average?
```

### Classifier

Average with unequal counts -> weighted average.

### Machine method

```text
Total marks A = 20 * 70 = 1400
Total marks B = 30 * 80 = 2400
Combined total = 3800
Combined count = 50
Average = 3800 / 50 = 76
```

### Mistake rule

Do not average `70` and `80` directly unless counts are equal.

## Example 4: Ratio shares

Question:

```text
A and B share money in ratio 3:5. If total is 640, find B's share.
```

### Machine method

```text
Total parts = 3 + 5 = 8
One part = 640 / 8 = 80
B = 5 parts = 5 * 80 = 400
```

### Mistake rule

Ratio is parts, not percentages. Convert total into one part first.

## Example 5: Time and work

Question:

```text
A can finish work in 12 days.
B can finish work in 18 days.
How many days together?
```

### Classifier

Topic: work rate.

### Machine method

```text
A one-day work = 1/12
B one-day work = 1/18
Together = 1/12 + 1/18
LCM 36 -> 3/36 + 2/36 = 5/36
Time = 36/5 = 7.2 days
```

### Mistake rule

Add rates, not days.

## Example 6: Relative speed

Question:

```text
Two trains of lengths 120m and 180m move in opposite directions at 40 km/h and 50 km/h.
How long to cross each other?
```

### Classifier

Topic: trains + relative speed.

### Machine method

```text
Total distance to cross = 120 + 180 = 300m
Relative speed = 40 + 50 = 90 km/h
Convert 90 km/h to m/s = 90 * 5/18 = 25 m/s
Time = distance / speed = 300 / 25 = 12 seconds
```

### Mistake rules

- Opposite direction means speeds add.
- Crossing distance is sum of train lengths.
- Convert units before dividing.

## Example 7: Probability from counting

Question:

```text
A bag has 3 red and 2 blue balls. One ball is picked. Probability of red?
```

### Machine method

```text
Favorable outcomes = 3
Total outcomes = 3 + 2 = 5
Probability = 3/5
```

### Extension

If two balls are picked without replacement:

```text
P(two red) = 3/5 * 2/4 = 6/20 = 3/10
```

### Mistake rule

Without replacement means the total changes after each pick.

## Aptitude machine checklist

For every timed question:

```text
Classify topic.
Write knowns and unknown.
Pick formula.
Estimate answer range.
Calculate with units.
Eliminate impossible options.
Stop if time crosses the limit.
```

This is how aptitude becomes score production instead of slow calculation.
