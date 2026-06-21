import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllLessons,
  getAllQuizItems,
  getTracks,
} from "../lib/contentLoader";
import { useFocusTrap } from "../lib/useFocusTrap";

type Command = {
  id: string;
  label: string;
  hint: string;
  kind: "page" | "track" | "lesson" | "item" | "action";
  action: () => void;
};

function fuzzyScore(needle: string, hay: string): number {
  if (!needle) return 1;
  needle = needle.toLowerCase();
  hay = hay.toLowerCase();
  if (hay.includes(needle)) {
    // Earlier match scores higher.
    return 100 - hay.indexOf(needle);
  }
  // Subsequence match: every needle char must appear in order.
  let hi = 0;
  let matched = 0;
  for (const c of needle) {
    const idx = hay.indexOf(c, hi);
    if (idx === -1) return 0;
    matched++;
    hi = idx + 1;
  }
  return matched / hay.length;
}

const KIND_COLOR: Record<Command["kind"], string> = {
  page: "var(--color-cyan)",
  track: "var(--color-accent)",
  lesson: "var(--color-amber)",
  item: "var(--color-text)",
  action: "var(--color-magenta)",
};

export function CommandPalette({
  open,
  onClose,
  initialMode,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "command" | "search";
}) {
  // Mount fresh each time it opens — state resets to empty/q=0 on mount, so no
  // reset-in-effect (which the render-purity lint flags) is needed.
  if (!open) return null;
  return <CommandPaletteInner onClose={onClose} initialMode={initialMode} />;
}

function CommandPaletteInner({
  onClose,
  initialMode,
}: {
  onClose: () => void;
  initialMode?: "command" | "search";
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = "cmd-palette-title";
  useFocusTrap(true, onClose, dialogRef);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  // The focus trap already moves focus into the dialog (to the input — it's
  // the first focusable), so this legacy effect is no longer required, but we
  // keep a defensive focus call so the caret lands even if the input mounts
  // after the initial microtask (e.g. filtered list rerenders).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build commands once (tracks/lessons/items are static at runtime).
  const commands = useMemo<Command[]>(() => {
    const tracks = getTracks();
    const lessons = getAllLessons();
    const items = getAllQuizItems();
    const out: Command[] = [];

    out.push(
      {
        id: "go:home",
        label: "go home",
        hint: "/",
        kind: "page",
        action: () => navigate("/"),
      },
      {
        id: "go:plan",
        label: "study plan",
        hint: "/plan",
        kind: "page",
        action: () => navigate("/plan"),
      },
      {
        id: "go:plan-setup",
        label: "new plan",
        hint: "/plan/setup",
        kind: "page",
        action: () => navigate("/plan/setup"),
      },
      {
        id: "go:review",
        label: "leitner review queue",
        hint: "/review",
        kind: "page",
        action: () => navigate("/review"),
      },
      {
        id: "go:bookmarks",
        label: "bookmarks",
        hint: "/bookmarks",
        kind: "page",
        action: () => navigate("/bookmarks"),
      },
      {
        id: "go:rulebook",
        label: "mistake dna & rulebook",
        hint: "/rulebook",
        kind: "page",
        action: () => navigate("/rulebook"),
      },

      {
        id: "go:progress",
        label: "progress stats",
        hint: "/progress",
        kind: "page",
        action: () => navigate("/progress"),
      },
      {
        id: "go:machine",
        label: "machine training loop",
        hint: "/machine",
        kind: "page",
        action: () => navigate("/machine"),
      },
      {
        id: "go:coach",
        label: "smokey — coach",
        hint: "/coach",
        kind: "page",
        action: () => navigate("/coach"),
      },
      {
        id: "go:mock-tcs-cognitive",
        label: "mock test — tcs cognitive",
        hint: "/mock/tcs-nqt-cognitive",
        kind: "page",
        action: () => navigate("/mock/tcs-nqt-cognitive"),
      },
      {
        id: "go:mock-tcs-it",
        label: "mock test — tcs it full",
        hint: "/mock/tcs-nqt-it-full",
        kind: "page",
        action: () => navigate("/mock/tcs-nqt-it-full"),
      },
      {
        id: "go:mock-infosys-irt",
        label: "mock test — infosys irt",
        hint: "/mock/infosys-irt",
        kind: "page",
        action: () => navigate("/mock/infosys-irt"),
      },
      {
        id: "go:mock-accenture",
        label: "mock test — accenture cognitive technical",
        hint: "/mock/accenture-cognitive-technical",
        kind: "page",
        action: () => navigate("/mock/accenture-cognitive-technical"),
      },
      {
        id: "go:sandbox-py",
        label: "python repl",
        hint: "/sandbox/python",
        kind: "page",
        action: () => navigate("/sandbox/python"),
      },
      {
        id: "go:sandbox-sql",
        label: "sql repl",
        hint: "/sandbox/sql",
        kind: "page",
        action: () => navigate("/sandbox/sql"),
      },
    );

    for (const t of tracks) {
      out.push({
        id: `track:${t.id}`,
        label: `${t.id}/`,
        hint: t.blurb.slice(0, 70),
        kind: "track",
        action: () => navigate(`/track/${t.id}`),
      });
    }

    for (const l of lessons) {
      out.push({
        id: `lesson:${l.id}`,
        label: l.title,
        hint: `${l.track}/${l.topic} · ${l.estMinutes}m`,
        kind: "lesson",
        action: () => navigate(`/lesson/${l.id}`),
      });
    }

    for (const it of items) {
      const preview =
        it.type === "mcq"
          ? it.question.slice(0, 60)
          : it.prompt.slice(0, 60);
      out.push({
        id: `item:${it.id}`,
        label: it.id,
        hint: `${it.track}/${it.topic} · ${it.type} · ${preview}`,
        kind: "item",
        action: () => navigate(`/quiz/${it.track}/${it.topic}`),
      });
    }

    return out;
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return commands.slice(0, 50);
    const scored = commands
      .map((c) => ({
        c,
        score: Math.max(
          fuzzyScore(q, c.label),
          fuzzyScore(q, c.hint) * 0.5,
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    return scored.map((x) => x.c);
  }, [q, commands]);

  // Clamp the active index against current results during render (no effect).
  const safeActive = Math.min(active, Math.max(0, filtered.length - 1));

  // Auto-scroll active row into view.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-idx="${safeActive}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const promptChar = initialMode === "search" ? "/" : ":";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-xl boot-in"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-accent)",
          boxShadow: "0 0 60px rgba(255, 140, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="sr-only">
          Command palette
        </h2>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: "1px solid var(--color-border-bright)" }}
        >
          <span
            className="font-mono font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            {promptChar}
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onClose();
              } else if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
                e.preventDefault();
                setActive((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                const cmd = filtered[safeActive];
                if (cmd) {
                  cmd.action();
                  onClose();
                }
              }
            }}
            placeholder="type to search · ↑/↓ navigate · ↵ select · esc cancel"
            className="flex-1 bg-transparent outline-none text-sm font-mono"
            style={{ color: "var(--color-text)" }}
          />
          <span
            className="text-[10px] tabular-nums"
            style={{ color: "var(--color-text-muted)" }}
          >
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto font-mono text-sm"
        >
          {filtered.length === 0 ? (
            <div
              className="px-3 py-8 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              // no matches
            </div>
          ) : (
            filtered.map((c, i) => {
              const activeRow = i === safeActive;
              return (
                <button
                  key={c.id}
                  data-cmd-idx={i}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.action();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-3 transition-colors"
                  style={{
                    background: activeRow
                      ? "rgba(255, 140, 0, 0.08)"
                      : "transparent",
                    borderLeft: `2px solid ${activeRow ? "var(--color-accent)" : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10px] uppercase w-12 shrink-0"
                    style={{ color: KIND_COLOR[c.kind] }}
                  >
                    {c.kind}
                  </span>
                  <span
                    className="flex-1 truncate"
                    style={{
                      color: activeRow
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    className="text-xs truncate max-w-[40%] text-right"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.hint}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <div
          className="px-3 py-1.5 text-[10px] flex justify-between"
          style={{
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>↑/↓ move · ↵ run · esc close</span>
          <span>cmd+k / ctrl+k toggle · ? for keys</span>
        </div>
      </div>
    </div>
  );
}
