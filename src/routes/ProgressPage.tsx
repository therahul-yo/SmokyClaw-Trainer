import { useRef, useState } from "react";
import {
  exportAllStores,
  importAllStores,
  resetAllStores,
  useProgressStore,
  useStreakStore,
} from "../store";
import { getAllQuizItems, getTracks } from "../lib/contentLoader";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { AttemptHeatmap } from "../components/AttemptHeatmap";

export function ProgressPage() {
  const attempts = useProgressStore((s) => s.attempts);
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
