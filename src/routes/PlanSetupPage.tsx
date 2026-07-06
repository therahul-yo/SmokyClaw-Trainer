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
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

const ALL_TRACKS: TrackId[] = ["python", "dsa", "sql", "aptitude"];

const PRESETS = [
  { label: "7d (cram)", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

function chipStyle(active: boolean) {
  return {
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-bright)"}`,
    color: active ? "var(--color-accent)" : "var(--color-text-dim)",
    background: active ? "rgba(var(--accent-rgb), 0.05)" : "transparent",
  };
}

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
    <div className="max-w-2xl space-y-4">
      <Prompt path="~/plan/setup">
        <span>plan --new</span>
      </Prompt>
      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        configure.plan
        <span
          style={{ color: "var(--color-text-muted)" }}
          className="text-sm ml-2"
        >
          // weakness-prioritized, deadline-aware
        </span>
      </div>

      <Box title="$ timeline">
        <div className="flex flex-wrap gap-2 items-center text-sm font-mono">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className="px-2 py-1 transition-colors hover:brightness-110"
              style={chipStyle(days === p.days)}
            >
              [{p.label}]
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) =>
              setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))
            }
            className="w-16 px-2 py-1 font-mono text-sm"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border-bright)",
              color: "var(--color-text)",
            }}
            aria-label="Days until deadline"
          />
          <span style={{ color: "var(--color-text-muted)" }}>days</span>
        </div>
      </Box>

      <Box title="$ daily-budget">
        <label
          className="text-sm font-mono block mb-2"
          style={{ color: "var(--color-text)" }}
        >
          minutes/day ={" "}
          <span style={{ color: "var(--color-accent)" }} className="font-bold">
            {dailyMinutes}
          </span>
        </label>
        <input
          type="range"
          min={20}
          max={240}
          step={10}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <div
          className="flex justify-between text-xs mt-1 font-mono"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>20m</span>
          <span>1h</span>
          <span>2h</span>
          <span>4h</span>
        </div>
      </Box>

      <Box title="$ focus-tracks">
        <div className="flex flex-wrap gap-2 text-sm font-mono">
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTrack(t.id)}
              className="px-2 py-1 transition-colors hover:brightness-110"
              style={chipStyle(focusTracks.includes(t.id))}
            >
              [{t.id}]
            </button>
          ))}
        </div>
      </Box>

      <Box title="$ weak-areas">
        <label
          className="text-xs font-mono block mb-2"
          style={{ color: "var(--color-text-muted)" }}
          htmlFor="weak-input"
        >
          // optional · comma-separated topic tags
        </label>
        <input
          id="weak-input"
          type="text"
          placeholder="dp, recursion, joins"
          value={weakInput}
          onChange={(e) => setWeakInput(e.target.value)}
          className="w-full px-2 py-1.5 font-mono text-sm"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border-bright)",
            color: "var(--color-text)",
          }}
        />
        <div
          className="text-xs font-mono mt-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          // also auto-detected from your attempts history.
        </div>
      </Box>

      <div className="flex gap-2 text-sm">
        <BracketButton variant="primary" onClick={handleCreate}>
          create plan →
        </BracketButton>
        <BracketButton variant="ghost" onClick={() => navigate("/")}>
          cancel
        </BracketButton>
      </div>
    </div>
  );
}
