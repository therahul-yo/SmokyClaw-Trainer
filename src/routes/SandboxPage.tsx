import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { runPython } from "../lib/pyodide";
import { runSql, getSchemaSummary } from "../lib/sqljs";
import { useEffect } from "react";

const PY_STARTER = `# Free-form Python REPL — runs in your browser via Pyodide.
# Try anything: list comprehensions, classes, regex, ...
nums = [1, 2, 3, 4, 5]
squares = [n*n for n in nums]
print(squares)
`;

const SQL_STARTER = `-- Free-form SQL against the employees schema.
SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;
`;

export function SandboxPage() {
  const { kind } = useParams<{ kind: string }>();
  if (kind !== "python" && kind !== "sql") return <Navigate to="/" replace />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">
        {kind === "python" ? "🐍 Python sandbox" : "🗃️ SQL sandbox"}
      </h1>
      {kind === "python" ? <PythonRepl /> : <SqlRepl />}
    </div>
  );
}

function PythonRepl() {
  const [code, setCode] = useState(PY_STARTER);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setOut("");
    setErr("");
    const r = await runPython(code);
    setOut(r.stdout);
    setErr(r.stderr + (r.error ? `\n${r.error}` : ""));
    setRunning(false);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md overflow-hidden border border-[var(--color-border)]">
        <CodeMirror
          value={code}
          onChange={setCode}
          theme="dark"
          height="320px"
          extensions={[python()]}
        />
      </div>
      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium disabled:opacity-50"
      >
        {running ? "Running…" : "Run"}
      </button>
      {(out || err) && (
        <div className="space-y-2">
          {out && (
            <pre className="p-3 rounded bg-black/30 border border-[var(--color-border)] text-xs whitespace-pre-wrap">
              {out}
            </pre>
          )}
          {err && (
            <pre className="p-3 rounded bg-red-900/20 border border-[var(--color-danger)]/40 text-xs text-[var(--color-danger)] whitespace-pre-wrap">
              {err}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function SqlRepl() {
  const [schema, setSchema] = useState<"employees" | "ecommerce">("employees");
  const [code, setCode] = useState(SQL_STARTER);
  const [schemaText, setSchemaText] = useState("");
  const [result, setResult] = useState<{ columns: string[]; rows: unknown[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void (async () => {
      setSchemaText(await getSchemaSummary(schema));
    })();
  }, [schema]);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const r = await runSql(schema, code);
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center text-sm">
        <span className="text-[var(--color-text-muted)]">schema:</span>
        {(["employees", "ecommerce"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSchema(s)}
            className={`px-3 py-1 rounded border ${
              schema === s
                ? "border-[var(--color-accent)] text-white"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <details className="text-xs text-[var(--color-text-dim)]">
        <summary className="cursor-pointer text-[var(--color-accent)]">
          Schema reference
        </summary>
        <pre className="mt-2 p-3 bg-black/30 rounded border border-[var(--color-border)] whitespace-pre overflow-x-auto">
          {schemaText}
        </pre>
      </details>

      <div className="rounded-md overflow-hidden border border-[var(--color-border)]">
        <CodeMirror
          value={code}
          onChange={setCode}
          theme="dark"
          height="220px"
          extensions={[sql()]}
        />
      </div>
      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium disabled:opacity-50"
      >
        {running ? "Running…" : "Run query"}
      </button>

      {error && (
        <pre className="p-3 rounded bg-red-900/20 border border-[var(--color-danger)]/40 text-xs text-[var(--color-danger)] whitespace-pre-wrap">
          {error}
        </pre>
      )}
      {result && (
        <div className="overflow-x-auto border border-[var(--color-border)] rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-bg-card-hover)]">
                {result.columns.map((c) => (
                  <th key={c} className="text-left px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={result.columns.length} className="px-3 py-2 text-[var(--color-text-muted)]">
                    (no rows)
                  </td>
                </tr>
              ) : (
                result.rows.map((row, i) => (
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
      )}
    </div>
  );
}
