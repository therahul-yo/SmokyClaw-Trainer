import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import clsx from "clsx";
import type { CodingItem } from "../types";
import { gradeCoding, type CodingGradeResult } from "../lib/grader";
import { preloadPyodide } from "../lib/pyodide";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";
import { ProblemContext } from "./ProblemContext";
import { HintsPanel } from "./HintsPanel";
import { EditorialReveal } from "./EditorialReveal";
import { ComplexityCheck } from "./ComplexityCheck";

export function CodingSandbox({ item }: { item: CodingItem }) {
  const [code, setCode] = useState(item.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodingGradeResult | null>(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [editorialUnlocked, setEditorialUnlocked] = useState(false);
  const [complexityDone, setComplexityDone] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const hintsRef = useRef(0);

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);
  const ping = useStreakStore((s) => s.ping);

  // Per-item state is reset by QuizPage remounting us with `key={item.id}`,
  // so useState re-runs its initializer on each item change.

  useEffect(() => {
    setPyodideLoading(true);
    void (async () => {
      preloadPyodide();
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
        hintsUsed: hintsRef.current,
      });
      registerAttempt(item.id, r.ok);
      ping();
      // If passing + no complexity check defined, unlock editorial immediately.
      if (r.ok && !item.complexityCheck) setEditorialUnlocked(true);
    } finally {
      setRunning(false);
    }
  };

  const giveUp = () => {
    if (!confirm("Reveal the solution? This counts as a failed attempt and pushes the item into your review queue.")) return;
    recordAttempt({
      itemId: item.id,
      correct: false,
      timeMs: 0,
      hintsUsed: hintsRef.current,
      gaveUp: true,
    });
    registerAttempt(item.id, false);
    setGaveUp(true);
    setEditorialUnlocked(true);
  };

  const showEditorial = editorialUnlocked || gaveUp;
  const needsComplexityCheck = result?.ok && item.complexityCheck && !complexityDone;

  return (
    <article className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
            Coding · {item.topic} · {item.difficulty}
            {item.estMinutes && ` · ~${item.estMinutes}m`}
          </div>
          <div className="mt-1 text-[var(--color-text)]">
            <LessonRenderer body={item.prompt} />
          </div>
        </div>
        <BookmarkButton itemId={item.id} />
      </div>

      <ProblemContext item={item} />

      {item.hints && item.hints.length > 0 && (
        <HintsPanel
          hints={item.hints}
          onCountChange={(n) => {
            setHintsUsed(n);
            hintsRef.current = n;
          }}
        />
      )}

      {item.bruteForce && !showEditorial && (
        <EditorialReveal bruteForce={item.bruteForce} variant="pre-solve" />
      )}

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

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium disabled:opacity-50"
        >
          {running ? "Running…" : "Run tests"}
        </button>
        {!showEditorial && (
          <button
            type="button"
            onClick={giveUp}
            className="px-3 py-2 rounded-md text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-warning)]"
          >
            Give up & show solution
          </button>
        )}
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
        {hintsUsed > 0 && (
          <span className="text-xs text-[var(--color-text-muted)]">
            · {hintsUsed} hint{hintsUsed === 1 ? "" : "s"} used
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

      {needsComplexityCheck && item.complexityCheck && (
        <ComplexityCheck
          question={item.complexityCheck.question}
          choices={item.complexityCheck.choices}
          onPass={() => {
            setComplexityDone(true);
            setEditorialUnlocked(true);
          }}
          onSkip={() => {
            setComplexityDone(true);
            setEditorialUnlocked(true);
          }}
        />
      )}

      {showEditorial && (
        <EditorialReveal
          bruteForce={item.bruteForce}
          optimal={item.optimal}
          fallback={item.explanation}
        />
      )}
    </article>
  );
}
