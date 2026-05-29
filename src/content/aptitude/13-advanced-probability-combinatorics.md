---
id: aptitude-13-advanced-probability-combinatorics
title: Advanced probability & combinatorics (Bayes' & Stars & Bars)
track: aptitude
topic: quant
order: 13
estMinutes: 20
prerequisites: [aptitude-09-probability]
---

# Advanced probability & combinatorics (Bayes' & Stars & Bars)

Advanced quantitative assessment rounds test your capability to solve conditional events and complex arrangements.

---

## 1. Bayes' Theorem (Conditional Probability)

Bayes' Theorem calculates the probability of an event based on prior knowledge of conditions related to the event.

$$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$$

Where:
*   **$P(A \mid B)$**: Posterior probability (probability of $A$ occurring given that $B$ has already occurred).
*   **$P(B \mid A)$**: Likelihood (probability of $B$ occurring given that $A$ is true).
*   **$P(A)$**: Prior probability of event $A$.
*   **$P(B)$**: Total probability of event $B$.

### Practical Interview Example
Suppose $1\%$ of the population has a certain disease. A test for this disease is $99\%$ accurate (correctly tests positive $99\%$ of the time for sick patients, and correctly tests negative $99\%$ of the time for healthy patients).
If a patient tests positive, what is the probability they actually have the disease?

1.  **Define events**:
    *   $S$: Patient is sick ($P(S) = 0.01$).
    *   $H$: Patient is healthy ($P(H) = 0.99$).
    *   $+$: Test is positive.
2.  **Gather terms**:
    *   $P(+ \mid S) = 0.99$ (True positive rate).
    *   $P(+ \mid H) = 0.01$ (False positive rate).
3.  **Calculate Total Probability $P(+)$**:
    *   $$P(+) = P(+ \mid S) \cdot P(S) + P(+ \mid H) \cdot P(H)$$
    *   $$P(+) = (0.99 \times 0.01) + (0.01 \times 0.99) = 0.0099 + 0.0099 = 0.0198$$
4.  **Apply Bayes' Theorem**:
    *   $$P(S \mid +) = \frac{P(+ \mid S) \cdot P(S)}{P(+)} = \frac{0.0099}{0.0198} = 0.5 \text{ (or } 50\%)$$

Even though the test is $99\%$ accurate, if you test positive, there is only a **$50\%$ chance** you are sick because the disease is so rare!

---

## 2. Stars & Bars (Partitioning Identical Items)

In combinatorics, the **Stars and Bars** method is a graphical way to solve partition problems where you need to distribute $n$ identical items into $k$ distinct bins.

### Case 1: Each bin must receive at least 1 item (Positive Integers)
Imagine we have 7 identical coins (Stars `*`) and want to distribute them to 3 children (Bins).
To divide the 7 stars into 3 bins, we must place **2 dividers** (Bars `|`) in the spaces between the stars.

```text
Stars:      *   *   *   *   *   *   *
Spaces:       ^   ^   ^   ^   ^   ^
Dividers:       |       |
Result:    Child 1: 2 coins | Child 2: 3 coins | Child 3: 2 coins
```

There are $n-1$ spaces, and we must choose $k-1$ of them to place our dividers:
$$\text{Ways} = \binom{n-1}{k-1}$$

### Case 2: Bins can receive 0 items (Non-Negative Integers)
If a bin can be empty, we treat the dividers and stars as elements in a single combined sequence.
We have $n$ stars and $k-1$ bars. We choose the positions of the bars out of the total $n + k - 1$ slots:
$$\text{Ways} = \binom{n + k - 1}{k - 1}$$

---

## 3. Derangements (Perfect Confusions)

A **derangement** is a permutation of elements such that no element appears in its original position.
*   *Example*: 4 letters are placed into 4 addressed envelopes at random. What is the probability that **zero** letters go to the correct envelope?

The number of derangements of $n$ items, denoted $D_n$, is calculated as:
$$D_n = n! \sum_{i=0}^n \frac{(-1)^i}{i!} = n! \left( 1 - 1 + \frac{1}{2!} - \frac{1}{3!} + \frac{1}{4!} - \dots + \frac{(-1)^n}{n!} \right)$$

For small values of $n$:
*   $D_1 = 0$
*   $D_2 = 1$
*   $D_3 = 2$
*   $D_4 = 9$
*   $D_5 = 44$
*   $D_6 = 265$

### Derangement Probability
As $n$ gets large, the probability of a random permutation being a derangement approaches:
$$\lim_{n \to \infty} \frac{D_n}{n!} = \frac{1}{e} \approx 0.36787 \text{ (or } 36.8\%)$$
