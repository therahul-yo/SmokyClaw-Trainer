import { useRef, useState } from "react";
import {
  exportAllStores,
  importAllStores,
  resetAllStores,
  useProgressStore,
  useStreakStore,
} from "../store";
import { getAllQuizItems, getTracks } from "../lib/contentLoader";

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
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const handleExport = () => {
    const blob = new Blob([exportAllStores()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-trainer-progress-${new Date().toISOString().slice(0, 10)}.json`;
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">📊 Progress</h1>
        <p className="text-[var(--color-text-dim)] mt-1">
          All stats stored locally in your browser. Export to back up; import to
          restore after a cache wipe.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Streak" value={`${streak}d`} />
        <Stat label="Longest streak" value={`${longest}d`} />
        <Stat label="Attempts" value={String(totalAttempts)} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Mastery by track</h2>
        <div className="space-y-3">
          {tracks.map((t) => {
            const trackItems = allItems.filter((q) => q.track === t.id);
            const ids = trackItems.map((q) => q.id);
            const pct = useProgressStore.getState().trackMasteryPct(t.id, ids);
            return (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-32 text-sm">
                  {t.emoji} {t.title}
                </div>
                <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-card)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-[var(--color-text-dim)]">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Backup & restore</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white"
          >
            Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] text-white"
          >
            Import JSON
          </button>
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
          <button
            onClick={() => {
              if (confirm("Reset all progress, streak, bookmarks, and review queue? This cannot be undone unless you exported first.")) {
                resetAllStores();
              }
            }}
            className="px-4 py-2 rounded-md border border-[var(--color-danger)]/40 hover:bg-red-900/20 text-[var(--color-danger)]"
          >
            Reset everything
          </button>
        </div>
        {importMsg && (
          <p className="text-sm text-[var(--color-text-dim)] mt-2">{importMsg}</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}
