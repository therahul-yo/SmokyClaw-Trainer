import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
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
import { Box } from "./terminal/Box";
import { BracketButton } from "./terminal/BracketButton";

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
      if (r.ok && !item.complexityCheck) setEditorialUnlocked(true);
    } finally {
      setRunning(false);
    }
  };

  const giveUp = () => {
    if (
      !confirm(
        "Reveal the solution? This counts as a failed attempt and pushes the item into your review queue.",
      )
    )
      return;
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
  const needsComplexityCheck =
    result?.ok && item.complexityCheck && !complexityDone;

  return (
    <Box
      title={
        <span>
          <span style={{ color: "var(--color-amber)" }}>{item.id}</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>coding</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.topic}</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.difficulty}</span>
          {item.estMinutes && (
            <>
              <span style={{ color: "var(--color-text-muted)" }}> · </span>
              <span>~{item.estMinutes}m</span>
            </>
          )}
        </span>
      }
      trailing={<BookmarkButton itemId={item.id} />}
    >
      <div className="space-y-4">
        <div style={{ color: "var(--color-text)" }}>
          <LessonRenderer body={item.prompt} />
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

        <div
          style={{
            border: "1px solid var(--color-border-bright)",
            background: "var(--color-bg-alt)",
          }}
        >
          <div
            className="px-3 py-1 text-xs flex items-center justify-between"
            style={{
              borderBottom: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              background: "var(--color-bg)",
            }}
          >
            <span>
              ── solution.py ─────────────────────────
            </span>
            <span>python 3.11</span>
          </div>
          <CodeMirror
            value={code}
            onChange={setCode}
            theme="dark"
            height="320px"
            extensions={[python()]}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <BracketButton variant="primary" onClick={run} disabled={running}>
            {running ? "running…" : "run tests"}
          </BracketButton>
          {!showEditorial && (
            <BracketButton variant="ghost" onClick={giveUp}>
              give up
            </BracketButton>
          )}
          {pyodideLoading && !result && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              (first run loads python ~10MB)
            </span>
          )}
          {result && (
            <span
              className="text-sm font-mono ml-auto"
              style={{
                color: result.ok ? "var(--color-success)" : "var(--color-amber)",
              }}
            >
              {result.passed}/{result.total} passed
            </span>
          )}
          {hintsUsed > 0 && (
            <span className="text-xs" style={{ color: "var(--color-amber)" }}>
              · {hintsUsed} hint{hintsUsed === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {result && (
          <div className="space-y-1">
            {result.tests.map((t) => (
              <div
                key={t.index}
                className="px-3 py-2 text-xs font-mono"
                style={{
                  border: `1px solid ${
                    t.pass ? "var(--color-success)" : "var(--color-danger)"
                  }`,
                  background: t.pass
                    ? "rgba(255, 140, 0, 0.04)"
                    : "rgba(255, 68, 68, 0.04)",
                }}
              >
                <div
                  className="flex items-center gap-2 mb-1 font-bold"
                  style={{
                    color: t.pass ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  <span>{t.pass ? "✓ PASS" : "✗ FAIL"}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    test #{t.index + 1}
                  </span>
                </div>
                <div
                  className="space-y-0.5"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>args  </span>
                    {JSON.stringify(t.args)}
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>want  </span>
                    {JSON.stringify(t.expected)}
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>got   </span>
                    {JSON.stringify(t.actual)}
                  </div>
                  {t.error && (
                    <div style={{ color: "var(--color-danger)" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>err   </span>
                      {t.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {result.stderr && (
              <pre
                className="text-xs p-2 overflow-x-auto"
                style={{
                  color: "var(--color-danger)",
                  background: "rgba(255, 68, 68, 0.06)",
                  border: "1px solid var(--color-danger)",
                }}
              >
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
      </div>
    </Box>
  );
}
