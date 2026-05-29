import { useEffect, useState } from "react";
import {
  getAllLessons,
  getAllQuizItems,
  getTracks,
} from "../lib/contentLoader";

const SKIP_KEY = "smokyclaw/booted-session";

type Line = { tag: "OK" | "..." | "WARN"; text: string; delay: number };

export function BootOverlay() {
  const [running, setRunning] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !window.sessionStorage.getItem(SKIP_KEY);
    } catch {
      return false;
    }
  });
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);

  // Build lines once, with real content counts.
  const [lines] = useState<Line[]>(() => {
    if (!running) return [];
    const tracks = getTracks().length;
    const lessons = getAllLessons().length;
    const items = getAllQuizItems().length;
    const t0 = performance.now();
    // Force a tiny synchronous cost so the timing feels plausible.
    let x = 0;
    for (let i = 0; i < 1000; i++) x += i;
    const ms = Math.max(1, Math.round(performance.now() - t0)) + x * 0;
    return [
      { tag: "...", text: "init terminal shell", delay: 40 },
      { tag: "OK", text: "shell ready", delay: 30 },
      { tag: "...", text: "mount /tracks", delay: 30 },
      { tag: "OK", text: `${tracks} tracks loaded`, delay: 30 },
      { tag: "...", text: "indexing content", delay: 60 },
      {
        tag: "OK",
        text: `indexed ${lessons} lessons + ${items} quiz items in ${ms}ms`,
        delay: 30,
      },
      { tag: "...", text: "hydrate progress store", delay: 30 },
      { tag: "OK", text: "leitner queue ready", delay: 30 },
      { tag: "...", text: "warm pyodide / sqljs caches", delay: 60 },
      { tag: "OK", text: "wasm runtimes deferred to first run", delay: 30 },
      { tag: "OK", text: "boot ok — 100% local · no signup", delay: 30 },
      { tag: "OK", text: "welcome.", delay: 50 },
    ];
  });

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let i = 0;
    function tick() {
      if (cancelled) return;
      if (i >= lines.length) {
        setTimeout(() => !cancelled && setDone(true), 350);
        return;
      }
      setRevealed(i + 1);
      const d = lines[i].delay;
      i++;
      setTimeout(tick, d);
    }
    setTimeout(tick, 100);
    return () => {
      cancelled = true;
    };
  }, [running, lines]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(SKIP_KEY, "1");
      } catch {
        // ignore
      }
      setRunning(false);
    }, 250);
    return () => clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (!running) return;
    function skip() {
      try {
        window.sessionStorage.setItem(SKIP_KEY, "1");
      } catch {
        // ignore
      }
      setRunning(false);
    }
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("click", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [running]);

  if (!running) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <div className="flex-1 p-6 overflow-hidden font-mono text-sm">
        <div className="mb-3">
          <span style={{ color: "var(--color-accent)" }} className="crt-glow font-bold">
            smokyclaw boot
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            {" "}
            // v3.0 · build {new Date().toISOString().slice(0, 10)}
          </span>
        </div>

        {lines.slice(0, revealed).map((l, i) => {
          const tagColor =
            l.tag === "OK"
              ? "var(--color-accent)"
              : l.tag === "WARN"
                ? "var(--color-amber)"
                : "var(--color-text-muted)";
          return (
            <div key={i} className="boot-in">
              <span style={{ color: "var(--color-text-muted)" }}>[ </span>
              <span style={{ color: tagColor }} className="font-bold">
                {l.tag === "..." ? "  " : l.tag.padEnd(2, " ")}
              </span>
              <span style={{ color: "var(--color-text-muted)" }}> ] </span>
              <span style={{ color: "var(--color-text)" }}>{l.text}</span>
              {i === revealed - 1 && (
                <span
                  className="caret-blink ml-1"
                  style={{ color: "var(--color-accent)" }}
                >
                  ▌
                </span>
              )}
            </div>
          );
        })}

        {revealed >= lines.length && (
          <div className="mt-3 boot-in" style={{ color: "var(--color-cyan)" }}>
            ── press any key to continue ──
          </div>
        )}
      </div>

      <div
        className="px-3 py-1.5 text-[10px] flex justify-between"
        style={{
          borderTop: "1px solid var(--color-border-bright)",
          background: "var(--color-bg-alt)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>SMOKYCLAW · pid 1 · tty0</span>
        <span>press any key to skip</span>
      </div>
    </div>
  );
}
