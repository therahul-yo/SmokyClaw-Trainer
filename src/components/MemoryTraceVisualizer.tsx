import { useState, useEffect, useRef, useLayoutEffect } from "react";

type Variable = {
  name: string;
  type: "ref" | "val";
  value: string; // reference address like "0x1" or value like "42"
};

type HeapObject = {
  id: string;
  type: "list" | "dict" | "str" | "int" | "tuple" | "object";
  value: unknown;
};

type TraceStep = {
  line: number;
  stack: Variable[];
  heap: HeapObject[];
  note?: string;
};

type TraceData = {
  code: string[];
  steps: TraceStep[];
};


export function MemoryTraceVisualizer({ json }: { json: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TraceData | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [connections, setConnections] = useState<{ x1: number; y1: number; x2: number; y2: number; label: string }[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse JSON data safely
  useEffect(() => {
    try {
      const parsed = JSON.parse(json) as TraceData;
      if (!parsed.code || !parsed.steps) {
        throw new Error("Missing 'code' or 'steps' array in trace schema");
      }
      setData(parsed);
      setParseError(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON schema");
    }
  }, [json]);

  const steps = data?.steps || [];
  const currentStep = steps[stepIndex];

  // Auto-play interval
  useEffect(() => {
    if (!playing || !data) return;
    const interval = setInterval(() => {
      setStepIndex((idx) => {
        if (idx >= steps.length - 1) {
          setPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [playing, data, steps.length]);

  // Calculate coordinates for connection lines
  const updateLayout = () => {
    if (!containerRef.current || !currentStep) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnections: typeof connections = [];

    currentStep.stack.forEach((variable) => {
      if (variable.type === "ref") {
        const srcEl = document.getElementById(`ref-src-${variable.name}`);
        const destEl = document.getElementById(`ref-dest-${variable.value}`);

        if (srcEl && destEl) {
          const srcRect = srcEl.getBoundingClientRect();
          const destRect = destEl.getBoundingClientRect();

          // Connect from right edge of stack label to left edge of heap box
          const x1 = srcRect.right - containerRect.left;
          const y1 = srcRect.top + srcRect.height / 2 - containerRect.top;
          const x2 = destRect.left - containerRect.left;
          const y2 = destRect.top + destRect.height / 2 - containerRect.top;

          newConnections.push({ x1, y1, x2, y2, label: variable.name });
        }
      }
    });

    setConnections(newConnections);
  };

  // Re-calculate layout on index change, resize or window load
  useLayoutEffect(() => {
    updateLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, currentStep]);

  useEffect(() => {
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  if (parseError) {
    return (
      <div className="p-3 font-mono text-xs text-red-500 bg-red-950/20 border border-red-900 my-4">
        [ERROR] Failed to load memory trace visualizer: {parseError}
      </div>
    );
  }

  if (!data || !currentStep) return null;

  const handlePrev = () => {
    setPlaying(false);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleNext = () => {
    setPlaying(false);
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  };

  const renderHeapValue = (obj: HeapObject) => {
    if (Array.isArray(obj.value)) {
      return `[${obj.value.join(", ")}]`;
    }
    if (typeof obj.value === "object" && obj.value !== null) {
      return JSON.stringify(obj.value);
    }
    return String(obj.value);
  };

  return (
    <div
      ref={containerRef}
      className="relative my-6 font-mono text-xs border border-bright p-4 rounded bg-black select-none"
      style={{ borderColor: "var(--color-border-bright)", background: "var(--color-bg-alt)" }}
    >
      <div className="flex items-center justify-between mb-4 border-b border-dashed pb-2" style={{ borderColor: "var(--color-border)" }}>
        <span className="font-bold text-[10px] tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>
          ── Interactive Reference Tracer ──
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={stepIndex === 0}
            className="px-2 py-0.5 border text-[10px] disabled:opacity-30 transition-colors"
            style={{ borderColor: "var(--color-border-bright)", background: "var(--color-bg-card)" }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="px-2 py-0.5 border text-[10px] transition-colors"
            style={{
              borderColor: "var(--color-border-bright)",
              background: playing ? "var(--color-amber)" : "var(--color-bg-card)",
              color: playing ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={stepIndex === steps.length - 1}
            className="px-2 py-0.5 border text-[10px] disabled:opacity-30 transition-colors"
            style={{ borderColor: "var(--color-border-bright)", background: "var(--color-bg-card)" }}
          >
            Next
          </button>
          <span className="text-[10px] ml-2" style={{ color: "var(--color-text-muted)" }}>
            Step {stepIndex + 1}/{steps.length}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-4 relative min-h-[180px]">
        {/* Code Listing (Column 1) */}
        <div className="flex flex-col border p-3 rounded" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
          <div className="text-[10px] uppercase font-bold mb-2 text-center" style={{ color: "var(--color-text-muted)" }}>
            Execution Trace
          </div>
          <div className="flex-1 space-y-1.5 py-1">
            {data.code.map((line, i) => {
              const active = i + 1 === currentStep.line;
              return (
                <div
                  key={i}
                  className={`px-1.5 py-0.5 rounded flex gap-2 transition-colors ${
                    active ? "font-bold shadow-sm" : ""
                  }`}
                  style={{
                    background: active ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    color: active ? "var(--color-amber)" : "var(--color-text-dim)",
                    borderLeft: active ? "2px solid var(--color-amber)" : "2px solid transparent",
                  }}
                >
                  <span className="w-4 text-right text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {i + 1}
                  </span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stack Frame (Column 2) */}
        <div className="flex flex-col border p-3 rounded" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
          <div className="text-[10px] uppercase font-bold mb-2 text-center" style={{ color: "var(--color-text-muted)" }}>
            Call Stack (Local Scope)
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            {currentStep.stack.length === 0 ? (
              <div className="text-[10px] text-center italic" style={{ color: "var(--color-text-muted)" }}>
                Empty scope
              </div>
            ) : (
              currentStep.stack.map((variable) => (
                <div
                  key={variable.name}
                  id={`ref-src-${variable.name}`}
                  className="flex items-center justify-between p-2 border transition-all hover:brightness-110"
                  style={{
                    background: "var(--color-bg-card)",
                    borderColor: "var(--color-border-bright)",
                  }}
                >
                  <span className="font-bold" style={{ color: "var(--color-cyan)" }}>{variable.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] tabular-nums"
                    style={{
                      background: variable.type === "ref" ? "rgba(34, 211, 238, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      color: variable.type === "ref" ? "var(--color-cyan)" : "var(--color-accent)",
                    }}
                  >
                    {variable.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Heap Objects (Column 3) */}
        <div className="flex flex-col border p-3 rounded" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
          <div className="text-[10px] uppercase font-bold mb-2 text-center" style={{ color: "var(--color-text-muted)" }}>
            Heap Memory
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            {currentStep.heap.length === 0 ? (
              <div className="text-[10px] text-center italic" style={{ color: "var(--color-text-muted)" }}>
                No allocations
              </div>
            ) : (
              currentStep.heap.map((obj) => (
                <div
                  key={obj.id}
                  id={`ref-dest-${obj.id}`}
                  className="p-2 border transition-all hover:brightness-110"
                  style={{
                    background: "var(--color-bg-card)",
                    borderColor: "var(--color-border-bright)",
                    boxShadow: "0 0 2px rgba(245, 158, 11, 0.05)",
                  }}
                >
                  <div className="flex justify-between items-center text-[9px] mb-1 pb-0.5 border-b border-dashed" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                    <span className="uppercase text-[8px] font-bold">{obj.type}</span>
                    <span className="tabular-nums font-bold" style={{ color: "var(--color-amber)" }}>{obj.id}</span>
                  </div>
                  <div className="text-[11px] truncate font-bold text-center" style={{ color: "var(--color-text)" }}>
                    {renderHeapValue(obj)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connection Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-cyan)" />
            </marker>
          </defs>
          {connections.map((line, idx) => {
            // Draw a bezier curve from start to target coordinate
            const dx = Math.abs(line.x2 - line.x1);
            const controlOffset = Math.min(dx * 0.5, 80);
            const d = `M ${line.x1} ${line.y1} C ${line.x1 + controlOffset} ${line.y1}, ${line.x2 - controlOffset} ${line.y2}, ${line.x2} ${line.y2}`;

            return (
              <g key={idx} className="opacity-80 transition-all hover:opacity-100">
                <path
                  d={d}
                  fill="none"
                  stroke="var(--color-cyan)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                  className="crt-glow"
                  style={{
                    filter: "drop-shadow(0 0 2px rgba(34, 211, 238, 0.5))",
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {currentStep.note && (
        <div
          className="mt-3 p-2 border-t border-dashed text-[11px]"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
        >
          <span style={{ color: "var(--color-amber)" }} className="font-bold mr-1">Note:</span>
          {currentStep.note}
        </div>
      )}
    </div>
  );
}
