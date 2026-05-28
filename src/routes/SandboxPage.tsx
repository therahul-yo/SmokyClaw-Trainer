import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { runPython } from "../lib/pyodide";
import { runSql, getSchemaSummary } from "../lib/sqljs";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

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
    <div className="space-y-4">
      <Prompt path={`~/sandbox/${kind}`}>
        <span>start --repl</span>
      </Prompt>
      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        {kind === "python" ? "python.repl" : "sql.repl"}
        <span style={{ color: "var(--color-text-muted)" }} className="text-sm ml-2">
          // scratch space — runs locally
        </span>
      </div>
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
          <span>── scratch.py ──</span>
          <span>python 3.11</span>
        </div>
        <CodeMirror
          value={code}
          onChange={setCode}
          theme="dark"
          height="320px"
          extensions={[python()]}
        />
      </div>
      <BracketButton variant="primary" onClick={run} disabled={running}>
        {running ? "running…" : "run"}
      </BracketButton>
      {(out || err) && (
        <Box title="$ stdout">
          {out && (
            <pre
              className="text-xs whitespace-pre-wrap"
              style={{ color: "var(--color-accent)" }}
            >
              {out}
            </pre>
          )}
          {err && (
            <pre
              className="text-xs whitespace-pre-wrap mt-2"
              style={{ color: "var(--color-danger)" }}
            >
              {err}
            </pre>
          )}
        </Box>
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
      <div className="flex gap-2 items-center text-sm font-mono">
        <span style={{ color: "var(--color-text-muted)" }}>$ schema =</span>
        {(["employees", "ecommerce"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSchema(s)}
            className="px-2 py-0.5 text-xs"
            style={{
              border: `1px solid ${schema === s ? "var(--color-accent)" : "var(--color-border-bright)"}`,
              color: schema === s ? "var(--color-accent)" : "var(--color-text-dim)",
              background: "transparent",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <details className="text-xs" style={{ color: "var(--color-text-dim)" }}>
        <summary className="cursor-pointer" style={{ color: "var(--color-cyan)" }}>
          ▸ schema reference
        </summary>
        <pre
          className="mt-2 p-3 whitespace-pre overflow-x-auto font-mono"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}
        >
          {schemaText}
        </pre>
      </details>

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
          <span>── query.sql ──</span>
          <span>sqlite</span>
        </div>
        <CodeMirror
          value={code}
          onChange={setCode}
          theme="dark"
          height="240px"
          extensions={[sql()]}
        />
      </div>
      <BracketButton variant="primary" onClick={run} disabled={running}>
        {running ? "running…" : "run query"}
      </BracketButton>

      {error && (
        <pre
          className="p-3 text-xs whitespace-pre-wrap font-mono"
          style={{
            background: "rgba(255, 68, 68, 0.06)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          {error}
        </pre>
      )}
      {result && (
        <div
          className="overflow-x-auto"
          style={{ border: "1px solid var(--color-border-bright)" }}
        >
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                {result.columns.map((c) => (
                  <th
                    key={c}
                    className="text-left px-3 py-1.5"
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
              {result.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={result.columns.length}
                    className="px-3 py-2 italic"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    (no rows)
                  </td>
                </tr>
              ) : (
                result.rows.map((row, i) => (
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
      )}
    </div>
  );
}
