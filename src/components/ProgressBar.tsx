export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded-full bg-[var(--color-bg-card)] overflow-hidden">
      <div
        className="h-full bg-[var(--color-accent)] transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
