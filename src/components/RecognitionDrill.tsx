import { useState, useEffect, useMemo } from "react";
import type { QuizItem } from "../types";
import { useProgressStore, useStreakStore } from "../store";
import { getPatterns } from "../lib/contentLoader";
import { Box } from "./terminal/Box";
import { LessonRenderer } from "./LessonRenderer";

export const PATTERN_LABELS: Record<string, string> = {
  "arrays-basics": "Array Basics / Fundamentals",
  "two-pointer": "Two Pointers",
  "sliding-window": "Sliding Window",
  "prefix-sums": "Prefix Sums",
  "hashing": "Hashing (Map/Set)",
  "binary-search": "Binary Search",
  "recursion": "Recursion & Backtracking",
  "sorting": "Sorting Algorithms",
  "linked-list": "Linked Lists",
  "stack-queue": "Stacks & Queues",
  "trees": "Trees & Binary Search Trees",
  "heaps": "Heaps / Priority Queues",
  "graphs": "Graphs (BFS/DFS/Topology)",
  "greedy": "Greedy Algorithms",
  "dp-1d": "1D Dynamic Programming",
  "dp-2d": "2D Dynamic Programming",
  "bit-manipulation": "Bit Manipulation",
  "math": "Math & Number Theory",
};

type Props = {
  item: QuizItem;
  mode?: "easy" | "medium" | "hard";
  onAnswered?: (correct: boolean) => void;
};

export function RecognitionDrill({ item, mode = "medium", onAnswered }: Props) {
  const recordRecognitionAttempt = useProgressStore((s) => s.recordRecognitionAttempt);
  const ping = useStreakStore((s) => s.ping);

  const correctPattern = useMemo(() => {
    return item.pattern ? item.pattern.toLowerCase().replace(/_/g, "-") : "arrays-basics";
  }, [item]);

  // Determine standard pool of pattern IDs
  const allPatternIds = useMemo(() => {
    return Object.keys(PATTERN_LABELS);
  }, []);

  // Generate randomized choices
  const choices = useMemo(() => {
    if (item.recognitionPrompt && item.recognitionPrompt.choices?.length > 0) {
      return item.recognitionPrompt.choices.map((c) => ({
        id: c.label.toLowerCase().replace(/_/g, "-"),
        label: c.label,
        correct: c.correct,
      }));
    }

    const distractorCount = mode === "easy" ? 2 : mode === "medium" ? 5 : allPatternIds.length - 1;
    const others = allPatternIds.filter((p) => p !== correctPattern);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const selectedDistractors = shuffledOthers.slice(0, distractorCount);

    const merged = [correctPattern, ...selectedDistractors].map((pId) => ({
      id: pId,
      label: PATTERN_LABELS[pId] || pId,
      correct: pId === correctPattern,
    }));

    return merged.sort(() => Math.random() - 0.5);
  }, [item, correctPattern, allPatternIds, mode]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25); // 25 seconds limit
  const [startedAt] = useState(() => Date.now());

  // Handle countdown timer
  useEffect(() => {
    if (isSubmitted) return;

    if (timeLeft <= 0) {
      handleAnswer(null); // Time out counts as incorrect/unselected
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  const handleAnswer = (choiceId: string | null) => {
    if (isSubmitted) return;

    setSelectedId(choiceId);
    setIsSubmitted(true);

    const isCorrect = choiceId === correctPattern;
    const timeMs = Date.now() - startedAt;

    recordRecognitionAttempt({
      itemId: item.id,
      pattern: correctPattern,
      correct: isCorrect,
      timeMs,
    });
    ping();

    onAnswered?.(isCorrect);
  };

  const isCorrect = selectedId === correctPattern;
  const timerColor = timeLeft > 10 ? "var(--color-success)" : timeLeft > 5 ? "var(--color-amber)" : "var(--color-danger)";

  // Find pattern blurb
  const patternMeta = useMemo(() => {
    const patterns = getPatterns();
    return patterns.find((p) => p.id === correctPattern);
  }, [correctPattern]);

  return (
    <Box
      title={
        <span>
          <span style={{ color: "var(--color-amber)" }}>recognition-drill</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.id}</span>
        </span>
      }
      trailing={
        <div className="font-mono text-xs flex items-center gap-2">
          <span>TIME LIMIT:</span>
          <span style={{ color: timerColor, fontWeight: "bold" }}>
            {timeLeft}s
          </span>
        </div>
      }
      variant={isSubmitted ? (isCorrect ? "default" : "danger") : "amber"}
    >
      <div className="space-y-4">
        {/* Progress Bar Timer */}
        {!isSubmitted && (
          <div className="w-full h-1 bg-[var(--color-border)] relative">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / 25) * 100}%`,
                background: timerColor,
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs tracking-widest font-mono text-[var(--color-text-muted)] uppercase">
            problem prompt
          </div>
          <div className="text-sm border border-[var(--color-border)] p-3 bg-[var(--color-bg)] leading-relaxed text-white">
            <LessonRenderer body={item.type === "mcq" ? item.question : item.prompt} />
          </div>
        </div>

        {item.constraints && (
          <div className="text-xs font-mono" style={{ color: "var(--color-text-dim)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>CONSTRAINTS: </span>
            {item.constraints}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs tracking-widest font-mono text-[var(--color-text-muted)] uppercase">
            {isSubmitted ? "classification results" : "classify the matching dsa pattern"}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {choices.map((c) => {
              const isSelected = c.id === selectedId;
              const isCorrectChoice = c.id === correctPattern;
              let border = "1px solid var(--color-border-bright)";
              let bg = "transparent";
              let color = "var(--color-text)";

              if (isSubmitted) {
                if (isCorrectChoice) {
                  border = "2px solid var(--color-success)";
                  bg = "rgba(255, 140, 0, 0.08)"; // accent success highlight
                  color = "var(--color-success)";
                } else if (isSelected) {
                  border = "2px solid var(--color-danger)";
                  bg = "rgba(255, 68, 68, 0.08)";
                  color = "var(--color-danger)";
                } else {
                  border = "1px solid var(--color-border)";
                  color = "var(--color-text-muted)";
                }
              }

              return (
                <button
                  key={c.id}
                  onClick={() => handleAnswer(c.id)}
                  disabled={isSubmitted}
                  className="px-3 py-2 text-left font-mono text-xs transition-all duration-150 disabled:cursor-not-allowed hover:brightness-110"
                  style={{ border, background: bg, color }}
                >
                  {isSubmitted && isCorrectChoice && <span className="mr-1">✓</span>}
                  {isSubmitted && isSelected && !isCorrectChoice && <span className="mr-1">✗</span>}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {isSubmitted && (
          <div
            className="p-3 text-xs font-mono space-y-2"
            style={{
              borderLeft: `3px solid ${isCorrect ? "var(--color-success)" : "var(--color-danger)"}`,
              background: "var(--color-bg-card)",
            }}
          >
            <div
              className="font-bold uppercase text-sm"
              style={{ color: isCorrect ? "var(--color-success)" : "var(--color-danger)" }}
            >
              {isCorrect ? "PASS // pattern classification verified" : "FAIL // classification mismatch"}
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-[var(--color-text-muted)]">CORRECT PATTERN: </span>
                <span className="text-white font-bold">{PATTERN_LABELS[correctPattern] || correctPattern}</span>
              </div>

              {patternMeta && (
                <div>
                  <span className="text-[var(--color-text-muted)]">PATTERN BLURB: </span>
                  <span style={{ color: "var(--color-text-dim)" }}>{patternMeta.blurb}</span>
                </div>
              )}

              {item.hints && item.hints.length > 0 && (
                <div className="pt-2">
                  <span className="text-[var(--color-text-muted)]">RECOGNITION TRIGGERS: </span>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[var(--color-text-dim)]">
                    {item.hints.map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Box>
  );
}
