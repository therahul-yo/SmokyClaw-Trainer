import type { Approach } from "../types";
import { LessonRenderer } from "./LessonRenderer";

// Editorial reveal — brute-force first, then optimal. Shown after either:
//  (a) all tests pass, or
//  (b) user clicks "Give up & show solution".
// The "Show brute-force approach" variant (collapsed by default) can also
// be revealed *before* you start, to encourage the brute→optimal habit.
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
      <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]/40">
        <summary className="cursor-pointer px-3 py-2 text-sm text-[var(--color-warning)] select-none">
          🐢 Peek at the brute-force approach (recommended: code it first)
        </summary>
        <div className="p-3 border-t border-[var(--color-border)]">
          <ApproachBlock approach={bruteForce} label="Brute force" />
        </div>
      </details>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-4 space-y-4">
      <div className="font-semibold text-white">📘 Editorial</div>
      {bruteForce && <ApproachBlock approach={bruteForce} label="Brute force" />}
      {optimal && <ApproachBlock approach={optimal} label="Optimal" />}
      {!bruteForce && !optimal && fallback && (
        <div className="text-sm text-[var(--color-text-dim)]">
          <LessonRenderer body={fallback} />
        </div>
      )}
    </div>
  );
}

function ApproachBlock({ approach, label }: { approach: Approach; label: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label} · <span className="text-[var(--color-accent)]">{approach.complexity}</span>
      </div>
      <div className="text-sm text-[var(--color-text)] mb-2">
        <LessonRenderer body={approach.explanation} />
      </div>
      {approach.code && (
        <pre className="text-xs p-3 rounded bg-[#0a0d12] border border-[var(--color-border)] overflow-x-auto">
          <code>{approach.code}</code>
        </pre>
      )}
    </div>
  );
}
