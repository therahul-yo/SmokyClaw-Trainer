import { Link } from "react-router-dom";
import { useSmokey } from "../lib/useSmokey";
import { SEVERITY_COLOR } from "../lib/smokey";

// Compact coach strip for the home page: top advisory + a peek at the rest,
// linking through to the full /coach view.
export function SmokeyStrip() {
  const report = useSmokey();
  const top = report.advisories[0];
  const more = report.advisories.length - 1;

  return (
    <Link
      to="/coach"
      className="block px-3 py-2 font-mono transition-colors hover:brightness-110"
      style={{
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border-bright)",
        borderLeft: `2px solid ${top ? SEVERITY_COLOR[top.severity] : "var(--color-accent)"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--color-accent)" }} className="font-bold">
          smokey
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>·</span>
        {top ? (
          <span className="flex items-center gap-2 min-w-0">
            <span style={{ color: SEVERITY_COLOR[top.severity] }}>{top.icon}</span>
            <span
              className="truncate text-sm"
              style={{ color: "var(--color-text)" }}
            >
              {top.text}
            </span>
          </span>
        ) : (
          <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            {report.greeting}
          </span>
        )}
        <span
          className="ml-auto shrink-0 text-[10px] tabular-nums"
          style={{ color: "var(--color-text-muted)" }}
        >
          {more > 0 ? `+${more} more →` : "coach →"}
        </span>
      </div>
    </Link>
  );
}
