import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type {
  CodingItem,
  McqItem,
  MockSection,
  MockTestBlueprint,
  QuizItem,
} from "../types";
import { getBlueprint } from "../lib/mockTestFormats";
import { getAllQuizItems } from "../lib/contentLoader";
import {
  pickCodingItemsForSection,
  pickItemsForSection,
} from "../lib/mockPicker";
import { hashSeed, seededRng } from "../lib/rng";
import { useMockTestRunStore, useProgressStore } from "../store";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { CodingSandbox } from "../components/CodingSandbox";
import { PostMockReport } from "../components/PostMockReport";

type Screen = "intro" | "running" | "report";

type PickedSection = {
  meta: MockSection;
  items: McqItem[];
};

function makeRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: combine a perf counter and a store-provided value is overkill;
  // a timestamp suffices since runIds only need to be unique per device.
  return `run-${Date.now()}`;
}

export function MockTestPage() {
  const { id } = useParams<{ id: string }>();
  const blueprint = id ? getBlueprint(id as MockTestBlueprint["id"]) : undefined;
  if (!blueprint) return <Navigate to="/" replace />;
  return <MockTestRun blueprint={blueprint} />;
}

function MockTestRun({ blueprint }: { blueprint: MockTestBlueprint }) {
  const pool = useMemo(() => getAllQuizItems(), []);
  const itemById = useMemo(() => {
    const m = new Map<string, QuizItem>();
    for (const it of pool) m.set(it.id, it);
    return m;
  }, [pool]);

  const run = useMockTestRunStore();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  // A previous run of *this* blueprint is in flight → resume into it so a
  // 100-min exam survives an accidental refresh.
  const [screen, setScreen] = useState<Screen>(() => {
    const s = useMockTestRunStore.getState();
    if (s.blueprintId === blueprint.id && s.startedAt != null) {
      return s.phase === "done" ? "report" : "running";
    }
    return "intro";
  });

  const [now, setNow] = useState(0);
  const [codingIdx, setCodingIdx] = useState(0);
  const [extendedTime, setExtendedTime] = useState(false);
  const codingShownRef = useRef(0);

  // Resolve persisted item-ids back into full items (deterministic lookup).
  const sections = useMemo<PickedSection[]>(
    () =>
      run.itemIdsBySection.map((ids, i) => ({
        meta: blueprint.sections[i],
        items: ids
          .map((id) => itemById.get(id))
          .filter((x): x is McqItem => !!x && x.type === "mcq"),
      })),
    [run.itemIdsBySection, blueprint.sections, itemById],
  );
  const codingItems = useMemo<CodingItem[]>(
    () =>
      run.codingItemIds
        .map((id) => itemById.get(id))
        .filter((x): x is CodingItem => !!x && x.type === "coding"),
    [run.codingItemIds, itemById],
  );

  // Display clock — drives only the countdown UI. The setTimeout(…, 0) seeds
  // `now` immediately on entry/resume (async, so it doesn't trip the
  // set-state-in-effect lint) before the interval takes over.
  useEffect(() => {
    if (screen !== "running") return;
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 500);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [screen]);

  // Stamp first-seen time for every item in the active MCQ section.
  useEffect(() => {
    if (screen !== "running" || run.phase !== "section") return;
    const sec = sections[run.sectionIdx];
    if (!sec) return;
    const ts = Date.now();
    for (const item of sec.items) run.markItemSeen(item.id, ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, run.phase, run.sectionIdx, sections]);

  // Reset the coding-problem stopwatch when the active problem changes.
  useEffect(() => {
    if (screen !== "running" || run.phase !== "coding") return;
    codingShownRef.current = Date.now();
  }, [screen, run.phase, codingIdx]);

  const start = () => {
    const startTs = Date.now();
    const runId = makeRunId();
    const rng = seededRng(hashSeed(blueprint.id + runId));
    const used = new Set<string>();
    const itemIdsBySection: string[][] = [];
    for (const meta of blueprint.sections) {
      const picked = pickItemsForSection(meta, pool, rng, used);
      for (const p of picked) used.add(p.id);
      itemIdsBySection.push(picked.map((p) => p.id));
    }
    // Extended-time accommodation: 1.5× the clock on every section + coding round.
    const mult = extendedTime ? 1.5 : 1;
    const sectionDeadlines = blueprint.sections.map((_s, i) => {
      const prior = blueprint.sections
        .slice(0, i + 1)
        .reduce((acc, x) => acc + x.durationMinutes, 0);
      return startTs + prior * 60_000 * mult;
    });
    let codingItemIds: string[] = [];
    let codingDeadline: number | null = null;
    if (blueprint.codingSection) {
      const cpick = pickCodingItemsForSection(blueprint.codingSection, pool, rng, used);
      codingItemIds = cpick.map((c) => c.id);
      const lastDeadline = sectionDeadlines[sectionDeadlines.length - 1] ?? startTs;
      codingDeadline = lastDeadline + blueprint.codingSection.durationMinutes * 60_000 * mult;
    }
    run.startRun({
      blueprintId: blueprint.id,
      runId,
      startedAt: startTs,
      itemIdsBySection,
      codingItemIds,
      sectionDeadlines,
      codingDeadline,
    });
    setNow(startTs);
    setCodingIdx(0);
    setScreen("running");
  };

  const restart = () => {
    run.resetAll();
    setCodingIdx(0);
    setScreen("intro");
  };

  // Record MCQ attempts (real per-item timing, clamped to the section budget),
  // then move into the coding round or finish.
  const finishMcqPhase = () => {
    if (useMockTestRunStore.getState().phase !== "section") return;
    const ts = Date.now();
    const { itemStartTsById, mcqAnswers, startedAt } = useMockTestRunStore.getState();
    for (const sec of sections) {
      const cap = sec.meta.durationMinutes * 60_000;
      for (const item of sec.items) {
        const ans = mcqAnswers[item.id];
        const correct = ans === item.answerIndex;
        const start = itemStartTsById[item.id] ?? startedAt ?? ts;
        const timeMs = Math.min(Math.max(0, ts - start), cap);
        recordAttempt({ itemId: item.id, correct, timeMs });
      }
    }
    if (codingItems.length > 0) {
      run.setPhase("coding");
      setCodingIdx(0);
    } else {
      run.setPhase("done");
      setScreen("report");
    }
  };

  const finishCoding = () => {
    if (useMockTestRunStore.getState().phase !== "coding") return;
    run.setPhase("done");
    setScreen("report");
  };

  // Section auto-advance — a single timeout aimed at the current deadline.
  useEffect(() => {
    if (screen !== "running" || run.phase !== "section") return;
    const deadline = run.sectionDeadlines[run.sectionIdx];
    if (!deadline) return;
    const t = setTimeout(() => {
      if (run.sectionIdx < sections.length - 1) {
        run.setSectionIdx(run.sectionIdx + 1);
      } else {
        finishMcqPhase();
      }
    }, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, run.phase, run.sectionDeadlines, run.sectionIdx, sections]);

  // Coding-round auto-advance — submit the whole round at its deadline.
  useEffect(() => {
    if (screen !== "running" || run.phase !== "coding") return;
    const deadline = run.codingDeadline;
    if (!deadline) return;
    const t = setTimeout(() => finishCoding(), Math.max(0, deadline - Date.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, run.phase, run.codingDeadline]);

  if (screen === "intro")
    return (
      <Intro
        blueprint={blueprint}
        onStart={start}
        canResume={run.blueprintId === blueprint.id && run.startedAt != null && run.phase !== "done"}
        onResume={() => setScreen("running")}
        extendedTime={extendedTime}
        onToggleExtendedTime={() => setExtendedTime((v) => !v)}
      />
    );

  if (screen === "report")
    return (
      <PostMockReport
        blueprint={blueprint}
        sections={sections}
        answers={run.mcqAnswers}
        codingItems={codingItems}
        codingResults={Object.values(run.codingResultsById)}
        onRestart={restart}
      />
    );

  // ── running ──────────────────────────────────────────────
  if (run.phase === "coding") {
    return (
      <CodingRound
        blueprint={blueprint}
        items={codingItems}
        idx={codingIdx}
        remaining={Math.max(0, (run.codingDeadline ?? now) - now)}
        onAnswered={(correct, gaveUp) =>
          run.recordCoding({
            itemId: codingItems[codingIdx].id,
            solved: correct && !gaveUp,
            gaveUp: !!gaveUp,
            timeMs: Math.max(0, Date.now() - codingShownRef.current),
          })
        }
        onNext={() => setCodingIdx((i) => Math.min(i + 1, codingItems.length - 1))}
        onFinish={finishCoding}
        isLast={codingIdx >= codingItems.length - 1}
      />
    );
  }

  const section = sections[run.sectionIdx];
  if (!section) return null;
  const deadline = run.sectionDeadlines[run.sectionIdx];
  const remaining = Math.max(0, deadline - now);
  const lowTime = remaining < 60_000;

  return (
    <div className="space-y-4">
      <Prompt path={`~/mock/${blueprint.id}`}>
        <span>section {run.sectionIdx + 1}/{sections.length} --running</span>
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
            section {run.sectionIdx + 1} / {sections.length}
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
                      const checked = run.mcqAnswers[q.id] === oi;
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
                              onChange={() => run.setMcqAnswer(q.id, oi)}
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
        {run.sectionIdx < sections.length - 1 ? (
          <BracketButton
            variant="primary"
            onClick={() => run.setSectionIdx(run.sectionIdx + 1)}
          >
            submit & next section →
          </BracketButton>
        ) : (
          <BracketButton variant="primary" onClick={finishMcqPhase}>
            {codingItems.length > 0 ? "submit & start coding →" : "submit final"}
          </BracketButton>
        )}
      </div>
    </div>
  );
}

function CodingRound({
  blueprint,
  items,
  idx,
  remaining,
  onAnswered,
  onNext,
  onFinish,
  isLast,
}: {
  blueprint: MockTestBlueprint;
  items: CodingItem[];
  idx: number;
  remaining: number;
  onAnswered: (correct: boolean, gaveUp?: boolean) => void;
  onNext: () => void;
  onFinish: () => void;
  isLast: boolean;
}) {
  const item = items[idx];
  const lowTime = remaining < 120_000;
  if (!item) {
    return (
      <div className="space-y-4">
        <div className="text-sm italic font-mono" style={{ color: "var(--color-text-dim)" }}>
          // no coding problems available — finishing.
        </div>
        <BracketButton variant="primary" onClick={onFinish}>
          finish →
        </BracketButton>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Prompt path={`~/mock/${blueprint.id}`}>
        <span>coding-round problem {idx + 1}/{items.length} --running</span>
      </Prompt>

      <div
        className="flex items-center justify-between px-3 py-2 font-mono"
        style={{
          background: "var(--color-bg-alt)",
          border: `1px solid ${lowTime ? "var(--color-danger)" : "var(--color-border-bright)"}`,
        }}
      >
        <div>
          <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            coding round
          </div>
          <div className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            problem {idx + 1} of {items.length}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            time left
          </div>
          <div
            className={"text-2xl font-bold tabular-nums" + (lowTime ? " crt-glow" : "")}
            style={{ color: lowTime ? "var(--color-danger)" : "var(--color-accent)" }}
          >
            {formatTime(remaining)}
          </div>
        </div>
      </div>

      <CodingSandbox key={item.id} item={item} onAnswered={onAnswered} />

      <div className="flex justify-end gap-2">
        {isLast ? (
          <BracketButton variant="primary" onClick={onFinish}>
            submit final
          </BracketButton>
        ) : (
          <BracketButton variant="primary" onClick={onNext}>
            next problem →
          </BracketButton>
        )}
      </div>
    </div>
  );
}

function Intro({
  blueprint,
  onStart,
  canResume,
  onResume,
  extendedTime,
  onToggleExtendedTime,
}: {
  blueprint: MockTestBlueprint;
  onStart: () => void;
  canResume: boolean;
  onResume: () => void;
  extendedTime: boolean;
  onToggleExtendedTime: () => void;
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
            const last =
              i === blueprint.sections.length - 1 && !blueprint.codingSection;
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
          {blueprint.codingSection && (
            <li className="flex justify-between gap-4">
              <span style={{ color: "var(--color-text)" }}>
                <span style={{ color: "var(--color-text-muted)" }}>└─ </span>
                <span style={{ color: "var(--color-amber)" }}>
                  sec {blueprint.sections.length + 1}.
                </span>{" "}
                Coding Round
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {blueprint.codingSection.problemCount}p ·{" "}
                {blueprint.codingSection.durationMinutes}m
              </span>
            </li>
          )}
        </ol>
        {blueprint.codingSection && (
          <div
            className="mt-3 text-xs font-mono"
            style={{ color: "var(--color-text-dim)" }}
          >
            // the coding round runs live in-exam with the CodeMirror editor and
            real test grading.
          </div>
        )}
      </Box>

      <Box title="$ warning" variant="amber">
        <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
          ⏱ timers auto-advance sections. your run is saved — a refresh resumes
          it. submit early with "next section" if you finish before time.
        </div>
      </Box>

      <label
        className="flex items-center gap-2 text-sm font-mono cursor-pointer"
        style={{ color: "var(--color-text-dim)" }}
      >
        <input
          type="checkbox"
          checked={extendedTime}
          onChange={onToggleExtendedTime}
          className="accent-[var(--color-accent)]"
        />
        <span>
          extended time (1.5×) — accessibility accommodation
        </span>
      </label>

      <div className="flex gap-2">
        <BracketButton variant="danger" onClick={onStart}>
          {canResume ? "restart simulation →" : "start simulation →"}
        </BracketButton>
        {canResume && (
          <BracketButton variant="primary" onClick={onResume}>
            ↻ resume saved run
          </BracketButton>
        )}
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
