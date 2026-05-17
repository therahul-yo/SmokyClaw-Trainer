import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import clsx from "clsx";
import type { SqlItem } from "../types";
import { gradeSql, type SqlGradeResult } from "../lib/grader";
import { getSchemaSummary } from "../lib/sqljs";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";

export function SqlSandbox({ item }: { item: SqlItem }) {
  const [query, setQuery] = useState(item.starter ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SqlGradeResult | null>(null);
  const [schemaText, setSchemaText] = useState("");

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
            SQL · {item.topic} · schema: {item.schema}
          </div>
          <div className="mt-1 text-[var(--color-text)]">
            <LessonRenderer body={item.prompt} />
          </div>
        </div>
        <BookmarkButton itemId={item.id} />
      </div>

      <details className="text-xs text-[var(--color-text-dim)]">
        <summary className="cursor-pointer text-[var(--color-accent)]">
          Schema reference
        </summary>
        <pre className="mt-2 p-3 bg-black/30 rounded border border-[var(--color-border)] overflow-x-auto whitespace-pre">
          {schemaText}
        </pre>
      </details>

      <div className="rounded-md overflow-hidden border border-[var(--color-border)]">
        <CodeMirror
          value={query}
          onChange={setQuery}
          theme="dark"
          height="180px"
          extensions={[sql()]}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      </div>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium disabled:opacity-50"
      >
        {running ? "Running…" : "Run query"}
      </button>

      {result && (
        <div className="space-y-3">
          <div
            className={clsx(
              "p-3 rounded-md border-l-4",
              result.ok
                ? "border-[var(--color-success)] bg-green-900/10"
                : "border-[var(--color-danger)] bg-red-900/10",
            )}
          >
            <div className="font-semibold">
              {result.ok ? "✓ Query result matches expected output" : "✗ Result mismatch"}
            </div>
            {result.error && (
              <div className="text-xs text-[var(--color-danger)] mt-1">{result.error}</div>
            )}
          </div>

          {result.actual && (
            <ResultTable label="Your result" data={result.actual} />
          )}
          {!result.ok && <ResultTable label="Expected" data={result.expected} />}

          {result.ok && item.explanation && (
            <div className="text-sm text-[var(--color-text-dim)] p-3 bg-[var(--color-bg-card-hover)] rounded">
              <LessonRenderer body={item.explanation} />
            </div>
          )}
        </div>
      )}
    </article>
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
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </div>
      <div className="overflow-x-auto border border-[var(--color-border)] rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-card-hover)]">
              {data.columns.map((c) => (
                <th key={c} className="text-left px-3 py-2 font-semibold">
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
                  className="px-3 py-2 text-[var(--color-text-muted)]"
                >
                  (no rows)
                </td>
              </tr>
            ) : (
              data.rows.map((row, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  {row.map((v, j) => (
                    <td key={j} className="px-3 py-1.5 font-mono text-xs">
                      {v === null ? "NULL" : String(v)}
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
