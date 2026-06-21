# Security Policy

## Supported versions

SmokyClaw Trainer is a small, solo-maintained PWA. Security patches are
applied to the latest released version. Older versions are not back-patched.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest| :x:                |

## Reporting a vulnerability

**Please do not file public issues for security problems.** A public issue
tells attackers where to look.

Instead, report privately by either:

1. **Opening a private security advisory** — go to
   `https://github.com/therahul-yo/SmokyClaw-Trainer/security/advisories/new`
   and use the GitHub private disclosure form. This keeps the conversation
   confidential until a fix is ready.
2. **Contacting the maintainer directly** — message **@therahul-yo** on
   GitHub. Use the "Report content / DM the maintainer" path so the message
   is not posted publicly.

If neither channel works, the fallback is to open a regular issue marked
clearly with a `[security]` prefix and **no exploit details** in the body;
the maintainer will convert it into a private thread.

### What to include

- A short description of the issue and its impact (what can an attacker do?).
- A minimal reproduction — URL, browser, steps. For code issues, a reduced
  test case.
- Affected version(s) and commit SHA(s) if you have them.
- Your assessment of severity (low / medium / high / critical) and reasoning.
- Whether you intend to disclose publicly, and on what timeline.

## Response timeline

This is a solo project, so the SLA is best-effort, not contractual.

| Stage                       | Target                          |
| --------------------------- | ------------------------------- |
| Acknowledgement             | within 7 days                   |
| Triage & severity decision  | within 14 days                  |
| Patch or documented deferral| within 30 days for high/critical|
| Public advisory (CVE)       | coordinated with the reporter   |

If you don't hear back within a week, ping the issue or follow up on the
private channel you used.

## Out-of-scope notes

SmokyClaw Trainer is a **100% client-side PWA**. The attack surface is
small, but worth being explicit about:

- **No backend, no auth, no telemetry.** There is nothing on a server to
  attack and no user data leaves the browser. Progress lives in
  `localStorage` on the user's own device.
- **Third-party CDNs** — Pyodide and sql.js stream from their public CDNs on
  first use inside the sandbox. A compromise of those CDNs would be a
  supply-chain risk to the in-browser Python / SQL execution paths. This
  is a known, accepted trade-off for a zero-backend app. If you want
  self-hosting, mirror the artifacts and update the loader URLs in
  `src/lib/`.
- **CodeMirror / React / Tailwind dependencies** — reported vulnerabilities
  in those packages are inherited. Dependabot opens weekly PRs; review
  and merge them quickly.
- **Out of scope for security reports:** content mistakes (typos, wrong
  answers in lessons) — use the
  [content error](../../issues/new?template=content_error.md) template.
  Disagreement with the difficulty of a problem, or with editorial style.
  Performance / size / accessibility — those are feature requests, not
  security issues (but please still file them).
- **In scope:** XSS in lesson Markdown, sandbox escapes (running attacker
  Python / SQL outside the intended scope), dependency vulnerabilities with
  a real exploit path, anything that would let a malicious lesson or
  pattern file compromise the host browser, and PWA / service-worker
  issues that let a stale cache serve tampered assets.

## Safe-harbour

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction,
  or service disruption.
- Only interact with accounts they own (or have explicit permission to
  test).
- Stop testing and report immediately if they find a vulnerability that
  exposes user data.
- Do not exploit a vulnerability beyond what is necessary to demonstrate it.

Thanks for keeping the project — and the people who use it to prep for
interviews — safe. 🦞
