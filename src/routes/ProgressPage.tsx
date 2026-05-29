import { useMemo, useRef, useState } from "react";
import {
  exportAllStores,
  importAllStores,
  resetAllStores,
  useProgressStore,
  useStreakStore,
  useThinkingStore,
} from "../store";
import { getAllQuizItems, getTracks } from "../lib/contentLoader";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { AttemptHeatmap } from "../components/AttemptHeatmap";
import { MISTAKE_TAGS } from "../lib/thinkingTrace";

export function ProgressPage() {
  const attempts = useProgressStore((s) => s.attempts);
  const recognitionAttempts = useProgressStore((s) => s.recognitionAttempts);
  const thinkingTraces = useThinkingStore((s) => s.traces);
  const streak = useStreakStore((s) => s.currentStreak);
  const longest = useStreakStore((s) => s.longestStreak);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");

  const tracks = getTracks();
  const allItems = getAllQuizItems();

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Mistake DNA calculation
  const mistakeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const trace of Object.values(thinkingTraces)) {
      if (trace.mistakeTags) {
        for (const tag of trace.mistakeTags) {
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [thinkingTraces]);

  const sortedMistakeTags = useMemo(() => {
    return Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);
  }, [mistakeCounts]);

  // Recognition stats calculation
  const recognitionStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number; totalTimeMs: number }> = {};
    for (const a of recognitionAttempts) {
      const pattern = a.pattern || "unclassified";
      if (!stats[pattern]) {
        stats[pattern] = { total: 0, correct: 0, totalTimeMs: 0 };
      }
      stats[pattern].total += 1;
      if (a.correct) stats[pattern].correct += 1;
      stats[pattern].totalTimeMs += a.timeMs;
    }
    return stats;
  }, [recognitionAttempts]);

  const handleExport = () => {
    const blob = new Blob([exportAllStores()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smokyclaw-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      importAllStores(text);
      setImportMsg("✓ progress restored from file");
    } catch (e) {
      setImportMsg(`✗ import failed: ${String(e)}`);
    }
  };

  return (
    <div className="space-y-4">
      <Prompt path="~/progress">
        <span>stat --verbose</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        progress.log
        <span
          style={{ color: "var(--color-text-muted)" }}
          className="text-sm ml-2"
        >
          // 100% local — export to backup
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <Stat label="streak" value={`${streak}d`} accent />
        <Stat label="longest" value={`${longest}d`} />
        <Stat label="attempts" value={String(totalAttempts)} />
        <Stat
          label="accuracy"
          value={`${accuracy}%`}
          accent={accuracy >= 70}
        />
      </div>

      <Box title="$ heatmap --last 91d">
        <AttemptHeatmap attempts={attempts} weeks={13} />
      </Box>

      <Box title="$ mastery --by-track">
        <div className="space-y-2 font-mono text-sm">
          {tracks.map((t) => {
            const trackItems = allItems.filter((q) => q.track === t.id);
            const ids = trackItems.map((q) => q.id);
            const pct = useProgressStore
              .getState()
              .trackMasteryPct(t.id, ids);
            return (
              <div key={t.id} className="flex items-center gap-3">
                <div
                  className="w-24 truncate"
                  style={{ color: "var(--color-amber)" }}
                >
                  {t.id}/
                </div>
                <AsciiProgress value={pct} width={32} showPercent />
                <span
                  className="ml-auto text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {trackItems.length} items
                </span>
              </div>
            );
          })}
        </div>
      </Box>

      <Box title="$ mistake-dna --analyze">
        {sortedMistakeTags.length === 0 ? (
          <div className="text-sm font-mono text-dim" style={{ color: "var(--color-text-dim)" }}>
            // no mistake DNA recorded yet. keep drilling.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {sortedMistakeTags.map(([tagId, count]) => {
              const info = MISTAKE_TAGS.find((t) => t.id === tagId);
              if (!info) return null;
              return (
                <div key={tagId} className="border-l-2 pl-3 py-1" style={{ borderColor: "var(--color-amber)" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-amber)" }} className="font-bold">
                      {info.label} ({count}x)
                    </span>
                  </div>
                  <div style={{ color: "var(--color-text)" }} className="mt-1">
                    <span style={{ color: "var(--color-text-muted)" }}>repair:</span> {info.repair}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Box>

      <Box title="$ recognition-stats --by-pattern">
        {recognitionAttempts.length === 0 ? (
          <div className="text-sm font-mono text-dim" style={{ color: "var(--color-text-dim)" }}>
            // no pattern recognition drills attempted yet.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-4 pb-2 border-b font-bold" style={{ borderColor: "var(--color-border)" }}>
              <span>pattern</span>
              <span className="text-right">attempts</span>
              <span className="text-right">accuracy</span>
              <span className="text-right">avg speed</span>
            </div>
            {Object.entries(recognitionStats).map(([pattern, stat]) => {
              const accuracy = Math.round((stat.correct / stat.total) * 100);
              const avgSpeed = (stat.totalTimeMs / stat.total / 1000).toFixed(1);
              return (
                <div key={pattern} className="grid grid-cols-4 py-1" style={{ color: "var(--color-text)" }}>
                  <span style={{ color: "var(--color-cyan)" }} className="font-bold">{pattern}</span>
                  <span className="text-right">{stat.total}</span>
                  <span className="text-right" style={{ color: accuracy >= 70 ? "var(--color-accent)" : "var(--color-danger)" }}>
                    {accuracy}%
                  </span>
                  <span className="text-right">{avgSpeed}s</span>
                </div>
              );
            })}
          </div>
        )}
      </Box>

      <Box title="$ backup">
        <div className="flex flex-wrap gap-2 text-sm">
          <BracketButton variant="primary" onClick={handleExport}>
            export json
          </BracketButton>
          <BracketButton onClick={() => fileRef.current?.click()}>
            import json
          </BracketButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
            }}
          />
          <BracketButton
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  "Reset all progress, streak, bookmarks, and review queue? This cannot be undone unless you exported first.",
                )
              ) {
                resetAllStores();
              }
            }}
          >
            reset all
          </BracketButton>
        </div>
        {importMsg && (
          <div
            className="text-sm mt-2 font-mono"
            style={{ color: "var(--color-text-dim)" }}
          >
            {importMsg}
          </div>
        )}
      </Box>
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
        style={{
          color: accent ? "var(--color-accent)" : "var(--color-text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
