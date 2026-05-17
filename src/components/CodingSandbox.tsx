import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import clsx from "clsx";
import type { CodingItem } from "../types";
import { gradeCoding, type CodingGradeResult } from "../lib/grader";
import { preloadPyodide } from "../lib/pyodide";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";

export function CodingSandbox({ item }: { item: CodingItem }) {
  const [code, setCode] = useState(item.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodingGradeResult | null>(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);
  const ping = useStreakStore((s) => s.ping);

  useEffect(() => {
    // Kick off Pyodide load early.
    setPyodideLoading(true);
    void (async () => {
      preloadPyodide();
      // Slight delay so the "loading" indicator renders before the heavy fetch
      // completes; in practice the load is several seconds on first run.
      setTimeout(() => setPyodideLoading(false), 100);
    })();
  }, []);

  const run = async () => {
    setRunning(true);
    setResult(null);
    const startedAt = Date.now();
    try {
      const r = await gradeCoding(item, code);
      setResult(r);
      recordAttempt({
        itemId: item.id,
        correct: r.ok,
        timeMs: Date.now() - startedAt,
      });
      registerAttempt(item.id, r.ok);
      ping();
    } finally {
      setRunning(false);
    }
  };

  return (
    <article className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
            Coding · {item.topic} · {item.difficulty}
          </div>
          <div className="mt-1 text-[var(--color-text)]">
            <LessonRenderer body={item.prompt} />
          </div>
        </div>
        <BookmarkButton itemId={item.id} />
      </div>

      <div className="rounded-md overflow-hidden border border-[var(--color-border)]">
        <CodeMirror
          value={code}
          onChange={setCode}
          theme="dark"
          height="280px"
          extensions={[python()]}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium disabled:opacity-50"
        >
          {running ? "Running…" : "Run tests"}
        </button>
        {pyodideLoading && !result && (
          <span className="text-xs text-[var(--color-text-muted)]">
            (first run loads Python ~10MB)
          </span>
        )}
        {result && (
          <span
            className={clsx(
              "text-sm font-medium",
              result.ok ? "text-[var(--color-success)]" : "text-[var(--color-warning)]",
            )}
          >
            {result.passed} / {result.total} tests passed
          </span>
        )}
      </div>

      {result && (
        <div className="space-y-2">
          {result.tests.map((t) => (
            <div
              key={t.index}
              className={clsx(
                "border rounded-md p-3 text-sm font-mono",
                t.pass
                  ? "border-[var(--color-success)]/40 bg-green-900/10"
                  : "border-[var(--color-danger)]/40 bg-red-900/10",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{t.pass ? "✓" : "✗"}</span>
                <span>Test #{t.index + 1}</span>
              </div>
              <div className="text-xs space-y-0.5 text-[var(--color-text-dim)]">
                <div>args: {JSON.stringify(t.args)}</div>
                <div>expected: {JSON.stringify(t.expected)}</div>
                <div>got: {JSON.stringify(t.actual)}</div>
                {t.error && <div className="text-[var(--color-danger)]">error: {t.error}</div>}
              </div>
            </div>
          ))}
          {result.stderr && (
            <pre className="text-xs text-[var(--color-danger)] bg-red-900/10 p-2 rounded overflow-x-auto">
              {result.stderr}
            </pre>
          )}
        </div>
      )}

      {result?.ok && item.explanation && (
        <div className="p-4 rounded-md border-l-4 border-[var(--color-success)] bg-green-900/10">
          <div className="font-semibold mb-2">✓ All tests passed</div>
          <div className="text-sm text-[var(--color-text-dim)]">
            <LessonRenderer body={item.explanation} />
          </div>
        </div>
      )}
    </article>
  );
}
