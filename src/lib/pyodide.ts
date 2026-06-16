// Python execution for the browser.
//
// Primary path: run code in a Web Worker (src/workers/pyodide.worker.ts) with a
// hard timeout. If a submission runs past the timeout (e.g. an infinite loop),
// the client TERMINATES the worker — the only way to actually stop runaway
// Python; on the main thread it would freeze the tab. The worker is then
// respawned on the next run.
//
// Fallback path: if the environment has no Worker, or the worker fails to load
// Pyodide, we transparently fall back to the original main-thread loader so the
// sandbox keeps working (it just loses the freeze-protection in that case).

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const DEFAULT_TIMEOUT_MS = 20_000;

export type PythonRunResult = {
  stdout: string;
  stderr: string;
  error?: string;
  timedOut?: boolean;
};

// ────────── Worker path ──────────

let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), {
      type: "classic",
    });
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

type WorkerReply = {
  id: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  initError?: string;
};

// Returns a result, or null to signal "fall back to the main thread".
function runViaWorker(
  code: string,
  timeoutMs: number,
): Promise<PythonRunResult | null> {
  const w = getWorker();
  if (!w) return Promise.resolve(null);

  return new Promise((resolve) => {
    const id = ++seq;
    let done = false;

    const cleanup = () => {
      w.removeEventListener("message", onMsg);
      w.removeEventListener("error", onErr);
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      // Kill the runaway and force a fresh worker next time.
      w.terminate();
      worker = null;
      resolve({
        stdout: "",
        stderr: "",
        timedOut: true,
        error: `Execution timed out after ${Math.round(timeoutMs / 1000)}s — possible infinite loop.`,
      });
    }, timeoutMs);

    const onMsg = (e: MessageEvent) => {
      const d = e.data as WorkerReply;
      if (d.id !== id || done) return;
      done = true;
      cleanup();
      if (d.initError != null) {
        // Worker can't load Pyodide → don't keep trying it.
        workerBroken = true;
        worker = null;
        resolve(null);
        return;
      }
      resolve({ stdout: d.stdout ?? "", stderr: d.stderr ?? "", error: d.error });
    };

    const onErr = () => {
      if (done) return;
      done = true;
      cleanup();
      workerBroken = true;
      worker = null;
      resolve(null); // fall back
    };

    w.addEventListener("message", onMsg);
    w.addEventListener("error", onErr);
    w.postMessage({ id, code });
  });
}

// ────────── Main-thread fallback path ──────────

type PyodideAPI = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
};

let pyodidePromise: Promise<PyodideAPI> | null = null;

async function loadPyodideMainThread(): Promise<PyodideAPI> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
    const loader = (window as unknown as {
      loadPyodide: (opts: { indexURL: string }) => Promise<PyodideAPI>;
    }).loadPyodide;
    return loader({ indexURL: PYODIDE_INDEX_URL });
  })();
  return pyodidePromise;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function runPythonMainThread(code: string): Promise<PythonRunResult> {
  const py = await loadPyodideMainThread();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s) => { stdout += s; } });
  py.setStderr({ batched: (s) => { stderr += s; } });
  try {
    await py.runPythonAsync(code);
    return { stdout, stderr };
  } catch (e) {
    return { stdout, stderr, error: e instanceof Error ? e.message : String(e) };
  }
}

// ────────── Public API ──────────

export async function runPython(
  code: string,
  opts: { timeoutMs?: number } = {},
): Promise<PythonRunResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const viaWorker = await runViaWorker(code, timeoutMs);
  if (viaWorker) return viaWorker;
  return runPythonMainThread(code);
}

export function isPyodideLoaded(): boolean {
  return worker !== null || pyodidePromise !== null;
}

export function preloadPyodide(): void {
  // Warm whichever path will serve the first real run. A trivial program loads
  // Pyodide in the worker (or main thread on fallback) without blocking.
  void runPython("pass", { timeoutMs: 60_000 });
}
