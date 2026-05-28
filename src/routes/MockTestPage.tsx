import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type {
  McqItem,
  MockSection,
  MockTestBlueprint,
  QuizItem,
} from "../types";
import { getBlueprint } from "../lib/mockTestFormats";
import { getAllQuizItems } from "../lib/contentLoader";
import { useProgressStore } from "../store";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

type Phase = "intro" | "section" | "done";

type PickedSection = {
  meta: MockSection;
  items: McqItem[];
};

function pickItemsForSection(section: MockSection, pool: QuizItem[]): McqItem[] {
  const criteria = Array.isArray(section.pickFrom)
    ? section.pickFrom
    : [section.pickFrom];
  const matches: McqItem[] = [];
  for (const item of pool) {
    if (item.type !== "mcq") continue;
    const ok = criteria.some((c) => {
      if (c.track !== item.track) return false;
      if (c.topics && !c.topics.includes(item.topic)) return false;
      if (c.type && c.type !== item.type) return false;
      return true;
    });
    if (ok) matches.push(item);
  }
  for (let i = matches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  return matches.slice(0, section.questionCount);
}

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
  const [now, setNow] = useState(Date.now());
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

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
    setSectionIdx(0);
    setPhase("section");
  };

  useEffect(() => {
    if (phase !== "section") return;
    const deadline = deadlines[sectionIdx];
    if (!deadline) return;
    if (now >= deadline) {
      if (sectionIdx < sections.length - 1) {
        setSectionIdx(sectionIdx + 1);
      } else {
        finalize();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, deadlines, sectionIdx, sections.length, phase]);

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

  if (phase === "intro") return <Intro blueprint={blueprint} onStart={start} />;
  if (phase === "done")
    return <Report blueprint={blueprint} sections={sections} answers={answers} />;

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
                                ? "rgba(92, 255, 159, 0.05)"
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

function Report({
  blueprint,
  sections,
  answers,
}: {
  blueprint: MockTestBlueprint;
  sections: PickedSection[];
  answers: Record<string, number>;
}) {
  const sectionResults = sections.map((sec) => {
    let correct = 0;
    for (const q of sec.items) {
      if (answers[q.id] === q.answerIndex) correct += 1;
    }
    return { title: sec.meta.title, correct, total: sec.items.length };
  });
  const totalCorrect = sectionResults.reduce((a, s) => a + s.correct, 0);
  const totalQs = sectionResults.reduce((a, s) => a + s.total, 0);
  const pct = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  return (
    <div className="max-w-2xl space-y-4">
      <Prompt path={`~/mock/${blueprint.id}/report`}>
        <span>cat score.report</span>
      </Prompt>
      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        {blueprint.title}.report
      </div>
      <div
        className="text-3xl font-bold tabular-nums font-mono"
        style={{
          color: pct >= 65 ? "var(--color-accent)" : "var(--color-amber)",
        }}
      >
        {totalCorrect}/{totalQs}
        <span
          className="text-base font-normal ml-3"
          style={{ color: "var(--color-text-dim)" }}
        >
          = {pct}%
        </span>
      </div>

      <Box title="$ section --breakdown">
        <div className="space-y-1 font-mono text-sm">
          {sectionResults.map((r) => {
            const sectionPct =
              r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
            return (
              <div key={r.title} className="flex justify-between">
                <span style={{ color: "var(--color-text)" }}>{r.title}</span>
                <span>
                  <span
                    style={{
                      color:
                        sectionPct >= 65
                          ? "var(--color-accent)"
                          : "var(--color-amber)",
                    }}
                  >
                    {r.correct}/{r.total}
                  </span>
                  <span
                    className="ml-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ({sectionPct}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Box>

      <div
        className="text-sm font-mono"
        style={{ color: "var(--color-text-dim)" }}
      >
        // cutoffs vary. TCS NQT prime band ≈ {Math.ceil(totalQs * 0.65)}+
        correct (65%). wrong items added to review queue.
      </div>

      <BracketButton onClick={() => window.location.reload()}>
        ↻ take again
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
