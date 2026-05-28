import type { Approach } from "../types";
import { LessonRenderer } from "./LessonRenderer";

export function EditorialReveal({
  bruteForce,
  optimal,
  fallback,
  variant = "post-solve",
}: {
  bruteForce?: Approach;
  optimal?: Approach;
  fallback?: string;
  variant?: "post-solve" | "pre-solve";
}) {
  if (!bruteForce && !optimal && !fallback) return null;

  if (variant === "pre-solve") {
    if (!bruteForce) return null;
    return (
      <details
        style={{
          border: "1px solid var(--color-amber-dim)",
          background: "rgba(255, 176, 0, 0.04)",
        }}
      >
        <summary
          className="cursor-pointer px-3 py-1.5 text-sm select-none font-mono"
          style={{ color: "var(--color-amber)" }}
        >
          ▸ peek brute-force (recommended: write yours first)
        </summary>
        <div
          className="p-3"
          style={{ borderTop: "1px solid var(--color-amber-dim)" }}
        >
          <ApproachBlock approach={bruteForce} label="brute-force" />
        </div>
      </details>
    );
  }

  return (
    <div
      className="p-4 space-y-4"
      style={{
        border: "1px solid var(--color-accent)",
        background: "rgba(92, 255, 159, 0.04)",
      }}
    >
      <div
        className="font-bold font-mono text-sm crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        ── EDITORIAL ─────────────────────────────────
      </div>
      {bruteForce && <ApproachBlock approach={bruteForce} label="brute-force" />}
      {optimal && <ApproachBlock approach={optimal} label="optimal" />}
      {!bruteForce && !optimal && fallback && (
        <div
          className="text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <LessonRenderer body={fallback} />
        </div>
      )}
    </div>
  );
}

function ApproachBlock({ approach, label }: { approach: Approach; label: string }) {
  return (
    <div>
      <div className="text-xs font-mono mb-1">
        <span style={{ color: "var(--color-text-muted)" }}>// {label} · </span>
        <span style={{ color: "var(--color-accent)" }}>{approach.complexity}</span>
      </div>
      <div className="text-sm mb-2" style={{ color: "var(--color-text)" }}>
        <LessonRenderer body={approach.explanation} />
      </div>
      {approach.code && (
        <pre
          className="text-xs p-3 overflow-x-auto"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border-bright)",
            color: "var(--color-text)",
          }}
        >
          <code>{approach.code}</code>
        </pre>
      )}
    </div>
  );
}
