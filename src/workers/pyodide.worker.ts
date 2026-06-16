// Classic Web Worker that runs Python off the main thread. The whole point is
// that an infinite loop in a user submission can be killed with
// worker.terminate() from the client — on the main thread there is no way to
// interrupt a running py.runPythonAsync(), so a bad loop freezes the tab.
//
// Pyodide is loaded via importScripts from the same CDN the main-thread path
// uses (so online behavior is unchanged); bundling it for offline use is a
// separate Phase-5 concern. We cast `self` to a minimal shape so this file
// type-checks under the app's DOM lib without pulling in the WebWorker lib
// (which would conflict globally).

type PyodideLike = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (o: { batched: (s: string) => void }) => void;
  setStderr: (o: { batched: (s: string) => void }) => void;
};

type WorkerScope = {
  importScripts: (url: string) => void;
  loadPyodide: (opts: { indexURL: string }) => Promise<PyodideLike>;
  postMessage: (msg: unknown) => void;
  onmessage: ((e: { data: unknown }) => void) | null;
};

type RunRequest = { id: number; code: string };

const ctx = self as unknown as WorkerScope;

const PYODIDE_VERSION = "0.26.4";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let readyPromise: Promise<PyodideLike> | null = null;
function ready(): Promise<PyodideLike> {
  if (!readyPromise) {
    readyPromise = (async () => {
      ctx.importScripts(`${INDEX_URL}pyodide.js`);
      return ctx.loadPyodide({ indexURL: INDEX_URL });
    })();
  }
  return readyPromise;
}

ctx.onmessage = async (e: { data: unknown }) => {
  const { id, code } = e.data as RunRequest;
  let py: PyodideLike;
  try {
    py = await ready();
  } catch (err) {
    // Pyodide failed to load in the worker — tell the client so it can fall
    // back to the main-thread loader.
    ctx.postMessage({ id, initError: err instanceof Error ? err.message : String(err) });
    return;
  }
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s: string) => { stdout += s; } });
  py.setStderr({ batched: (s: string) => { stderr += s; } });
  try {
    await py.runPythonAsync(code);
    ctx.postMessage({ id, stdout, stderr });
  } catch (err) {
    ctx.postMessage({
      id,
      stdout,
      stderr,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
