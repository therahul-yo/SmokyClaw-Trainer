type Props = {
  value: number; // 0-100
  width?: number;
  variant?: "default" | "amber";
  showPercent?: boolean;
};

export function AsciiProgress({ value, width = 10, variant = "default", showPercent = false }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const color = variant === "amber" ? "var(--color-amber)" : "var(--color-accent)";
  return (
    <span className="inline-flex items-center gap-2 font-mono">
      <span style={{ color: "var(--color-text-muted)" }}>[</span>
      <span style={{ color, letterSpacing: "-1px" }}>{"█".repeat(filled)}</span>
      <span style={{ color: "var(--color-text-muted)", letterSpacing: "-1px" }}>{"░".repeat(empty)}</span>
      <span style={{ color: "var(--color-text-muted)" }}>]</span>
      {showPercent && (
        <span style={{ color: "var(--color-text-dim)" }} className="text-xs tabular-nums">
          {String(clamped).padStart(3, " ")}%
        </span>
      )}
    </span>
  );
}
