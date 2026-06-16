import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type {
  McqItem,
  MockSection,
  MockTestBlueprint,
} from "../types";
import { getBlueprint } from "../lib/mockTestFormats";
import { getAllQuizItems } from "../lib/contentLoader";
import { pickItemsForSection } from "../lib/mockPicker";
import { useProgressStore } from "../store";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { PostMockReport } from "../components/PostMockReport";

type Phase = "intro" | "section" | "done";

type PickedSection = {
  meta: MockSection;
  items: McqItem[];
};

export function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const blueprint = id ? getBlueprint(id as MockTestBlueprint["id"]) : undefined;
  if (!blueprint) return <Navigate to="/" replace />;
  return <MockTestRun blueprint={blueprint} />;
}

function MockTestRun({ blueprint }: { blueprint: MockTestBlueprint }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sections, setSections] = useState<PickedSection[]>([]);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [deadlines, setDeadlines] = useState<number[]>([]);
  const [now, setNow] = useState(0);
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  // Display clock — drives only the countdown UI.
  useEffect(() => {
    if (phase !== "section") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => {
    const pool = getAllQuizItems();
    const picked = blueprint.sections.map((meta) => ({
      meta,
      items: pickItemsForSection(meta, pool),
    }));
    setSections(picked);
    const startTs = Date.now();
    setDeadlines(
      blueprint.sections.map((_s, i) => {
        const prior = blueprint.sections
          .slice(0, i + 1)
          .reduce((acc, x) => acc + x.durationMinutes, 0);
        return startTs + prior * 60_000;
      }),
    );
    setNow(startTs);
    setSectionIdx(0);
    setPhase("section");
  };

  const finalize = () => {
    for (const sec of sections) {
      for (const item of sec.items) {
        const ans = answers[item.id];
        const correct = ans === item.answerIndex;
        recordAttempt({ itemId: item.id, correct, timeMs: 0 });
      }
    }
    setPhase("done");
  };

  // Section auto-advance — a single timeout aimed at the current deadline.
  // Re-arming on every dep change is harmless: the target instant is fixed.
  useEffect(() => {
    if (phase !== "section") return;
    const deadline = deadlines[sectionIdx];
    if (!deadline) return;
    const t = setTimeout(() => {
      if (sectionIdx < sections.length - 1) {
        setSectionIdx(sectionIdx + 1);
      } else {
        finalize();
      }
    }, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadlines, sectionIdx, sections, answers]);

  if (phase === "intro") return <Intro blueprint={blueprint} onStart={start} />;
  if (phase === "done")
    return <PostMockReport blueprint={blueprint} sections={sections} answers={answers} />;

  const section = sections[sectionIdx];
  if (!section) return null;
  const deadline = deadlines[sectionIdx];
  const remaining = Math.max(0, deadline - now);
  const lowTime = remaining < 60_000;

  return (
    <div className="space-y-4">
      <Prompt path={`~/mock/${blueprint.id}`}>
        <span>section {sectionIdx + 1}/{sections.length} --running</span>
      </Prompt>

      <div
        className="flex items-center justify-between px-3 py-2 font-mono"
        style={{
          background: "var(--color-bg-alt)",
          border: `1px solid ${lowTime ? "var(--color-danger)" : "var(--color-border-bright)"}`,
        }}
      >
        <div>
          <div
            className="text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            section {sectionIdx + 1} / {sections.length}
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: "var(--color-text)" }}
          >
            {section.meta.title}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            time left
          </div>
          <div
            className={"text-2xl font-bold tabular-nums" + (lowTime ? " crt-glow" : "")}
            style={{
              color: lowTime ? "var(--color-danger)" : "var(--color-accent)",
            }}
          >
            {formatTime(remaining)}
          </div>
        </div>
      </div>

      {section.items.length === 0 ? (
        <div
          className="text-sm italic font-mono"
          style={{ color: "var(--color-text-dim)" }}
        >
          // no questions available for this section yet — skip ahead.
        </div>
      ) : (
        <ol className="space-y-3">
          {section.items.map((q, qi) => (
            <li
              key={q.id}
              className="p-3 font-mono"
              style={{
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="font-bold"
                  style={{ color: "var(--color-amber)" }}
                >
                  Q{String(qi + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <div
                    className="whitespace-pre-wrap text-sm"
                    style={{ color: "var(--color-text)" }}
                  >
                    {q.question}
                  </div>
                  <ul className="mt-3 space-y-1">
                    {q.options.map((opt, oi) => {
                      const checked = answers[q.id] === oi;
                      return (
                        <li key={oi}>
                          <label
                            className="flex gap-2 items-start cursor-pointer px-2 py-1 transition-colors"
                            style={{
                              border: `1px solid ${checked ? "var(--color-accent)" : "transparent"}`,
                              background: checked
                                ? "rgba(255, 140, 0, 0.05)"
                                : "transparent",
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={checked}
                              onChange={() =>
                                setAnswers((a) => ({ ...a, [q.id]: oi }))
                              }
                              className="mt-1 accent-[var(--color-accent)]"
                            />
                            <span className="text-sm">
                              <span
                                className="mr-2"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                [{String.fromCharCode(65 + oi)}]
                              </span>
                              <span style={{ color: "var(--color-text)" }}>
                                {opt}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex justify-end gap-2">
        {sectionIdx < sections.length - 1 ? (
          <BracketButton
            variant="primary"
            onClick={() => setSectionIdx(sectionIdx + 1)}
          >
            submit & next section →
          </BracketButton>
        ) : (
          <BracketButton variant="primary" onClick={finalize}>
            submit final
          </BracketButton>
        )}
      </div>
    </div>
  );
}

function Intro({
  blueprint,
  onStart,
}: {
  blueprint: MockTestBlueprint;
  onStart: () => void;
}) {
  const totalMin = blueprint.sections.reduce((a, s) => a + s.durationMinutes, 0);
  return (
    <div className="max-w-2xl space-y-4">
      <Prompt path={`~/mock/${blueprint.id}`}>
        <span>start --simulator</span>
      </Prompt>
      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-danger)" }}
      >
        {blueprint.title}
      </div>
      <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
        {blueprint.subtitle}
      </div>

      <Box title="$ format" trailing={`${totalMin} min total`}>
        <ol className="space-y-1.5 text-sm font-mono">
          {blueprint.sections.map((s, i) => {
            const last = i === blueprint.sections.length - 1;
            return (
              <li key={s.id} className="flex justify-between gap-4">
                <span style={{ color: "var(--color-text)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {last ? "└─ " : "├─ "}
                  </span>
                  <span style={{ color: "var(--color-amber)" }}>
                    sec {i + 1}.
                  </span>{" "}
                  {s.title}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {s.questionCount}q · {s.durationMinutes}m
                </span>
              </li>
            );
          })}
        </ol>
        {blueprint.codingSection && (
          <div
            className="mt-3 text-xs font-mono"
            style={{ color: "var(--color-text-dim)" }}
          >
            // + coding round: {blueprint.codingSection.problemCount} problem(s)
            · {blueprint.codingSection.durationMinutes} min (use python sandbox)
          </div>
        )}
      </Box>

      <Box title="$ warning" variant="amber">
        <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
          ⏱ timers auto-advance sections. refresh resets the run. submit early
          with "next section" if you finish before time.
        </div>
      </Box>

      <BracketButton variant="danger" onClick={onStart}>
        start simulation →
      </BracketButton>
    </div>
  );
}



function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
