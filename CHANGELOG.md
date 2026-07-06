# Changelog

All notable changes to SmokyClaw Trainer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OSS scaffolding: MIT license, contributing guide, code of conduct, security
  policy, GitHub Actions CI, issue & PR templates, Dependabot, CODEOWNERS.
- **18 new verbal MCQs** (`aptitude-verbal-pack.json`) covering the real
  TCS NQT / Infosys verbal syllabus — reading comprehension, error spotting,
  sentence improvement, para jumbles, idioms, one-word substitution,
  active/passive, direct/indirect speech, tenses, prepositions, articles,
  vocabulary-in-context, and spelling. The verbal pool (30) now satisfies
  every mock-test blueprint (largest section needs 25).
- Full editorials for `py-c-001..003` — hints, examples, constraints, brute
  force, verified optimal solution, and complexity check for second-largest,
  valid-palindrome, and count-vowels.
- `estMinutes` on all 205 MCQs that were missing it (difficulty-based:
  easy 1 / medium 2 / hard 3), so the planner budgets real time per item.
  `pnpm validate` now passes with zero warnings.

### Fixed
- Toolchain: `packageManager` now pins pnpm 10 to match `pnpm-workspace.yaml`'s
  `allowBuilds` field — pnpm 9 rejected the file, breaking install and CI.
- Removed merge-conflict markers accidentally committed to
  `trainingMachine.test.ts` and reconciled the two test suites.
- `getStageSummaries`: a stage with zero items now counts as passed instead of
  permanently locking every later stage.
- `runPython` surfaces Pyodide load failures (CDN down / offline) as
  `result.error` instead of an unhandled rejection.
- sql.js wrapper: a rejected `initSqlJs` is no longer cached forever — the next
  run retries; the database handle is closed if schema seeding throws.
- Mock tests: removed a duplicate section auto-advance path and hook-order
  violations; per-question "shown at" stamping now happens at section
  transitions.
- CI: pnpm store caching actually enabled (`cache: pnpm`), duplicate build
  step removed.

## [0.2.0] - 2026-06-21

### Added
- **Machine-style training loop** — basics → mental model → recognition triggers
  → brute force → optimal template → edge cases → timed recall for every
  serious topic.
- **Mistake DNA dashboard & compressed rulebook** — surfaces the patterns you
  fail most often and condenses them into a one-page reference.
- **Stack vs Heap visualizer** — interactive in-browser memory reference for
  markdown lessons.
- **Content validation pipeline** — schema-level checks for lessons, MCQs,
  coding items, and SQL items so bad content can't ship.
- **Mock-test format library** — exact-format simulations for TCS NQT and
  Infosys SP (per-section timers, auto-submit, scoring).
- **smokey — local NLG coach** (`/coach`) — deterministic, template-based
  advisories generated from your own attempt log. No LLM, no network.
- **Comprehensive A-Z curriculum** — Level 0 Bootcamp and Level 3 Mastery
  tracks across all four pillars.
- **Company-prep content & mocks** — extra drills targeting TCS / Infosys /
  Wipro / Capgemini patterns.

### Changed
- Mobile-responsive fixes across the top bar, sidebar, and sandbox layouts.
- Sandbox `gaveUp` detection hardened; `nowMs` time checks centralised.
- Speed-challenge page compilation warnings resolved.

## [0.1.0] - 2026-05-01

### Added
- **Four training tracks** — Python, DSA & LeetCode patterns, SQL & DBMS,
  Aptitude & Reasoning.
- **In-browser code execution** — Python via Pyodide, SQL via sql.js (SQLite
  in WebAssembly). No server, no signup, no telemetry.
- **Spaced repetition (Leitner)** — 5-bucket queue (1d / 3d / 7d / 14d / 30d)
  with a dedicated Review page.
- **Bookmarks, streaks, progress** — per-track mastery %, daily streak,
  per-item bookmarking.
- **Adaptive study plans** — 1-week / 2-week / 1-month deadlines with a
  daily-minutes budget and weak-topic bias.
- **Pattern playlists** — curated DSA and SQL patterns with per-pattern
  progress.
- **Editorial flow** — progressive hints, brute-force reveal, optimal
  solution, complexity post-check, "give up" path that re-queues via
  Leitner.
- **Daily challenge + interview stopwatch** — date-seeded drill on Home and
  a stopwatch inside the coding/SQL sandbox.
- **ASCII attempt heatmap** — terminal-style contribution grid on Home and
  Progress.
- **Installable PWA** — Workbox service worker + web manifest, offline-capable
  after first load. Pyodide and sql.js stream from CDNs on first use.
- **Mobile bottom-nav** — thumb-reachable tab bar on phones.
- **Keyboard-first UX** — `⌘K` / `Ctrl K` command palette, `?` keymap,
  `g g / g p / g r / g s / g c / g b` vim-style navigation, `j` / `k` scroll.
- **Reading UX** — scroll progress bar, auto-highlighting TOC, adjustable
  font size, dark-grey code blocks.
- **Vercel deployment** with `vercel.json` SPA rewrite so client-side routes
  survive hard refresh.

[Unreleased]: https://github.com/therahul-yo/SmokyClaw-Trainer/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/therahul-yo/SmokyClaw-Trainer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/therahul-yo/SmokyClaw-Trainer/releases/tag/v0.1.0
