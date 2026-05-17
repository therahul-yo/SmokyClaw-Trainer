import { useStreakStore } from "../store";

export function StreakBadge() {
  const current = useStreakStore((s) => s.currentStreak);
  const longest = useStreakStore((s) => s.longestStreak);
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1">
        <span>🔥</span>
        <span className="font-semibold text-white">{current}</span>
        <span className="text-[var(--color-text-muted)]">day streak</span>
      </div>
      <div className="text-[var(--color-text-muted)]">
        best: <span className="text-[var(--color-text-dim)]">{longest}</span>
      </div>
    </div>
  );
}
