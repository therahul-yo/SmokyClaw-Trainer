// Lazy-loaded Pyodide singleton.
// Pyodide is ~10MB; we load it from the official CDN on first use and cache
// the instance forever. Subsequent runs are instant.

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type PyodideAPI = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
};

let pyodidePromise: Promise<PyodideAPI> | null = null;

async function loadPyodide(): Promise<PyodideAPI> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    // Pyodide ships a loader script that injects globals into window. We load
    // it via a script tag rather than ESM because the official build expects
    // window.loadPyodide.
    await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
    const loader = (window as unknown as {
      loadPyodide: (opts: { indexURL: string }) => Promise<PyodideAPI>;
    }).loadPyodide;
    const py = await loader({ indexURL: PYODIDE_INDEX_URL });
    return py;
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

export type PythonRunResult = {
  stdout: string;
  stderr: string;
  error?: string;
};

export async function runPython(code: string): Promise<PythonRunResult> {
  const py = await loadPyodide();
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

export function isPyodideLoaded(): boolean {
  return pyodidePromise !== null;
}

export function preloadPyodide(): void {
  void loadPyodide();
}
