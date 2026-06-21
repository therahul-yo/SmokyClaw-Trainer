// Tests for src/lib/pyodide.ts (the singleton wrapper around Pyodide).
//
// We don't load the actual Pyodide runtime — it's a 10MB browser WASM bundle.
// Instead we mock window.loadPyodide and document.head so we can exercise
// the singleton and loadScript dedup behavior in a node test environment.
//
// Key invariants:
//   1. loadScript dedupes by src — calling runPython twice does not
//      inject two <script> tags.
//   2. loadPyodide is a singleton — concurrent callers get the same promise.
//   3. CRITICAL: when the underlying promise rejects, the module-level
//      pyodidePromise retains the rejected promise forever (audit C1: there
//      is no retry path). This test pins that behavior so any future fix
//      will be an intentional diff.
//   4. runPython plumbs stdout/stderr back from the batched callbacks.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Polyfill the minimal browser surface that pyodide.ts touches in node.
type FakeScriptEl = {
  src: string;
  async: boolean;
  dataset: { loaded?: string };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  setAttribute?: (k: string, v: string) => void;
};

const scriptElements: FakeScriptEl[] = [];

function installDOM() {
  scriptElements.length = 0;

  (globalThis as unknown as { document: unknown }).document = {
    head: {
      appendChild: (el: FakeScriptEl) => {
        scriptElements.push(el);
        // Fire load asynchronously so listeners have a chance to attach.
        setTimeout(() => el.onload?.(), 0);
        return el;
      },
    },
    querySelector: (_sel: string) => null as FakeScriptEl | null,
    createElement: (_tag: string) => {
      const el: FakeScriptEl = {
        src: "",
        async: false,
        dataset: {},
        onload: null,
        onerror: null,
      };
      return el;
    },
  };
}

beforeEach(() => {
  installDOM();
  // Reset the module's internal singleton. We do this by re-importing
  // via vi.resetModules().
  vi.resetModules();
  scriptElements.length = 0;
});

describe("pyodide / loadScript dedup", () => {
  it("injects exactly one <script> tag even when loadPyodide is called twice", async () => {
    const mod = await import("../pyodide");
    // First call — but we need a window.loadPyodide available. Provide one.
    (globalThis as unknown as { window?: unknown }).window = {
      loadPyodide: vi.fn(async () => ({
        runPythonAsync: async () => undefined,
        setStdout: () => {},
        setStderr: () => {},
      })),
    };
    // Two concurrent runPython calls share the same loadPyodide() promise.
    const p1 = mod.runPython("print('a')");
    const p2 = mod.runPython("print('b')");
    await Promise.all([p1, p2]);
    expect(scriptElements).toHaveLength(1);
    expect(scriptElements[0]?.src).toMatch(/pyodide\.js$/);
  });
});

describe("pyodide / singleton behavior", () => {
  it("concurrent runPython calls share one loadPyodide() call", async () => {
    const loadPyodideMock = vi.fn(async () => ({
      runPythonAsync: async (code: string) => code,
      setStdout: () => {},
      setStderr: () => {},
    }));
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: loadPyodideMock,
    };
    const mod = await import("../pyodide");
    const a = mod.runPython("print('a')");
    const b = mod.runPython("print('b')");
    await Promise.all([a, b]);
    expect(loadPyodideMock).toHaveBeenCalledTimes(1);
  });

  it("isPyodideLoaded() flips to true after runPython resolves", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: async () => ({
        runPythonAsync: async () => undefined,
        setStdout: () => {},
        setStderr: () => {},
      }),
    };
    const mod = await import("../pyodide");
    expect(mod.isPyodideLoaded()).toBe(false);
    await mod.runPython("");
    expect(mod.isPyodideLoaded()).toBe(true);
  });

  it("CRITICAL (audit C1): a rejected loadPyodide promise is cached forever — retry returns the same rejection", async () => {
    let callCount = 0;
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: vi.fn(async () => {
        callCount += 1;
        throw new Error("CDN down");
      }),
    };
    const mod = await import("../pyodide");
    const r1 = await mod.runPython("a");
    const r2 = await mod.runPython("b");
    // loadPyodide is only called once because pyodidePromise is set and
    // never reset on failure.
    expect(callCount).toBe(1);
    expect(r1.error).toContain("CDN down");
    expect(r2.error).toContain("CDN down");
  });

  it("preloadPyodide() primes the singleton without throwing", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: async () => ({
        runPythonAsync: async () => undefined,
        setStdout: () => {},
        setStderr: () => {},
      }),
    };
    const mod = await import("../pyodide");
    mod.preloadPyodide();
    expect(mod.isPyodideLoaded()).toBe(true);
  });
});

describe("pyodide / runPython output plumbing", () => {
  it("aggregates stdout/stderr from batched callbacks", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: async () => ({
        runPythonAsync: async (_code: string) => undefined,
        setStdout: ({ batched }: { batched: (s: string) => void }) => {
          batched("hello ");
          batched("world\n");
        },
        setStderr: ({ batched }: { batched: (s: string) => void }) => {
          batched("warn: ");
          batched("something\n");
        },
      }),
    };
    const mod = await import("../pyodide");
    const r = await mod.runPython("print('x')");
    expect(r.stdout).toBe("hello world\n");
    expect(r.stderr).toBe("warn: something\n");
    expect(r.error).toBeUndefined();
  });

  it("surfaces non-Error throw values as String(value)", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: async () => ({
        runPythonAsync: async () => {
          throw "raw string error";
        },
        setStdout: () => {},
        setStderr: () => {},
      }),
    };
    const mod = await import("../pyodide");
    const r = await mod.runPython("x");
    expect(r.error).toBe("raw string error");
  });

  it("surfaces Error throw values via .message", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      loadPyodide: async () => ({
        runPythonAsync: async () => {
          throw new Error("kaboom");
        },
        setStdout: () => {},
        setStderr: () => {},
      }),
    };
    const mod = await import("../pyodide");
    const r = await mod.runPython("x");
    expect(r.error).toBe("kaboom");
  });
});
