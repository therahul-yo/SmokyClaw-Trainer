import type { CodingItem, SqlItem, Example, CompanyTag } from "../types";

const COMPANY_LABELS: Record<CompanyTag, string> = {
  tcs: "tcs",
  infosys: "infosys",
  wipro: "wipro",
  capgemini: "capgemini",
  accenture: "accenture",
  cognizant: "cognizant",
  "amazon-india": "amazon-in",
};

export function ProblemContext({ item }: { item: CodingItem | SqlItem }) {
  const examples: Example[] = item.examples ?? [];
  const constraints = item.constraints;
  const companies = item.companies ?? [];

  if (examples.length === 0 && !constraints && companies.length === 0) return null;

  return (
    <div className="space-y-3 font-mono">
      {examples.length > 0 && (
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="p-3 text-sm"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="text-xs mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                ── example {i + 1} ──
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>in   </span>
                <span style={{ color: "var(--color-text)" }}>{ex.input}</span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>out  </span>
                <span style={{ color: "var(--color-accent)" }}>{ex.output}</span>
              </div>
              {ex.explanation && (
                <div
                  className="mt-1 text-xs"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>//   </span>
                  {ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {constraints && (
        <div className="text-xs">
          <span style={{ color: "var(--color-text-muted)" }}>
            // constraints —{" "}
          </span>
          <span style={{ color: "var(--color-text-dim)" }}>{constraints}</span>
        </div>
      )}

      {companies.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs">
          <span style={{ color: "var(--color-text-muted)" }}>asked at:</span>
          {companies.map((c) => (
            <span
              key={c}
              className="px-1.5"
              style={{
                border: "1px solid var(--color-border-bright)",
                color: "var(--color-cyan)",
                background: "var(--color-bg)",
              }}
            >
              {COMPANY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
