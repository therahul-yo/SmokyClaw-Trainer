import { useState } from "react";
import type { ComplexityChoice } from "../types";
import { BracketButton } from "./terminal/BracketButton";

export function ComplexityCheck({
  question,
  choices,
  onPass,
  onSkip,
}: {
  question: string;
  choices: ComplexityChoice[];
  onPass: () => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const pickedChoice = picked !== null ? choices[picked] : null;

  return (
    <div
      className="p-4 space-y-3 font-mono"
      style={{
        border: "1px solid var(--color-cyan)",
        background: "rgba(102, 227, 255, 0.04)",
      }}
    >
      <div
        className="text-sm font-bold"
        style={{ color: "var(--color-cyan)" }}
      >
        ── COMPLEXITY CHECK ──────────────────────────
      </div>
      <div className="text-sm" style={{ color: "var(--color-text)" }}>
        {question}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {choices.map((c, i) => {
          let border = "var(--color-border-bright)";
          let bg = "transparent";
          let fg = "var(--color-text)";
          const isPicked = picked === i;
          if (isPicked) {
            if (showResult) {
              border = c.correct ? "var(--color-success)" : "var(--color-danger)";
              bg = c.correct
                ? "rgba(92, 255, 159, 0.07)"
                : "rgba(255, 95, 86, 0.07)";
              fg = c.correct ? "var(--color-success)" : "var(--color-danger)";
            } else {
              border = "var(--color-cyan)";
              fg = "var(--color-cyan)";
            }
          } else if (showResult && c.correct) {
            border = "var(--color-success)";
            fg = "var(--color-success)";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={showResult}
              onClick={() => setPicked(i)}
              className="px-3 py-2 text-left transition-colors hover:brightness-110 disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${border}`,
                background: bg,
                color: fg,
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>
                [{String.fromCharCode(65 + i)}]
              </span>{" "}
              {c.label}
              {showResult && c.correct && " ✓"}
            </button>
          );
        })}
      </div>
      {showResult ? (
        <div className="flex items-center justify-between text-sm">
          <span
            style={{
              color: pickedChoice?.correct
                ? "var(--color-success)"
                : "var(--color-amber)",
            }}
          >
            {pickedChoice?.correct
              ? "// correct."
              : "// not quite — see editorial."}
          </span>
          <BracketButton variant="primary" onClick={onPass}>
            show editorial →
          </BracketButton>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <BracketButton
            variant="primary"
            disabled={picked === null}
            onClick={() => setShowResult(true)}
          >
            check
          </BracketButton>
          <BracketButton variant="ghost" onClick={onSkip}>
            skip
          </BracketButton>
        </div>
      )}
    </div>
  );
}
