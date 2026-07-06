type Props = {
  value: number; // 0-100
  width?: number; // legacy "character" width; the track renders width * 10 px
  variant?: "default" | "amber";
  showPercent?: boolean;
};

export function AsciiProgress({ value, width = 10, variant = "default", showPercent = false }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = variant === "amber" ? "var(--color-amber)" : "var(--color-accent)";
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 overflow-hidden"
        style={{
          width: `${width * 10}px`,
          background: "var(--color-border)",
          borderRadius: "999px",
        }}
      >
        <span
          className="block h-full transition-[width] duration-300"
          style={{ width: `${clamped}%`, background: color, borderRadius: "999px" }}
        />
      </span>
      {showPercent && (
        <span style={{ color: "var(--color-text-dim)" }} className="text-xs tabular-nums font-mono">
          {String(clamped).padStart(3, " ")}%
        </span>
      )}
    </span>
  );
}
