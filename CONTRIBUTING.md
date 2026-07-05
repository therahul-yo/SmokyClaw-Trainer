# Contributing to SmokyClaw Trainer

Thanks for your interest in making SmokyClaw Trainer better. 🦞

This is a solo interview-training system aimed at Indian campus hiring tests
(TCS NQT, Infosys SP, Wipro Elite NLTH, Capgemini) and the Python / SQL /
aptitude / DSA patterns behind them. The fastest way to make it better is to
fix a problem, add a missing pattern, or improve an editorial.

All contributions — code, content, docs, bug reports — are welcome.

---

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [How to file a bug report](#how-to-file-a-bug-report)
- [How to suggest a feature](#how-to-suggest-a-feature)
- [Reporting a content error](#reporting-a-content-error)
- [How to submit a pull request](#how-to-submit-a-pull-request)
- [Development setup](#development-setup)
- [Adding content (lessons, MCQs, coding, SQL)](#adding-content)
- [Style guide](#style-guide)

---

## Code of Conduct

This project follows the [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md). By
participating, you agree to uphold it. Report unacceptable behaviour to the
maintainer via GitHub.

## How to file a bug report

Open a [Bug report](../../issues/new?template=bug_report.md). Please include:

- A clear, short title (`Quiz grading marks `len([]) == 1` as wrong`).
- Steps to reproduce (URL, what you clicked / typed, what you expected).
- Environment — OS, browser, Node version, whether you ran it as a PWA.
- Screenshots / screen recordings if it's a visual bug.
- A reduced reproduction if it's a code issue.

If the bug is a **security issue**, follow [SECURITY.md](./SECURITY.md) instead
of filing a public issue.

## How to suggest a feature

Open a [Feature request](../../issues/new?template=feature_request.md). Please
include:

- The **problem** you're trying to solve, framed as a user story.
- The **proposed solution** — what you'd like to see, with rough UX sketches
  or code paths if you have them.
- **Alternatives** you considered and why you didn't pick them.
- Anything else — a mockup, a competitor's approach, a related issue link.

Small, well-scoped features are easier to review than sweeping redesigns. If
you're not sure, open an issue first and we'll discuss before you invest.

## Reporting a content error

If a lesson, MCQ, coding prompt, or SQL drill is wrong, use the
[Content error](../../issues/new?template=content_error.md) template and
include:

- Track (Python / DSA / SQL / Aptitude).
- Topic (e.g. `sliding-window`, `joins`, `time-speed-work`).
- Item ID or lesson ID (visible in the URL or lesson frontmatter).
- What's wrong and what the correct content should be.
- Source / reference if you have one (LeetCode link, textbook, etc.).

## How to submit a pull request

1. **Fork** the repo and create a branch off `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/<short-slug>
   # or fix/<short-slug>, docs/<short-slug>, content/<short-slug>
   ```
2. **Make your change.** Keep commits atomic and well-scoped. One logical
   change per commit.
3. **Run the checks locally:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm check     # lint + validate + test + build
   pnpm build     # make sure the production build still works
   ```
4. **Commit message format** — Conventional Commits:
   ```
   type(scope): short summary

   Optional longer body explaining the why, wrapped at 72 cols.
   Reference the issue: Closes #123.
   ```
   Allowed `type`s: `feat`, `fix`, `docs`, `content`, `refactor`, `test`,
   `chore`, `ci`, `perf`. Lower-case summary, no trailing period.
5. **Push** your branch and **open a pull request** against `main`. Fill in
   the PR template — describe the change, the type, how you tested it, and
   tick the checklist.
6. Address review feedback by pushing new commits (don't force-push during
   review — it makes the diff harder to follow).

If your PR is in-progress and you want early feedback, mark it as a **Draft**
and tag the maintainer.

## Development setup

Requires **Node 20+** and **pnpm 10+** (Corepack picks the pinned version up
from `packageManager` in `package.json`).

```bash
git clone https://github.com/<you>/SmokyClaw-Trainer.git
cd SmokyClaw-Trainer
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # lint + validate + test + build
pnpm build        # tsc -b && vite build → dist/
pnpm preview      # serve dist/ locally
```

Pyodide and sql.js are loaded from their CDNs on first use inside the
sandbox. If you're offline, plan to pre-warm the browser cache once.

## Adding content

Content is plain Markdown + JSON. **Vite picks up new files automatically
via `import.meta.glob` — no wiring needed.**

Full authoring guide: [CONTENT.md](./CONTENT.md). Quick rules of thumb:

- **A new lesson** → drop a Markdown file into `src/content/<track>/` with
  the frontmatter shown in the README.
- **A new MCQ / coding / SQL item** → append to the relevant
  `src/data/quizzes/<track>.json`. Follow the existing schema exactly.
- **A new pattern** → add to `src/data/patterns.json`; the Patterns page and
  the planner pick it up automatically.
- Run `pnpm check` — the content validator will reject malformed entries.

If you're authoring a whole new track or sub-curriculum, open an issue first
so we can agree on the structure before you write 30 lessons into the void.

## Style guide

- **TypeScript** — strict mode is the goal (Phase 7 of the audit). Until
  then, follow existing patterns in the file you're editing. Don't relax
  the tsconfig to make a warning go away — fix the warning.
- **React 19** + **function components + hooks**. No class components.
- **Tailwind v4** for styling. Prefer utility composition over custom CSS;
  reach for `@apply` only when the same combo repeats 3+ times in one file.
- **Prettier** — once it lands (Phase 7), the formatter is the source of
  truth. Until then, match the file you're editing.
- **Naming** — `camelCase` for variables/functions, `PascalCase` for
  components and types, `kebab-case` for file and directory names except
  React components, which are `PascalCase.tsx`.
- **Comments** — explain *why*, not *what*. Code should read like prose;
  comments fill the gaps a reader can't infer.
- **No telemetry, no network calls.** The app is 100% local. PRs that
  introduce a backend, an analytics call, or a tracking pixel will be
  declined.

---

Thanks for helping make SmokyClaw Trainer sharper for the next candidate. 🦞
