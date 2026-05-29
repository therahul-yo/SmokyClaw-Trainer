import { useMemo, useState } from "react";
import { useProgressStore } from "../store";
import { getAllQuizItems } from "../lib/contentLoader";
import { RecognitionDrill } from "../components/RecognitionDrill";
import { PATTERN_LABELS } from "../lib/patternLabels";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { Prompt } from "../components/terminal/Prompt";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import type { QuizItem } from "../types";

export function RecognitionPage() {
  const recognitionAttempts = useProgressStore((s) => s.recognitionAttempts || []);
  const allItems = useMemo(() => getAllQuizItems(), []);

  // Filter DSA coding items that have a pattern defined.
  const dsaItems = useMemo(() => {
    return allItems.filter(
      (item) =>
        item.track === "dsa" &&
        item.type === "coding" &&
        item.pattern &&
        item.pattern.trim().length > 0
    );
  }, [allItems]);

  // Session State
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [sessionItems, setSessionItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<{ itemId: string; correct: boolean; timeMs: number }[]>([]);
  const [itemAnswered, setItemAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);

  // Stats computation
  const stats = useMemo(() => {
    const map = new Map<string, { correct: number; total: number; totalTimeMs: number }>();
    for (const attempt of recognitionAttempts) {
      const p = attempt.pattern.toLowerCase();
      const current = map.get(p) ?? { correct: 0, total: 0, totalTimeMs: 0 };
      current.total += 1;
      if (attempt.correct) current.correct += 1;
      current.totalTimeMs += attempt.timeMs;
      map.set(p, current);
    }
    return [...map.entries()].map(([patternId, row]) => ({
      patternId,
      label: PATTERN_LABELS[patternId] || patternId,
      pct: Math.round((row.correct / row.total) * 100),
      correct: row.correct,
      total: row.total,
      avgSpeedSec: Number((row.totalTimeMs / row.total / 1000).toFixed(1)),
    })).sort((a, b) => b.pct - a.pct || b.total - a.total);
  }, [recognitionAttempts]);

  const startSession = (mode: "easy" | "medium" | "hard") => {
    if (dsaItems.length === 0) {
      alert("No DSA coding pattern items found in the quiz data!");
      return;
    }
    setDifficulty(mode);
    // Shuffle and pick 10 random items
    const shuffled = [...dsaItems].sort(() => Math.random() - 0.5);
    setSessionItems(shuffled.slice(0, 10));
    setCurrentIndex(0);
    setSessionResults([]);
    setItemAnswered(false);
    setIsActive(true);
    setIsCompleted(false);
  };

  const handleAnswered = (correct: boolean) => {
    setLastCorrect(correct);
    setItemAnswered(true);
  };

  const handleContinue = () => {
    const currentItem = sessionItems[currentIndex];
    const itemAttempt = recognitionAttempts.find(
      (a) => a.itemId === currentItem.id && a.pattern === currentItem.pattern
    );

    const timeMs = itemAttempt ? itemAttempt.timeMs : 0;
    setSessionResults((r) => [
      ...r,
      {
        itemId: currentItem.id,
        correct: lastCorrect,
        timeMs,
      },
    ]);

    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionItems.length) {
      setCurrentIndex(nextIndex);
      setItemAnswered(false);
    } else {
      setIsActive(false);
      setIsCompleted(true);
    }
  };

  const currentItem = sessionItems[currentIndex];

  return (
    <div className="space-y-4">
      <Prompt path="~/recognition">
        <span>classify --mode=dsa-patterns --run</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        pattern classifier training
        <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
          // read problem ➔ detect algorithm ➔ write template
        </span>
      </div>

      {/* Main session wrapper */}
      {isActive && currentItem ? (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between px-3 py-2 text-xs border border-[var(--color-border)]"
            style={{ background: "var(--color-bg-alt)" }}
          >
            <div className="font-mono">
              <span style={{ color: "var(--color-text-muted)" }}>drill mode:</span>{" "}
              <span className="uppercase" style={{ color: "var(--color-amber)" }}>
                {difficulty}
              </span>{" "}
              · <span style={{ color: "var(--color-text-muted)" }}>item:</span>{" "}
              <span className="text-white">
                {currentIndex + 1} / {sessionItems.length}
              </span>
            </div>

            <div className="font-mono text-[var(--color-text-dim)]">
              Accuracy:{" "}
              {sessionResults.filter((r) => r.correct).length} / {sessionResults.length}
            </div>
          </div>

          <RecognitionDrill
            key={currentItem.id}
            item={currentItem}
            mode={difficulty}
            onAnswered={handleAnswered}
          />

          {itemAnswered && (
            <div className="flex justify-end pt-2">
              <BracketButton variant="primary" onClick={handleContinue}>
                Continue (Next →)
              </BracketButton>
            </div>
          )}
        </div>
      ) : isCompleted ? (
        // Completion Card
        <div className="space-y-6 max-w-xl mx-auto py-6 font-mono">
          <div
            className="text-3xl font-bold crt-glow text-center mb-6"
            style={{ color: "var(--color-accent)" }}
          >
            SECTOR CLASSIFIED
          </div>

          <Box title="$ classifier_metrics" variant="default">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span style={{ color: "var(--color-text-muted)" }}>Total Drills:</span>
                <span className="font-bold text-white">{sessionResults.length}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span style={{ color: "var(--color-text-muted)" }}>Accuracy Rate:</span>
                <span
                  className="font-bold"
                  style={{
                    color:
                      sessionResults.filter((r) => r.correct).length === sessionResults.length
                        ? "var(--color-success)"
                        : "var(--color-amber)",
                  }}
                >
                  {Math.round(
                    (sessionResults.filter((r) => r.correct).length / sessionResults.length) * 100
                  )}
                  % ({sessionResults.filter((r) => r.correct).length} / {sessionResults.length})
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Average Speed:</span>
                <span className="font-bold text-white">
                  {(
                    sessionResults.reduce((sum, r) => sum + r.timeMs, 0) /
                    sessionResults.length /
                    1000
                  ).toFixed(1)}
                  s
                </span>
              </div>
            </div>
          </Box>

          <div className="flex justify-center gap-4">
            <BracketButton variant="primary" onClick={() => startSession(difficulty)}>
              Restart Session
            </BracketButton>
            <BracketButton onClick={() => setIsCompleted(false)}>
              Back to Dashboard
            </BracketButton>
          </div>
        </div>
      ) : (
        // Recognition Dashboard
        <div className="space-y-4">
          <Box title="$ select_training_sector">
            <div className="grid md:grid-cols-3 gap-4">
              <div
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between"
                style={{ background: "var(--color-bg-card)" }}
              >
                <div>
                  <div className="font-mono text-sm font-bold text-white">EASY SECTOR</div>
                  <div className="text-xs mt-2 text-[var(--color-text-dim)] leading-relaxed">
                    Problem description is shown. Choose from 3 candidate patterns. Excellent for
                    building core reflexes.
                  </div>
                </div>
                <div className="mt-4">
                  <BracketButton variant="default" onClick={() => startSession("easy")}>
                    start easy
                  </BracketButton>
                </div>
              </div>

              <div
                className="p-4 border border-[var(--color-border-bright)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between"
                style={{ background: "var(--color-bg-card)" }}
              >
                <div>
                  <div className="font-mono text-sm font-bold text-[var(--color-amber)]">
                    MEDIUM SECTOR
                  </div>
                  <div className="text-xs mt-2 text-[var(--color-text-dim)] leading-relaxed">
                    Standard interview difficulty. Choose from 6 candidate patterns. Forces pattern
                    comparison.
                  </div>
                </div>
                <div className="mt-4">
                  <BracketButton variant="amber" onClick={() => startSession("medium")}>
                    start medium
                  </BracketButton>
                </div>
              </div>

              <div
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between"
                style={{ background: "var(--color-bg-card)" }}
              >
                <div>
                  <div className="font-mono text-sm font-bold text-[var(--color-danger)]">
                    HARD SECTOR
                  </div>
                  <div className="text-xs mt-2 text-[var(--color-text-dim)] leading-relaxed">
                    LeetCode competition conditions. Choose from all 18 matching DSA patterns.
                    Requires precise signal identification.
                  </div>
                </div>
                <div className="mt-4">
                  <BracketButton variant="danger" onClick={() => startSession("hard")}>
                    start hard
                  </BracketButton>
                </div>
              </div>
            </div>
          </Box>

          <Box title="$ pattern_classifier_mastery" trailing={`${stats.length} patterns tracked`}>
            {stats.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: "var(--color-text-dim)" }}>
                No recognition stats tracked yet. Run some classification drills to build your
                classifier database.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[170px_1fr_130px] items-center gap-4 font-mono text-xs border-b border-[var(--color-border)] pb-2 text-[var(--color-text-muted)]">
                  <div>PATTERN</div>
                  <div>RECOGNITION MASTERY</div>
                  <div className="text-right">ATTEMPTS / SPEED</div>
                </div>

                <div className="space-y-2">
                  {stats.map((row) => (
                    <div
                      key={row.patternId}
                      className="grid grid-cols-[170px_1fr_130px] items-center gap-4 font-mono text-xs"
                    >
                      <div className="text-white truncate" title={row.label}>
                        {row.label}
                      </div>
                      <div className="flex items-center">
                        <AsciiProgress value={row.pct} width={28} showPercent />
                      </div>
                      <div className="text-right text-[var(--color-text-muted)] tabular-nums">
                        {row.correct}/{row.total} · {row.avgSpeedSec}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Box>
        </div>
      )}
    </div>
  );
}
