import type { CodingItem, SqlItem, Example, CompanyTag } from "../types";

const COMPANY_LABELS: Record<CompanyTag, string> = {
  tcs: "TCS",
  infosys: "Infosys",
  wipro: "Wipro",
  capgemini: "Capgemini",
  accenture: "Accenture",
  cognizant: "Cognizant",
  "amazon-india": "Amazon India",
};

// Renders the static problem context — examples, constraints, companies —
// shown above the editor for both coding and SQL items.
export function ProblemContext({ item }: { item: CodingItem | SqlItem }) {
  const examples: Example[] = item.examples ?? [];
  const constraints = item.constraints;
  const companies = item.companies ?? [];

  if (examples.length === 0 && !constraints && companies.length === 0) return null;

  return (
    <div className="space-y-3">
      {examples.length > 0 && (
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="p-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-mono"
            >
              <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Example {i + 1}
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">input:</span>{" "}
                <span className="text-[var(--color-text)]">{ex.input}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">output:</span>{" "}
                <span className="text-[var(--color-success)]">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="mt-1 text-xs text-[var(--color-text-dim)] font-sans">
                  {ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {constraints && (
        <div className="text-xs text-[var(--color-text-dim)] font-mono">
          <span className="text-[var(--color-text-muted)] uppercase tracking-wider">
            Constraints:
          </span>{" "}
          {constraints}
        </div>
      )}

      {companies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {companies.map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-dim)]"
            >
              {COMPANY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
