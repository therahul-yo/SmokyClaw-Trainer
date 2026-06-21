// Tests for src/lib/sqljs.ts (the singleton wrapper around sql.js).
//
// Like pyodideWrapper.test.ts, we mock the browser surface and the
// `initSqlJs` global. We mock `getSqlSchema` from contentLoader to avoid
// pulling in real SQL DDL.
//
// Key invariants:
//   1. initSqlJs is called exactly once across many runSql() calls (singleton).
//   2. runSql returns { columns, rows } for SELECT statements.
//   3. runSql returns { columns: [], rows: [] } for DDL/DML (no result set).
//   4. The Database is closed in a finally block (no leaked handles).
//   5. CRITICAL (audit C2-C3): if initSqlJs is missing on globalThis after
//      script load, loadSqlJs throws — that error is NOT cached in
//      sqlJsPromise (good), but a previously-rejected initSqlJs promise
//      IS cached and retries return the same rejection (audit C1 pattern).
//   6. db.exec() with zero result sets → empty columns/rows.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../contentLoader", () => ({
  getSqlSchema: vi.fn(() => "-- schema stub"),
}));

// ── minimal fake sql.js ─────────────────────────────────────────

interface FakeQueryResult {
  columns: string[];
  values: unknown[][];
}

interface FakeDatabase {
  exec: (q: string) => FakeQueryResult[];
  close: () => void;
}

interface FakeSqlJsStatic {
  Database: new () => FakeDatabase;
}

function makeFakeSqlJs(execImpl: (q: string) => FakeQueryResult[]): FakeSqlJsStatic {
  let closed = false;
  const db: FakeDatabase = {
    exec: vi.fn((q: string) => {
      if (closed) throw new Error("db closed");
      return execImpl(q);
    }),
    close: vi.fn(() => {
      closed = true;
    }),
  };
  return { Database: vi.fn(() => db) };
}

// ── browser surface stub ─────────────────────────────────────────

type FakeScriptEl = {
  src: string;
  async: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
};
let scriptElements: FakeScriptEl[] = [];

function installDOM() {
  scriptElements = [];
  (globalThis as unknown as { document: unknown }).document = {
    head: {
      appendChild: (el: FakeScriptEl) => {
        scriptElements.push(el);
        // Resolve script load asynchronously so callers can attach handlers.
        setTimeout(() => el.onload?.(), 0);
        return el;
      },
    },
    createElement: (_tag: string) => {
      const el: FakeScriptEl = {
        src: "",
        async: false,
        onload: null,
        onerror: null,
      };
      return el;
    },
  };
}

beforeEach(() => {
  installDOM();
  vi.resetModules();
  scriptElements = [];
  // Clean any prior initSqlJs global
  delete (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs;
});

describe("sqljs / runSql result handling", () => {
  it("returns columns+rows for SELECT", async () => {
    const fakeSql = makeFakeSqlJs((q) => {
      if (q.toUpperCase().startsWith("SELECT")) {
        return [{ columns: ["id", "name"], values: [[1, "Alice"], [2, "Bob"]] }];
      }
      return [];
    });
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    const r = await mod.runSql("employees", "SELECT id, name FROM t");
    expect(r).not.toBeNull();
    expect(r?.columns).toEqual(["id", "name"]);
    expect(r?.rows).toEqual([
      [1, "Alice"],
      [2, "Bob"],
    ]);
  });

  it("returns {columns:[], rows:[]} for DDL/DML (no result sets)", async () => {
    const fakeSql = makeFakeSqlJs(() => []);
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    const r = await mod.runSql("employees", "CREATE TABLE x (id INT)");
    expect(r).toEqual({ columns: [], rows: [] });
  });

  it("picks the LAST result set when db.exec returns multiple", async () => {
    // Some scripts return [set1, set2]; runSql uses the last entry.
    const fakeSql = makeFakeSqlJs(() => [
      { columns: ["ignored"], values: [["x"]] },
      { columns: ["wanted"], values: [["y"]] },
    ]);
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    const r = await mod.runSql("employees", "SELECT 1; SELECT 2;");
    expect(r?.columns).toEqual(["wanted"]);
    expect(r?.rows).toEqual([["y"]]);
  });

  it("closes the database after execution", async () => {
    let closeCount = 0;
    const db: FakeDatabase = {
      exec: vi.fn(() => [{ columns: ["x"], values: [[1]] }]),
      close: vi.fn(() => {
        closeCount += 1;
      }),
    };
    const fakeSql: FakeSqlJsStatic = { Database: vi.fn(() => db) };
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    await mod.runSql("employees", "SELECT 1");
    expect(closeCount).toBe(1);
  });

  it("closes the database even when exec throws", async () => {
    let closeCount = 0;
    const db: FakeDatabase = {
      exec: vi.fn(() => {
        throw new Error("syntax error");
      }),
      close: vi.fn(() => {
        closeCount += 1;
      }),
    };
    const fakeSql: FakeSqlJsStatic = { Database: vi.fn(() => db) };
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    await expect(mod.runSql("employees", "BAD SQL")).rejects.toThrow(/syntax error/);
    expect(closeCount).toBe(1);
  });
});

describe("sqljs / singleton behavior", () => {
  it("initSqlJs is called exactly once across many runSql calls", async () => {
    const initSpy = vi.fn(async () =>
      makeFakeSqlJs(() => [{ columns: ["x"], values: [[1]] }]),
    );
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = initSpy;
    const mod = await import("../sqljs");
    await mod.runSql("employees", "SELECT 1");
    await mod.runSql("social", "SELECT 2");
    await mod.runSql("ecommerce", "SELECT 3");
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it("CRITICAL (audit C1 pattern): rejected initSqlJs is cached and retries re-throw", async () => {
    let initCalls = 0;
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => {
      initCalls += 1;
      throw new Error("wasm 404");
    };
    const mod = await import("../sqljs");
    await expect(mod.runSql("employees", "SELECT 1")).rejects.toThrow(/wasm 404/);
    await expect(mod.runSql("employees", "SELECT 2")).rejects.toThrow(/wasm 404/);
    // Only ONE init call because the rejected promise is cached.
    expect(initCalls).toBe(1);
  });

  it("throws when initSqlJs is missing on globalThis after script load", async () => {
    // Provide no initSqlJs on globalThis — simulate a broken script.
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = undefined;
    const mod = await import("../sqljs");
    await expect(mod.runSql("employees", "SELECT 1")).rejects.toThrow(
      /initSqlJs was not available/,
    );
  });

  it("if initSqlJs is already on globalThis, the script tag is not injected", async () => {
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () =>
      makeFakeSqlJs(() => [{ columns: ["x"], values: [[1]] }]);
    const mod = await import("../sqljs");
    await mod.runSql("employees", "SELECT 1");
    expect(scriptElements).toHaveLength(0);
  });

  it("otherwise exactly one <script> tag is injected", async () => {
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () =>
      makeFakeSqlJs(() => [{ columns: ["x"], values: [[1]] }]);
    const mod = await import("../sqljs");
    await mod.runSql("employees", "SELECT 1");
    expect(scriptElements).toHaveLength(1);
    expect(scriptElements[0]?.src).toMatch(/sql-wasm\.js$/);
  });
});

describe("sqljs / getSchemaSummary", () => {
  it("returns one line per table with column types", async () => {
    const fakeSql = makeFakeSqlJs((q) => {
      if (q.includes("sqlite_master")) {
        return [{ columns: ["name"], values: [["employees"]] }];
      }
      if (q.includes("PRAGMA table_info(employees)")) {
        return [{ columns: ["cid", "name", "type"], values: [[0, "id", "INT"], [1, "name", "TEXT"]] }];
      }
      return [];
    });
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    const summary = await mod.getSchemaSummary("employees");
    expect(summary).toBe("employees(id INT, name TEXT)");
  });

  it("returns empty string when there are no tables", async () => {
    const fakeSql = makeFakeSqlJs(() => []);
    (globalThis as unknown as { initSqlJs?: unknown }).initSqlJs = async () => fakeSql;
    const mod = await import("../sqljs");
    expect(await mod.getSchemaSummary("employees")).toBe("");
  });
});
