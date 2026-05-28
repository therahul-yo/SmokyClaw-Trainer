import { useState, useEffect } from "react";

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
        ▸ hints ({revealed}/{hints.length} shown)
      </summary>
      <div
        className="p-3 space-y-2 text-sm font-mono"
        style={{ borderTop: "1px solid var(--color-amber-dim)" }}
      >
        {hints.slice(0, revealed).map((h, i) => (
          <div key={i} style={{ color: "var(--color-text)" }}>
            <span style={{ color: "var(--color-amber)" }}>
              hint[{i + 1}]
            </span>
            <span style={{ color: "var(--color-text-muted)" }}> // </span>
            {h}
          </div>
        ))}
        {revealed < hints.length && (
          <button
            type="button"
            onClick={() => setRevealed((n) => n + 1)}
            className="text-xs px-2 py-0.5 transition-colors hover:brightness-110"
            style={{
              background: "transparent",
              border: "1px solid var(--color-amber-dim)",
              color: "var(--color-amber)",
            }}
          >
            [ reveal hint {revealed + 1} ]
          </button>
        )}
      </div>
    </details>
  );
}
