---
id: apt-10-blood-relations
title: Blood relations — drawing the family tree
track: aptitude
topic: reasoning
order: 10
estMinutes: 8
prerequisites: []
pattern: apt-reasoning
---

# Blood relations

A staple of campus reasoning sections. The trick: **draw the family tree** instead of trying to track it in your head. With a tree, every question is "find the path between two nodes."

## The notation that saves time

```
Generation 1:   Grandparents
Generation 2:   Parents / Aunts / Uncles
Generation 3:   Person / Siblings / Cousins
Generation 4:   Children / Nieces / Nephews
Generation 5:   Grandchildren
```

Always draw vertically by generation. Horizontal links: siblings, spouses.

Symbols (use whatever, but be consistent):
- `M` / `F` (or square / circle) for gender.
- `=` for "married to."
- `|` going down for "parent of."

## Worked: chained statements

> A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?

Draw it:
- A and B are siblings (same generation, link horizontally).
- B and C are siblings.
- So A, B, C are all siblings.
- C → D (C is parent of D).
- A is the sibling of D's parent → A is D's **uncle** (since A is male per "brother of B").

## Worked: pointing-to-photo problems

> Pointing to a man, a woman said, "He is the son of the brother of my mother."

Draw it:
- Start at woman (W).
- "My mother" (M) — generation 2.
- "Brother of my mother" (B) — generation 2, sibling of M.
- "Son of B" (X) — generation 3, child of B.

W is in generation 3 (M is her parent). B is her uncle. X is her uncle's son — i.e., her **cousin**.

(Subtlety: "the brother of my mother" is a maternal uncle specifically, but in interview-speak just "uncle" is accepted.)

## Worked: "Showing a photograph to her son..."

> A woman showed a man a photograph and said, "He is the son of my husband's father's only son." Who is the man in the photo?

Trace:
- My husband's father — woman's father-in-law (F-I-L).
- F-I-L's only son — the woman's husband H (since H is the only son).
- "Son of H" — the woman's own son.

The man in the photo is **her son**.

## Tools for the test

| Term | Meaning |
|---|---|
| Paternal uncle | Father's brother |
| Maternal uncle | Mother's brother |
| Paternal aunt | Father's sister |
| Maternal aunt | Mother's sister |
| Nephew/Niece | Sibling's child |
| First cousin | Parent's sibling's child |
| Brother-in-law | Spouse's brother or sister's husband |
| Father-in-law | Spouse's father |

In Indian English / SSC questions, **"brother-in-law"** can mean spouse's brother, sister's husband, or even spouse's sister's husband. Watch the context.

## Common patterns

### "Coded relations"

> If `A + B` means `A is the father of B`, `A − B` means `A is the wife of B`, `A × B` means `A is the brother of B`, how is P related to S in `P + Q − R × S`?

Resolve right-to-left:
- `R × S`: R is brother of S.
- `Q − R`: Q is wife of R.
- `P + Q`: P is father of Q.

P is Q's father. Q is R's wife. R and S are siblings. So S is R's sibling, and R is married to Q (P's daughter). Therefore P is **S's father-in-law's wife's father** — wait, let's redo. P is Q's father. Q is married to R. S is R's sibling. So P is the father of S's sibling-in-law's wife. That makes P the **father-in-law of R**, and to S, P is **R's father-in-law** — which makes P S's **sibling's father-in-law**. There isn't a clean one-word answer; in practice the question would specify the relation it wants.

(If asked "P related to S": P's daughter Q is married to S's brother R. P is the "father of S's sister-in-law" — typically written as **father-in-law of S's brother**.)

### "Father's brother's son's wife"

Walk left-to-right:
- Father's brother → uncle.
- Uncle's son → cousin.
- Cousin's wife → **cousin's wife** (no single word — leave as is, that's the answer).

## Tips

1. **Always sketch.** Five seconds of pen saves a minute of confusion.
2. **Identify generations first.** "Father" jumps you up; "son" jumps you down; "brother / sister / spouse" keeps you on the same level.
3. **Track gender.** "Sibling" alone doesn't tell you uncle vs aunt.
4. **Watch "only."** "Only son" eliminates other siblings; "only daughter" is a constraint.
5. **Coded relations:** redefine the operators with normal terms, then trace.

## What interviewers ask

- A and B are siblings. C is A's mother. D is C's father. How is D related to B? D is B's grandfather.
- "He is the only son of my grandfather's only son." → He is the speaker himself (or the speaker's brother, if the speaker is female — but the question states "he"). Actually: grandfather's only son = my father. His only son = me (if male) or my brother. Since "he," he is the speaker, or the brother — depends on context.
- "She is my mother's mother-in-law." → She is the speaker's father's mother = paternal grandmother.
