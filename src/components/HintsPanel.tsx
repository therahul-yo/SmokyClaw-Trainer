import { useState, useEffect } from "react";

// Progressive-disclosure hints. Reveal one at a time; parent gets the count
// via onCountChange so it can persist hint usage on the next attempt.
// Reset between items is handled by the parent sandbox remounting us via
// `key={item.id}`, so a local reset effect is not needed.
export function HintsPanel({
  hints,
  onCountChange,
}: {
  hints: string[];
  onCountChange?: (n: number) => void;
}) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    onCountChange?.(revealed);
  }, [revealed, onCountChange]);

  if (hints.length === 0) return null;

  return (
    <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]/40">
      <summary className="cursor-pointer px-3 py-2 text-sm text-[var(--color-accent)] select-none">
        💡 Hints ({revealed}/{hints.length} shown)
      </summary>
      <div className="p-3 space-y-2 border-t border-[var(--color-border)]">
        {hints.slice(0, revealed).map((h, i) => (
          <div key={i} className="text-sm text-[var(--color-text)]">
            <span className="text-[var(--color-text-muted)] mr-1">Hint {i + 1}:</span>
            {h}
          </div>
        ))}
        {revealed < hints.length && (
          <button
            type="button"
            onClick={() => setRevealed((n) => n + 1)}
            className="px-2.5 py-1 rounded text-xs bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
          >
            Reveal hint {revealed + 1}
          </button>
        )}
      </div>
    </details>
  );
}
