import { useProgressStore } from "../store";
import { Box } from "./terminal/Box";
import { useMemo } from "react";
import { useSmokey } from "../lib/useSmokey";
import { nowMs } from "../lib/daily";

export function WeeklyReport() {
  const attempts = useProgressStore((s) => s.attempts);
  const report = useSmokey();

  const metrics = useMemo(() => {
    const now = nowMs();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const fourteenDays = 14 * oneDay;

    const thisWeekAttempts = attempts.filter((a) => now - a.attemptedAt <= sevenDays);
    const lastWeekAttempts = attempts.filter(
      (a) => now - a.attemptedAt > sevenDays && now - a.attemptedAt <= fourteenDays
    );

    const twCount = thisWeekAttempts.length;
    const lwCount = lastWeekAttempts.length;

    const twCorrect = thisWeekAttempts.filter((a) => a.correct).length;
    const lwCorrect = lastWeekAttempts.filter((a) => a.correct).length;

    const twAccuracy = twCount > 0 ? Math.round((twCorrect / twCount) * 100) : 0;
    const lwAccuracy = lwCount > 0 ? Math.round((lwCorrect / lwCount) * 100) : 0;

    const twTime = thisWeekAttempts.reduce((sum, a) => sum + a.timeMs, 0);
    const lwTime = lastWeekAttempts.reduce((sum, a) => sum + a.timeMs, 0);

    const formatHours = (ms: number) => (ms / (1000 * 60 * 60)).toFixed(1);

    return {
      twCount,
      lwCount,
      countDiff: twCount - lwCount,
      twAccuracy,
      lwAccuracy,
      accuracyDiff: twCount > 0 && lwCount > 0 ? twAccuracy - lwAccuracy : 0,
      twHours: formatHours(twTime),
      lwHours: formatHours(lwTime),
      hasData: twCount > 0 || lwCount > 0,
    };
  }, [attempts]);

  if (!metrics.hasData) return null;

  const countDiffStr = metrics.countDiff >= 0 ? `+${metrics.countDiff}` : `${metrics.countDiff}`;
  const accuracyDiffStr = metrics.accuracyDiff >= 0 ? `+${metrics.accuracyDiff}%` : `${metrics.accuracyDiff}%`;

  // Find if there is a slipping topic
  const slippingAdvisory = report.advisories.find((a) => a.id === "slipping");

  return (
    <Box title="$ weekly-report --compare" variant="default">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        <div
          className="p-2 border"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div style={{ color: "var(--color-text-muted)" }} className="uppercase tracking-widest text-[9px] mb-1">
            attempts this week
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-2">
            <span>{metrics.twCount}</span>
            <span
              className="text-xs"
              style={{ color: metrics.countDiff >= 0 ? "var(--color-accent)" : "var(--color-danger)" }}
            >
              ({countDiffStr})
            </span>
          </div>
          <div style={{ color: "var(--color-text-dim)" }} className="text-[10px] mt-1">
            vs {metrics.lwCount} last week
          </div>
        </div>

        <div
          className="p-2 border"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div style={{ color: "var(--color-text-muted)" }} className="uppercase tracking-widest text-[9px] mb-1">
            weekly accuracy
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-2">
            <span>{metrics.twAccuracy}%</span>
            {metrics.lwCount > 0 && (
              <span
                className="text-xs"
                style={{ color: metrics.accuracyDiff >= 0 ? "var(--color-accent)" : "var(--color-danger)" }}
              >
                ({accuracyDiffStr})
              </span>
            )}
          </div>
          <div style={{ color: "var(--color-text-dim)" }} className="text-[10px] mt-1">
            vs {metrics.lwAccuracy}% last week
          </div>
        </div>

        <div
          className="p-2 border"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div style={{ color: "var(--color-text-muted)" }} className="uppercase tracking-widest text-[9px] mb-1">
            time spent
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-2">
            <span>{metrics.twHours}h</span>
          </div>
          <div style={{ color: "var(--color-text-dim)" }} className="text-[10px] mt-1">
            vs {metrics.lwHours}h last week
          </div>
        </div>
      </div>

      {slippingAdvisory && (
        <div
          className="mt-3 p-2 font-mono text-xs border"
          style={{
            borderColor: "var(--color-danger)",
            background: "rgba(220, 53, 69, 0.05)",
          }}
        >
          <span style={{ color: "var(--color-danger)" }}>[ALERT]</span> Focus area for next week:{" "}
          <span className="font-bold underline">
            {slippingAdvisory.text.split(" slipping")[0].split("'s")[0] || "weak spots"}
          </span>.{" "}
          Accuracy has dropped or attempts are flagging in this area.
        </div>
      )}
    </Box>
  );
}
