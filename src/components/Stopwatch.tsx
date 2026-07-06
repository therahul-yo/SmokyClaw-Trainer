import { useEffect, useRef, useState } from "react";
import { BracketButton } from "./terminal/BracketButton";

type Props = {
  estMinutes?: number;
};

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Stopwatch({ estMinutes }: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef<number>(0);
  const pausedTotalRef = useRef<number>(0);

  useEffect(() => {
    if (startedAt === null || paused) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt - pausedTotalRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAt, paused]);

  const running = startedAt !== null;
  const elapsedMin = elapsed / 60000;
  let color = "var(--color-text-dim)";
  if (running && estMinutes) {
    if (elapsedMin <= estMinutes) color = "var(--color-accent)";
    else if (elapsedMin <= estMinutes * 2) color = "var(--color-amber)";
    else color = "var(--color-danger)";
  } else if (running) {
    color = "var(--color-accent)";
  }

  function start() {
    setStartedAt(Date.now());
    setElapsed(0);
    setPaused(false);
    pausedTotalRef.current = 0;
  }

  function reset() {
    setStartedAt(null);
    setElapsed(0);
    setPaused(false);
    pausedTotalRef.current = 0;
  }

  function togglePause() {
    if (!startedAt) return;
    if (paused) {
      pausedTotalRef.current += Date.now() - pausedAtRef.current;
      setPaused(false);
    } else {
      pausedAtRef.current = Date.now();
      setPaused(true);
    }
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-1 font-mono text-xs"
      style={{
        border: `1px solid ${
          running ? "var(--color-border-bright)" : "var(--color-border)"
        }`,
        background: running
          ? "rgba(var(--accent-rgb), 0.04)"
          : "transparent",
      }}
    >
      <span style={{ color: "var(--color-text-muted)" }}>⏱</span>
      <span
        className={"tabular-nums text-sm font-bold" + (running ? " crt-glow" : "")}
        style={{ color }}
      >
        {formatElapsed(elapsed)}
      </span>
      {estMinutes && running && (
        <span style={{ color: "var(--color-text-muted)" }}>
          / target {String(estMinutes).padStart(2, "0")}:00
        </span>
      )}
      {!running ? (
        <BracketButton onClick={start}>start timer</BracketButton>
      ) : (
        <>
          <BracketButton onClick={togglePause}>
            {paused ? "resume" : "pause"}
          </BracketButton>
          <BracketButton variant="ghost" onClick={reset}>
            reset
          </BracketButton>
        </>
      )}
    </div>
  );
}
