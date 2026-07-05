// Lazy-loaded sql.js singleton.
// Note: db.exec below refers to sql.js Database.exec (SQL execution against
// an in-browser SQLite instance), NOT Node's child_process.exec.
import type { Database, SqlJsStatic } from "sql.js";
import type { SqlSchemaName } from "../types";
import { getSqlSchema } from "./contentLoader";

const SQLJS_BASE_URL = "https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist";
const SQLJS_SCRIPT_URL = `${SQLJS_BASE_URL}/sql-wasm.js`;
const SQLJS_WASM_URL = `${SQLJS_BASE_URL}/sql-wasm.wasm`;

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let scriptPromise: Promise<void> | null = null;

type SqlJsGlobal = {
  initSqlJs?: (config: { locateFile: () => string }) => Promise<SqlJsStatic>;
};

function loadSqlJsScript(): Promise<void> {
  const sqlGlobal = globalThis as unknown as SqlJsGlobal;
  if (sqlGlobal.initSqlJs) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SQLJS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Reset singleton so a retry can succeed instead of returning the
      // cached rejected promise forever.
      scriptPromise = null;
      reject(new Error("Failed to load sql.js"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsPromise) return sqlJsPromise;
  sqlJsPromise = (async () => {
    try {
      await loadSqlJsScript();
      const sqlGlobal = globalThis as unknown as SqlJsGlobal;
      if (!sqlGlobal.initSqlJs) {
        throw new Error("sql.js loaded, but initSqlJs was not available");
      }
      // Await inside the wrapper so a rejected init resets the singletons
      // and a later call retries instead of replaying the cached rejection.
      return await sqlGlobal.initSqlJs({
        locateFile: () => SQLJS_WASM_URL,
      });
    } catch (err) {
      sqlJsPromise = null;
      scriptPromise = null;
      throw err;
    }
  })();
  return sqlJsPromise;
}

function freshDb(SQL: SqlJsStatic, schema: SqlSchemaName): Database {
  const db = new SQL.Database();
  try {
    // db.exec = SQLite WASM run-SQL method (sql.js Database#exec)
    db.exec(getSqlSchema(schema));
  } catch (err) {
    // Don't leak the handle if seeding the schema fails.
    db.close();
    throw err;
  }
  return db;
}

export type SqlRunResult = { columns: string[]; rows: unknown[][] } | null;

export async function runSql(
  schema: SqlSchemaName,
  query: string,
): Promise<SqlRunResult> {
  const SQL = await loadSqlJs();
  const db = freshDb(SQL, schema);
  try {
    const results = db.exec(query);
    if (results.length === 0) return { columns: [], rows: [] };
    const last = results[results.length - 1];
    return { columns: last.columns, rows: last.values as unknown[][] };
  } finally {
    db.close();
  }
}

export async function getSchemaSummary(
  schema: SqlSchemaName,
): Promise<string> {
  const SQL = await loadSqlJs();
  const db = freshDb(SQL, schema);
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    if (tables.length === 0) return "";
    const out: string[] = [];
    for (const row of tables[0].values) {
      const name = row[0] as string;
      const info = db.exec(`PRAGMA table_info(${name})`);
      const cols = info[0]?.values.map((r) => `${r[1]} ${r[2]}`).join(", ") ?? "";
      out.push(`${name}(${cols})`);
    }
    return out.join("\n");
  } finally {
    db.close();
  }
}
