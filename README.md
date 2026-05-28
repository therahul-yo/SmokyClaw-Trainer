# 🦞 SmokyClaw Trainer

Solo prep tool for Indian campus hiring tests — TCS NQT, Infosys SP, Wipro Elite NLTH, Capgemini — with in-browser Python and SQL execution, spaced repetition for everything you got wrong, and exact mock-test formats with timers.

**Live:** [smokyclaw-trainer.vercel.app](https://smokyclaw-trainer.vercel.app/)

---

## What it does

- **Four tracks.** Python, DSA, SQL & DBMS, Aptitude & Reasoning. Each track has lessons (Markdown), MCQs, and hands-on problems.
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
- **100% local.** All progress persists in `localStorage` via Zustand. No backend, no telemetry, no account.

## Stack

- **React 19** + **TypeScript** + **Vite 8** + **Tailwind v4**
- **Zustand** (with `persist`) for state — progress, attempts, bookmarks, streaks, Leitner records
- **React Router v7** for SPA routing
- **Pyodide** for in-browser Python (CDN-loaded on first use, ~10MB cached)
- **sql.js** for in-browser SQLite
- **CodeMirror 6** (`@uiw/react-codemirror`) for the editor
- **react-markdown** + **rehype-highlight** for lessons
- Hosted on **Vercel**

## Project structure

```
src/
  routes/         # Page components (Home, Track, Lesson, Quiz, Sandbox, Review, Bookmarks, Progress, MockTest)
  components/     # Layout, sidebar, McqCard, CodingSandbox, SqlSandbox, ProgressBar, etc.
  store/          # Zustand stores: progress, streak, review queue, bookmarks
  lib/            # contentLoader, leitner, grader, pyodide, sqljs, mockTestFormats
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

See [CONTENT.md](./CONTENT.md) for the full authoring guide, the optional pedagogy schema (hints / examples / brute-force / optimal / complexity-check / companies), and the punch-list of patterns to author.

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
