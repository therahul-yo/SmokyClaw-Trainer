import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllLessons,
  getAllQuizItems,
  getTracks,
} from "../lib/contentLoader";
import { generatePlan } from "../lib/planner";
import {
  usePlanStore,
  useProgressStore,
  useReviewQueueStore,
} from "../store";
import { dueRecords } from "../lib/leitner";
import type { TrackId } from "../types";

const ALL_TRACKS: TrackId[] = ["python", "dsa", "sql", "aptitude"];

const PRESETS = [
  { label: "1 week (cram)", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

export function PlanSetupPage() {
  const navigate = useNavigate();
  const tracks = getTracks();
  const [days, setDays] = useState(7);
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [focusTracks, setFocusTracks] = useState<TrackId[]>(ALL_TRACKS);
  const [weakInput, setWeakInput] = useState("");

  const allItems = useMemo(() => getAllQuizItems(), []);
  const allLessons = useMemo(() => getAllLessons(), []);
  const attempts = useProgressStore((s) => s.attempts);
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const setPlan = usePlanStore((s) => s.setPlan);

  function toggleTrack(t: TrackId) {
    setFocusTracks((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  function handleCreate() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    const weakTopics = weakInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const dueReviewIds = dueRecords(Object.values(reviewRecords)).map(
      (r) => r.itemId,
    );
    const plan = generatePlan({
      deadline,
      dailyMinutes,
      focusTracks: focusTracks.length ? focusTracks : ALL_TRACKS,
      weakTopics,
      attempts,
      dueReviewIds,
      allItems,
      allLessons,
    });
    setPlan(plan);
    navigate("/plan");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Build your study plan</h1>
        <p className="mt-2 text-[var(--color-text-dim)]">
          Pick a deadline and how much time you can give it daily. We'll lay
          out lessons + practice every day, with weakness-prioritized items.
        </p>
      </header>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-white">Timeline</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                days === p.days
                  ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
            className="w-20 px-2 py-1.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] text-sm text-white"
            aria-label="Days until deadline"
          />
          <span className="text-sm text-[var(--color-text-muted)] self-center">days</span>
        </div>
      </section>

      <section className="space-y-3">
        <label className="text-sm font-semibold text-white block">
          Daily budget: <span className="text-[var(--color-accent)]">{dailyMinutes} min</span>
        </label>
        <input
          type="range"
          min={20}
          max={240}
          step={10}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>20m</span>
          <span>1h</span>
          <span>2h</span>
          <span>4h</span>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-white">Focus tracks</div>
        <div className="flex flex-wrap gap-2">
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTrack(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                focusTracks.includes(t.id)
                  ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
              }`}
            >
              {t.emoji} {t.title}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className="text-sm font-semibold text-white block" htmlFor="weak-input">
          Weak areas (optional, comma-separated topic tags)
        </label>
        <input
          id="weak-input"
          type="text"
          placeholder="e.g. dp, recursion, joins"
          value={weakInput}
          onChange={(e) => setWeakInput(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] text-sm text-white"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          We'll also auto-detect weaknesses from your attempts history.
        </p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-semibold text-sm"
        >
          Create plan
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
