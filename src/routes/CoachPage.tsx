import { Link } from "react-router-dom";
import { useSmokey } from "../lib/useSmokey";
import { SEVERITY_COLOR } from "../lib/smokey";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { BracketButton } from "../components/terminal/BracketButton";

export function CoachPage() {
  const report = useSmokey();
  const { advisories, readiness, stats } = report;

  return (
    <div className="space-y-4">
      <Prompt path="~/coach">
        <span>smokey --watch ~/attempts</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        smokey
        <span
          style={{ color: "var(--color-text-muted)" }}
          className="text-sm ml-2"
        >
          // local coach · reads your log, never the cloud
        </span>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <Stat label="attempts" value={String(stats.total)} />
        <Stat label="last 7d" value={String(stats.last7)} />
        <Stat label="accuracy" value={`${stats.accuracy}%`} accent={stats.accuracy >= 70} />
        <Stat label="streak" value={`${stats.streak}d`} accent={stats.streak > 0} />
      </div>

      {/* advisories */}
      <Box
        title="$ smokey --advise"
        trailing={`${advisories.length} note${advisories.length === 1 ? "" : "s"}`}
      >
        <div className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          {report.greeting}
        </div>
        {advisories.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            // all quiet. solve a few problems and i'll have something to say.
          </div>
        ) : (
          <div className="space-y-2">
            {advisories.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 px-3 py-2"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderLeft: `2px solid ${SEVERITY_COLOR[a.severity]}`,
                }}
              >
                <span
                  className="font-mono"
                  style={{ color: SEVERITY_COLOR[a.severity] }}
                >
                  {a.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm" style={{ color: "var(--color-text)" }}>
                    <span
                      className="mr-1 font-bold"
                      style={{ color: "var(--color-accent)" }}
                    >
                      smokey&gt;
                    </span>
                    {a.text}
                  </div>
                </div>
                {a.cta && (
                  <Link to={a.cta.to} className="shrink-0">
                    <BracketButton>{a.cta.label}</BracketButton>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </Box>

      {/* readiness */}
      <Box title="$ smokey --readiness" trailing="mock ETAs">
        <div className="space-y-3 font-mono text-sm">
          {readiness.map((r) => {
            const eta =
              r.etaDays === 0
                ? "ready"
                : r.etaDays
                  ? `~${r.etaDays}d`
                  : "no ETA yet";
            return (
              <div key={r.id} className="flex items-center gap-3">
                <Link
                  to={`/mock/${r.id}`}
                  className="w-28 truncate underline"
                  style={{ color: "var(--color-cyan)" }}
                >
                  {r.title}
                </Link>
                <AsciiProgress value={r.pct} width={28} showPercent />
                <span
                  className="ml-auto text-xs tabular-nums"
                  style={{
                    color:
                      r.etaDays === 0
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {eta}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
          // readiness = mastered share of each mock's item pool · ETA from your last-7-day pace
        </div>
      </Box>

      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        smokey is deterministic NLG — it generates these lines from your own
        attempt data, entirely in your browser. nothing is sent anywhere.
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="px-3 py-2"
      style={{
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border-bright)",
      }}
    >
      <div
        className="text-[10px] tracking-widest uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold tabular-nums crt-glow"
        style={{ color: accent ? "var(--color-accent)" : "var(--color-text)" }}
      >
        {value}
      </div>
    </div>
  );
}
