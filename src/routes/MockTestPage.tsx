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

type Phase = "intro" | "section" | "done";

type PickedSection = {
  meta: MockSection;
  items: McqItem[];
};

function pickItemsForSection(section: MockSection, pool: QuizItem[]): McqItem[] {
  const criteria = Array.isArray(section.pickFrom) ? section.pickFrom : [section.pickFrom];
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
  // Shuffle, then take questionCount (or all if pool smaller).
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

  // Timer tick
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

  // Auto-advance when section deadline hit
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
    // Record all answers as attempts (scored items only).
    for (const sec of sections) {
      for (const item of sec.items) {
        const ans = answers[item.id];
        const correct = ans === item.answerIndex;
        recordAttempt({ itemId: item.id, correct, timeMs: 0 });
      }
    }
    setPhase("done");
  };

  if (phase === "intro") {
    return <Intro blueprint={blueprint} onStart={start} />;
  }

  if (phase === "done") {
    return <Report blueprint={blueprint} sections={sections} answers={answers} />;
  }

  const section = sections[sectionIdx];
  if (!section) return null;
  const deadline = deadlines[sectionIdx];
  const remaining = Math.max(0, deadline - now);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Section {sectionIdx + 1} / {sections.length}
          </div>
          <div className="text-xl font-bold text-white">{section.meta.title}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--color-text-muted)]">time left</div>
          <div className="text-2xl font-mono text-white">{formatTime(remaining)}</div>
        </div>
      </div>

      {section.items.length === 0 ? (
        <div className="text-[var(--color-text-dim)]">
          No questions available for this section yet. Skip ahead.
        </div>
      ) : (
        <ol className="space-y-4">
          {section.items.map((q, qi) => (
            <li
              key={q.id}
              className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-[var(--color-text-muted)]">
                  Q{qi + 1}.
                </span>
                <div className="flex-1">
                  <div className="text-[var(--color-text)] whitespace-pre-wrap">
                    {q.question}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <li key={oi}>
                        <label className="flex gap-2 items-start cursor-pointer p-2 rounded hover:bg-[var(--color-bg-card-hover)]">
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === oi}
                            onChange={() =>
                              setAnswers((a) => ({ ...a, [q.id]: oi }))
                            }
                            className="mt-1.5"
                          />
                          <span>
                            <span className="font-mono text-[var(--color-text-muted)] mr-2">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex justify-end gap-2">
        {sectionIdx < sections.length - 1 ? (
          <button
            onClick={() => setSectionIdx(sectionIdx + 1)}
            className="px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white"
          >
            Submit & next section →
          </button>
        ) : (
          <button
            onClick={finalize}
            className="px-4 py-2 rounded-md bg-[var(--color-success)]/80 hover:bg-[var(--color-success)] text-white"
          >
            Submit final
          </button>
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
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{blueprint.title}</h1>
        <p className="text-[var(--color-text-dim)] mt-1">{blueprint.subtitle}</p>
      </header>

      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="text-sm font-semibold text-white mb-3">Format</div>
        <ol className="space-y-2 text-sm">
          {blueprint.sections.map((s, i) => (
            <li key={s.id} className="flex justify-between gap-4">
              <span>
                <span className="text-[var(--color-text-muted)] mr-2">
                  Section {i + 1}.
                </span>
                {s.title}
              </span>
              <span className="text-[var(--color-text-muted)]">
                {s.questionCount} q · {s.durationMinutes} min
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-sm flex justify-between">
          <span className="font-semibold">Total cognitive time</span>
          <span>{totalMin} min</span>
        </div>
        {blueprint.codingSection && (
          <div className="mt-2 text-xs text-[var(--color-text-dim)]">
            + coding round: {blueprint.codingSection.problemCount} problem(s) ·{" "}
            {blueprint.codingSection.durationMinutes} min (not auto-graded; use
            the Python sandbox)
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg border border-[var(--color-warning)]/40 bg-yellow-900/10 text-sm">
        ⏱ Timers auto-advance sections. Refresh resets the run. Submit early
        with "next section" if you finish before time.
      </div>

      <button
        onClick={onStart}
        className="px-6 py-3 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium"
      >
        Start mock test →
      </button>
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
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          {blueprint.title} · score report
        </h1>
        <p className="text-[var(--color-text-dim)] mt-1">
          You scored {totalCorrect} / {totalQs} = <b>{pct}%</b>
        </p>
      </header>

      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-2">
        {sectionResults.map((r) => (
          <div key={r.title} className="flex justify-between text-sm">
            <span>{r.title}</span>
            <span className="text-[var(--color-text-dim)]">
              {r.correct} / {r.total}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-[var(--color-text-dim)]">
        Cutoffs vary by year and role. As a rough TCS NQT prime-target band, aim
        for {Math.ceil(totalQs * 0.65)}+ correct (~65%). Wrong-answered items
        have been added to your review queue.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] text-white"
      >
        ↻ Take again
      </button>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
