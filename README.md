# 🦞 SmokyClaw Trainer

[![CI](https://github.com/therahul-yo/SmokyClaw-Trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/therahul-yo/SmokyClaw-Trainer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/therahul-yo/SmokyClaw-Trainer)](https://github.com/therahul-yo/SmokyClaw-Trainer)
[![Live](https://img.shields.io/badge/Live-smokyclaw--trainer.vercel.app-blue)](https://smokyclaw-trainer.vercel.app/)

Solo interview-training system for Indian campus hiring tests and coding rounds
— TCS NQT, Infosys SP, Wipro Elite NLTH, Capgemini, Python, SQL, aptitude, and
DSA/LeetCode patterns — with in-browser Python and SQL execution, spaced
repetition for everything you got wrong, and exact mock-test formats with
timers.

The goal is to train the learner from basics to automatic execution: learn the
foundation, recognize the pattern, write the template, handle edge cases,
explain complexity, and repeat weak areas until they become fast.

**Live:** [smokyclaw-trainer.vercel.app](https://smokyclaw-trainer.vercel.app/)

---

## 🚀 Try it now

**[→ smokyclaw-trainer.vercel.app](https://smokyclaw-trainer.vercel.app/)**

No signup, no install. Runs entirely in your browser. Save your progress to your device.

![SmokyClaw Trainer home page](docs/screenshot-home.png)

---

## What it does

- **Four tracks from basics upward.** Python, DSA & LeetCode patterns, SQL & DBMS, Aptitude & Reasoning. Each track has lessons (Markdown), MCQs, and hands-on problems.
- **Machine-style training loop.** Each serious topic is designed around basics → mental model → recognition triggers → brute force → optimal template → edge cases → timed recall.
- **Run code in the browser.** Python problems run on Pyodide (CPython compiled to WebAssembly) — no server, no signup. Test cases are graded against your function's return value.
- **Run SQL in the browser.** SQL problems run on sql.js (SQLite in WASM) against bundled `employees` and `ecommerce` schemas. Your result set is diffed against the expected output.
- **Spaced repetition (Leitner).** Anything you get wrong is added to a 5-bucket Leitner queue (1d / 3d / 7d / 14d / 30d). The Review page surfaces only what's due.
- **Mock tests.** Exact-format simulations:
  - **TCS NQT** — Numerical (25/25min), Verbal (24/25min), Reasoning (30/50min), Programming Logic (10/15min), Coding (2 problems / 30min).
  - **Infosys SP** — Math (10/35min), Logical (15/25min), Verbal (20/20min), Pseudocode (5/10min), Coding (1 problem / 45min).
  - Per-section timers, auto-submit, scoring per section.
- **Bookmarks, streaks, progress.** Per-track mastery %, daily streak, bookmark anything for targeted review.
- **Adaptive study plans.** Pick a 1-week / 2-week / 1-month deadline and a daily-minutes budget; the planner lays out lessons + drills + Leitner-due items every day, biased toward the topics you score weakest on.
- **Pattern playlists.** Curated DSA patterns (two-pointer, sliding window, hashing, DP, graphs, ...) and SQL patterns (joins, window functions, CTEs) with per-pattern progress.
- **Editorial flow.** Every coding/SQL drill ships with progressive hints, brute-force-first reveal, optimal solution + complexity, a "what's the time complexity?" post-pass check, and a "give up & show solution" path that demotes the item back into Leitner.
- **smokey — a local coach.** A `/coach` page (and a compact strip on Home) that reads your own attempt history and writes plain-English advisories: cold-start nudges, streak-risk/streak-win callouts, "you're slipping on sliding-window," retention reminders for things you got right but haven't seen in a week, avoidance flags (lessons read but never drilled), mastery wins, your best study window, and per-mock readiness with an ETA. It's NLG (generation from templates over detectors), **not** an LLM — deterministic, and nothing leaves the browser.
- **Daily challenge + interview stopwatch.** A date-seeded daily drill on Home, and a stopwatch in the coding/SQL sandbox so you can feel the clock the way a real round does.
- **ASCII attempt heatmap.** A terminal-style contribution grid of your practice history on Home and the Progress page.
- **Installable PWA + mobile nav.** Add it to your home screen (an install button appears when the browser supports it) and it runs offline as a standalone app, with a thumb-reachable bottom tab bar on phones. Pyodide / sql.js still stream from their CDNs on first use.
- **Keyboard-first.** `⌘K` / `Ctrl K` opens a command palette (`/` for search mode), `?` shows the keymap, and vim-style `g g / g p / g r / g s / g c / g b` jump between Home, Plan, Review, Progress, smokey, and Bookmarks. `j` / `k` scroll.
- **Reading UX.** Lessons have a scroll-progress bar, an auto-highlighting table of contents, adjustable font size, and dark-grey code blocks for readability.
- **100% local.** All progress persists in `localStorage` via Zustand. No backend, no telemetry, no account.

## Stack

- **React 19** + **TypeScript** + **Vite 8** + **Tailwind v4**
- **Zustand** (with `persist`) for state — progress, attempts, bookmarks, streaks, Leitner records
- **React Router v7** for SPA routing
- **Pyodide** for in-browser Python (CDN-loaded on first use, ~10MB cached)
- **sql.js** for in-browser SQLite
- **CodeMirror 6** (`@uiw/react-codemirror`) for the editor
- **react-markdown** + **rehype-highlight** for lessons
- **vite-plugin-pwa** (Workbox service worker + web manifest) for offline/installable PWA
- Hosted on **Vercel**

## Project structure

```
src/
  routes/         # Page components (Home, Track, Lesson, Quiz, Sandbox, Review, Bookmarks, Progress, MockTest, Coach, Plan, Patterns)
  components/     # Layout, sidebar, McqCard, CodingSandbox, SqlSandbox, ProgressBar, etc.
  store/          # Zustand stores: progress, streak, review queue, bookmarks
  lib/            # contentLoader, leitner, grader, pyodide, sqljs, mockTestFormats, smokey (local coach), planner
  content/        # Lessons as Markdown with frontmatter (python/, dsa/, sql/, aptitude/)
  data/
    tracks.json
    quizzes/      # MCQ + coding + SQL items as JSON
    sql-schemas/  # SQLite seed schemas (employees, ecommerce, social)
    patterns.json # DSA / SQL / Python pattern catalog (drives PatternsPage + planner)
public/
  favicon.svg     # 🦞
vercel.json       # SPA rewrite to /index.html
```

## Run locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # tsc -b && vite build → dist/
pnpm preview      # serve dist/ locally
pnpm lint
```

## Adding content

See [CURRICULUM.md](./CURRICULUM.md) for the training path and [CONTENT.md](./CONTENT.md) for the full authoring guide, the optional pedagogy schema (hints / examples / brute-force / optimal / complexity-check / companies), and the punch-list of patterns to author.

**A new lesson:** drop a Markdown file into `src/content/<track>/` with frontmatter:

```md
---
id: python-08-comprehensions
title: List Comprehensions
track: python
topic: syntax
order: 8
estMinutes: 6
prerequisites: [python-02-data-types]
---

Lesson body in Markdown…
```

**A new quiz item:** append to the relevant `src/data/quizzes/<track>.json`. Schemas:

- MCQ: `{ id, track, topic, type: "mcq", difficulty, question, options, answerIndex, explanation, tags }`
- Coding: `{ id, track, topic, type: "coding", language: "python", difficulty, prompt, starter, entry, tests: [{ args, expect }], tags }`
- SQL: `{ id, track, topic, type: "sql", difficulty, prompt, schema: "employees" | "ecommerce", expected: { columns, rows }, tags }`

Vite picks up new content automatically via `import.meta.glob`.

## Deploy

Currently deployed via Vercel CLI (`vercel deploy --prod`). To enable git-based auto-deploy, link this repo in the Vercel project's **Settings → Git → Connect Git Repository**.

`vercel.json` rewrites every path to `/index.html` so client-side routes (`/track/python`, `/quiz/...`, `/mock/...`) survive a hard refresh.

## License

Personal project. Use it, fork it, learn from it.
