import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import type { SqlItem } from "../types";
import { gradeSql, type SqlGradeResult } from "../lib/grader";
import { getSchemaSummary } from "../lib/sqljs";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";
import { ProblemContext } from "./ProblemContext";
import { HintsPanel } from "./HintsPanel";
import { EditorialReveal } from "./EditorialReveal";
import { ComplexityCheck } from "./ComplexityCheck";
import { Box } from "./terminal/Box";
import { BracketButton } from "./terminal/BracketButton";
import { Stopwatch } from "./Stopwatch";

export function SqlSandbox({ item }: { item: SqlItem }) {
  const [query, setQuery] = useState(item.starter ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SqlGradeResult | null>(null);
  const [schemaText, setSchemaText] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [editorialUnlocked, setEditorialUnlocked] = useState(false);
  const [complexityDone, setComplexityDone] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const hintsRef = useRef(0);

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);
  const ping = useStreakStore((s) => s.ping);

  useEffect(() => {
    void (async () => {
      try {
        const s = await getSchemaSummary(item.schema);
        setSchemaText(s);
      } catch (e) {
        setSchemaText(`(failed to load schema: ${String(e)})`);
      }
    })();
  }, [item.schema]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    const startedAt = Date.now();
    try {
      const r = await gradeSql(item, query);
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
          <span>sql</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.topic}</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>schema: {item.schema}</span>
          {item.estMinutes && (
            <>
              <span style={{ color: "var(--color-text-muted)" }}> · </span>
              <span>~{item.estMinutes}m</span>
            </>
          )}
        </span>
      }
      trailing={
        <div className="flex items-center gap-2">
          <Stopwatch estMinutes={item.estMinutes} />
          <BookmarkButton itemId={item.id} />
        </div>
      }
    >
      <div className="space-y-4">
        <div style={{ color: "var(--color-text)" }}>
          <LessonRenderer body={item.prompt} />
        </div>

        <ProblemContext item={item} />

        <details className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          <summary
            className="cursor-pointer"
            style={{ color: "var(--color-cyan)" }}
          >
            ▸ schema reference
          </summary>
          <pre
            className="mt-2 p-3 overflow-x-auto whitespace-pre"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            {schemaText}
          </pre>
        </details>

        {item.hints && item.hints.length > 0 && (
          <HintsPanel
            hints={item.hints}
            onCountChange={(n) => {
              setHintsUsed(n);
              hintsRef.current = n;
            }}
          />
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
            <span>── query.sql ─────────────────────────</span>
            <span>sqlite</span>
          </div>
          <CodeMirror
            value={query}
            onChange={setQuery}
            theme="dark"
            height="200px"
            extensions={[sql()]}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <BracketButton variant="primary" onClick={run} disabled={running}>
            {running ? "running…" : "run query"}
          </BracketButton>
          {!showEditorial && (
            <BracketButton variant="ghost" onClick={giveUp}>
              give up
            </BracketButton>
          )}
          {hintsUsed > 0 && (
            <span className="text-xs" style={{ color: "var(--color-amber)" }}>
              · {hintsUsed} hint{hintsUsed === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            <div
              className="p-3 font-mono text-sm"
              style={{
                borderLeft: `3px solid ${
                  result.ok ? "var(--color-success)" : "var(--color-danger)"
                }`,
                background: result.ok
                  ? "rgba(255, 140, 0, 0.05)"
                  : "rgba(255, 68, 68, 0.05)",
              }}
            >
              <div
                className="font-bold"
                style={{
                  color: result.ok ? "var(--color-success)" : "var(--color-danger)",
                }}
              >
                {result.ok ? "PASS // result matches" : "FAIL // result mismatch"}
              </div>
              {result.error && (
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--color-danger)" }}
                >
                  {result.error}
                </div>
              )}
            </div>

            {result.actual && (
              <ResultTable label="── your result" data={result.actual} />
            )}
            {!result.ok && (
              <ResultTable label="── expected" data={result.expected} />
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

function ResultTable({
  label,
  data,
}: {
  label: string;
  data: { columns: string[]; rows: unknown[][] };
}) {
  return (
    <div>
      <div
        className="text-xs mb-1 font-mono"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="overflow-x-auto"
        style={{ border: "1px solid var(--color-border-bright)" }}
      >
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              {data.columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-3 py-1.5 font-semibold"
                  style={{
                    color: "var(--color-amber)",
                    borderBottom: "1px solid var(--color-border-bright)",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={data.columns.length || 1}
                  className="px-3 py-2 italic"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  (no rows)
                </td>
              </tr>
            ) : (
              data.rows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  {row.map((v, j) => (
                    <td
                      key={j}
                      className="px-3 py-1 text-xs"
                      style={{ color: "var(--color-text)" }}
                    >
                      {v === null ? (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          NULL
                        </span>
                      ) : (
                        String(v)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
