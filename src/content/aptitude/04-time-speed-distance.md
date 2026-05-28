---
id: apt-04-time-speed-distance
title: Time, speed, distance — and relative speed
track: aptitude
topic: quant
order: 4
estMinutes: 10
prerequisites: [apt-01-percentages]
pattern: apt-tsd
---

# Time, speed, distance

One formula: `distance = speed × time`. Everything else is units and frames.

## Unit conversions

```
1 km/h = 5/18 m/s
1 m/s  = 18/5 km/h = 3.6 km/h
```

Multiply km/h by 5/18 to get m/s. The opposite — m/s × 18/5 — gives km/h.

Memorize this. Half the questions buried in word problems hinge on a units flip.

## Average speed (the asymmetry trap)

If two equal *distances* are covered at speeds `a` and `b`:

```
Average speed = 2ab / (a + b)        ← harmonic mean
```

> Half the way at 40 km/h, the other half at 60. Average?
> 2 × 40 × 60 / (40 + 60) = 4800 / 100 = **48 km/h**.

NOT 50 (arithmetic mean). The slow leg eats more time, so its weight is higher.

If two equal *times* at speeds `a` and `b`, average = `(a + b) / 2` (arithmetic mean — because time is equal, distance scales linearly).

## Relative speed

Two objects, two cases:

- **Opposite directions** (toward each other, or away): relative speed = `v₁ + v₂`.
- **Same direction**: relative speed = `|v₁ − v₂|`.

> Two trains, 60 km/h and 40 km/h, opposite directions. Distance between them = 200 km. Time to meet?
> Relative speed = 100 km/h. Time = 200 / 100 = **2 hours**.

> Same example, same direction. Time for faster to catch slower (200 km gap)?
> Relative = 20 km/h. Time = 200 / 20 = **10 hours**.

## Trains crossing

The classic. Train length matters.

> A 200m train at 72 km/h crosses a stationary 100m platform. Time?

Distance covered = 200 + 100 = 300m. Speed = 72 km/h = 20 m/s. Time = 300/20 = **15 seconds**.

Rule:
- Train crosses a **point/pole**: distance = train length.
- Train crosses a **platform/bridge**: distance = train + platform length.
- Train **A crosses train B (opposite direction)**: distance = A + B; speed = sum of speeds.
- Train **A overtakes train B (same direction)**: distance = A + B; speed = difference of speeds.

## Boats & streams

Same shape as relative speed, with the river as the "other object."

- Boat speed in still water = `b`.
- Stream speed = `s`.
- **Downstream** speed = `b + s` (current helps).
- **Upstream** speed = `b − s` (current resists).

> Downstream 36 km in 3 h, upstream 24 km in 3 h. Boat speed and stream speed?
> Downstream = 12 km/h, upstream = 8 km/h.
> b = (12 + 8) / 2 = **10**; s = (12 − 8) / 2 = **2**.

## Round trip

> Distance 60 km. Going at 20 km/h, returning at 30 km/h. Total time?

Time out: 60/20 = 3h. Time back: 60/30 = 2h. Total = **5h**. Average speed = 120/5 = 24 km/h (matches harmonic mean: 2·20·30 / 50 = 24).

## Race problems

> A and B run 1 km. A beats B by 100m. So when A finishes 1000m, B has run 900m. Their speed ratio = **10:9**.

Convert "beats by" to "at the same time, A covered X, B covered X − beat." That gives the ratio of speeds.

## What interviewers ask

- A train 300m long passes a man running at 6 km/h in the same direction in 30 seconds. Train's speed?
  - Relative speed (train − man) = 300m / 30s = 10 m/s = 36 km/h. Train = 36 + 6 = **42 km/h**.
- Walking at 3/4 of usual speed, A is 10 min late. Usual time? Speed ratio old:new = 4:3, so time ratio 3:4. Extra time = 1 part = 10 min → usual time = **30 min**.
- Two cars start from A and B, 100 km apart, toward each other. Speeds 40 and 60. They meet in 1 hour at a point — how far from A? In 1h, the 40-car covered 40 km. **40 km from A**.

## Quick reference

| Setup | Formula |
|---|---|
| Same distance, two speeds | Avg = 2ab/(a+b) (harmonic) |
| Same time, two speeds | Avg = (a+b)/2 (arithmetic) |
| Trains meet, opposite direction | t = (L₁+L₂) / (v₁+v₂) |
| Train overtakes, same direction | t = (L₁+L₂) / (v₁−v₂) |
| Downstream / upstream | b±s |
| km/h ↔ m/s | × 5/18 or × 18/5 |
