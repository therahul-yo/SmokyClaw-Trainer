import { useEffect, useState, useMemo, useRef } from "react";
import { useProgressStore, useStreakStore } from "../store";
import { getAllQuizItems } from "../lib/contentLoader";
import { shuffle } from "../lib/rng";
import type { QuizItem, TrackId } from "../types";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { Prompt } from "../components/terminal/Prompt";

type ChallengeMode = "blitz" | "sprint";

export function SpeedChallengePage() {
  const allItems = useMemo(() => getAllQuizItems(), []);
  const speedChallengeHighScores = useProgressStore((s) => s.speedChallengeHighScores || {});
  const recordSpeedChallengeScore = useProgressStore((s) => s.recordSpeedChallengeScore);
  const ping = useStreakStore((s) => s.ping);

  // Active Session State
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("dsa");
  const [selectedMode, setSelectedMode] = useState<ChallengeMode>("blitz");

  const [sessionItems, setSessionItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // overall timer in seconds
  const [totalDuration, setTotalDuration] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [itemAnswered, setItemAnswered] = useState(false);

  // Final result snapshot, computed once at completion (not in a render-phase
  // memo) so recording the high score can't feed back and clear the PB banner.
  type RunResult = { score: number; timeBonus: number; isNewHigh: boolean; previousHigh: number };
  const [results, setResults] = useState<RunResult | null>(null);
  const finishedRef = useRef(false);

  // Challenge Setup Pools
  const tracks: { id: TrackId; label: string; emoji: string }[] = [
    { id: "dsa", label: "Data Structures & Algos", emoji: "🌲" },
    { id: "python", label: "Python Programming", emoji: "🐍" },
    { id: "sql", label: "SQL & Databases", emoji: "🛢️" },
    { id: "aptitude", label: "Quantitative Aptitude", emoji: "🧮" },
  ];

  // Finalize the run exactly once: tally is already in `correctCount` (counted
  // at answer time), so a timeout never loses the last answer. previousHigh is
  // read straight from the store *before* we record, so the "new best" banner
  // is stable.
  const handleComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const total = sessionItems.length;
    const base = correctCount * 100;
    let timeBonus = 0;
    if (correctCount === total && timeLeft > 0) {
      timeBonus = Math.round(100 * (timeLeft / totalDuration));
    }
    const finalScore = base + timeBonus;
    const challengeId = `${selectedMode}:${selectedTrack}`;
    const previousHigh =
      useProgressStore.getState().speedChallengeHighScores?.[challengeId] ?? 0;
    const isNewHigh = finalScore > previousHigh;

    if (finalScore > 0) {
      recordSpeedChallengeScore(challengeId, finalScore);
    }

    setResults({ score: finalScore, timeBonus, isNewHigh, previousHigh });
    setIsActive(false);
    setIsCompleted(true);
    ping();
  };

  // Run countdown timers
  useEffect(() => {
    if (!isActive || isCompleted) return;

    if (timeLeft <= 0) {
      handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
    // handleComplete is intentionally omitted — it's recreated each render and
    // only fires on timeout; including it would reset the interval every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCompleted, timeLeft]);

  const handleStart = (track: TrackId, mode: ChallengeMode) => {
    setSelectedTrack(track);
    setSelectedMode(mode);

    // Filter items matching track and mode.
    // Blitz: Easy MCQs. Sprint: Medium Coding/SQL.
    let pool = allItems.filter((item) => item.track === track);
    if (mode === "blitz") {
      pool = pool.filter((item) => item.type === "mcq" && item.difficulty === "easy");
    } else {
      pool = pool.filter((item) => item.type !== "mcq" && item.difficulty === "medium");
    }

    if (pool.length === 0) {
      alert(`Not enough items in the pool for ${track} speed run! Try another track.`);
      return;
    }

    const itemAmt = mode === "blitz" ? 5 : 3;
    const duration = mode === "blitz" ? 180 : 1200; // 3 min or 20 min

    // Shuffle and slice
    const selected = shuffle(pool).slice(0, itemAmt);

    setSessionItems(selected);
    setCurrentIndex(0);
    setTimeLeft(duration);
    setTotalDuration(duration);
    setCorrectCount(0);
    setItemAnswered(false);
    setResults(null);
    finishedRef.current = false;
    setIsActive(true);
    setIsCompleted(false);
  };

  // Count correctness when the item is answered, not on advance — otherwise a
  // timeout (or not clicking "advance") would drop the last answer. Guarded so
  // re-runs of a coding/SQL item only count the first result.
  const handleAnswered = (correct: boolean) => {
    if (itemAnswered) return;
    setItemAnswered(true);
    if (correct) setCorrectCount((c) => c + 1);
  };

  const advance = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionItems.length) {
      setCurrentIndex(nextIndex);
      setItemAnswered(false);
    } else {
      handleComplete();
    }
  };

  const handleContinue = advance;
  const handleSkip = advance;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Read the snapshot captured at completion (see handleComplete).
  const finalResults: RunResult = results ?? {
    score: 0,
    timeBonus: 0,
    isNewHigh: false,
    previousHigh: 0,
  };

  const currentItem = sessionItems[currentIndex];

  // Visual countdown progress properties
  const timerPct = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const timerColor = timerPct > 50 ? "var(--color-success)" : timerPct > 20 ? "var(--color-amber)" : "var(--color-danger)";

  return (
    <div className="space-y-4 font-mono">
      <Prompt path="~/speedrun">
        <span>run --mode=speedrun --countdown</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        speed challenge sector
        <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
          // correctness × speed bonus = domination
        </span>
      </div>

      {isActive && currentItem ? (
        // Active Run Screen
        <div className="space-y-4">
          {/* Header Panel */}
          <div
            className="px-3 py-2 border border-[var(--color-border-bright)] flex justify-between items-center text-xs"
            style={{ background: "var(--color-bg-alt)" }}
          >
            <div>
              <span style={{ color: "var(--color-cyan)" }} className="uppercase font-bold">
                {selectedMode} SPEEDRUN
              </span>
              <span className="text-[var(--color-text-muted)] mx-2">·</span>
              <span style={{ color: "var(--color-text-dim)" }}>
                Item {currentIndex + 1} / {sessionItems.length}
              </span>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-3">
              <span style={{ color: "var(--color-text-muted)" }}>CHALLENGE TIME LEFT:</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: timerColor }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Visual countdown progress bar */}
          <div className="w-full h-1 bg-[var(--color-border)] relative">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
              }}
            />
          </div>

          {/* Render target sandbox */}
          <div className="relative">
            {currentItem.type === "mcq" && (
              <McqCard key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
            {currentItem.type === "coding" && (
              <CodingSandbox key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
            {currentItem.type === "sql" && (
              <SqlSandbox key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between p-3 border border-[var(--color-border-bright)] bg-[var(--color-bg-alt)]">
            <div>
              {!itemAnswered ? (
                <BracketButton variant="danger" onClick={handleSkip}>
                  Skip Item (0 pts)
                </BracketButton>
              ) : (
                <span style={{ color: "var(--color-success)" }} className="text-xs">
                  ✓ Question completed. Ready to advance.
                </span>
              )}
            </div>
            <div>
              {itemAnswered && (
                <BracketButton variant="primary" onClick={handleContinue} className="animate-pulse">
                  Advance Challenge →
                </BracketButton>
              )}
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        // Completion / Report Screen
        <div className="space-y-6 max-w-xl mx-auto py-6">
          <div
            className="text-3xl font-bold crt-glow text-center mb-4 uppercase"
            style={{ color: finalResults.isNewHigh ? "var(--color-success)" : "var(--color-accent)" }}
          >
            {finalResults.isNewHigh ? "🏆 NEW PERSONAL BEST 🏆" : "CHALLENGE COMPLETED"}
          </div>

          <Box title="$ run_results" variant={finalResults.isNewHigh ? "default" : "amber"}>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span style={{ color: "var(--color-text-muted)" }}>Accuracy Rate:</span>
                <span className="font-bold text-white">
                  {correctCount} / {sessionItems.length} correct
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span style={{ color: "var(--color-text-muted)" }}>Time Remaining:</span>
                <span className="font-bold text-white">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--color-border)]">
                <span style={{ color: "var(--color-text-muted)" }}>Time Bonus Points:</span>
                <span className="font-bold text-green-400">+{finalResults.timeBonus} pts</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--color-border-bright)]">
                <span style={{ color: "var(--color-accent)" }}>TOTAL SCORE:</span>
                <span style={{ color: "var(--color-accent)" }}>{finalResults.score} pts</span>
              </div>
              {finalResults.isNewHigh && (
                <div className="text-xs text-center pt-2 italic" style={{ color: "var(--color-success)" }}>
                  Congratulations! You beat your previous high score of {finalResults.previousHigh} pts.
                </div>
              )}
            </div>
          </Box>

          <div className="flex justify-center gap-4">
            <BracketButton variant="primary" onClick={() => handleStart(selectedTrack, selectedMode)}>
              Run Again
            </BracketButton>
            <BracketButton onClick={() => setIsCompleted(false)}>
              Back to Dashboard
            </BracketButton>
          </div>
        </div>
      ) : (
        // Dashboard / Setup Screen
        <div className="space-y-4">
          <Box title="$ select_speed_run_mode">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Blitz Option */}
              <div
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between"
                style={{ background: "var(--color-bg-card)" }}
              >
                <div>
                  <div className="text-base font-bold text-[var(--color-accent)] uppercase">
                    ⚡ Blitz Mode ⚡
                  </div>
                  <div className="text-xs mt-2 text-[var(--color-text-dim)] leading-relaxed">
                    Test your core syntactic and semantic concepts.
                    <br />
                    - **Goal**: Solve 5 easy MCQ items.
                    <br />
                    - **Timer**: 3 minutes.
                    <br />- **Speed Bonus**: Awarded for clean sweeps.
                  </div>
                </div>
                <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                  <div className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Select track to run:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tracks.map((t) => (
                      <BracketButton key={t.id} onClick={() => handleStart(t.id, "blitz")}>
                        {t.id}
                      </BracketButton>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sprint Option */}
              <div
                className="p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between"
                style={{ background: "var(--color-bg-card)" }}
              >
                <div>
                  <div className="text-base font-bold text-[var(--color-amber)] uppercase">
                    🏃‍♂️ Sprint Mode 🏃‍♂️
                  </div>
                  <div className="text-xs mt-2 text-[var(--color-text-dim)] leading-relaxed">
                    Test your coding and query development speed.
                    <br />
                    - **Goal**: Complete 3 medium Coding/SQL challenges.
                    <br />
                    - **Timer**: 20 minutes.
                    <br />- **Speed Bonus**: Highly competitive timing.
                  </div>
                </div>
                <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                  <div className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Select track to run:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tracks.map((t) => (
                      <BracketButton key={t.id} onClick={() => handleStart(t.id, "sprint")}>
                        {t.id}
                      </BracketButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Box>

          <Box title="$ speed_run_leaderboards">
            <div className="space-y-3">
              <div className="grid grid-cols-3 border-b border-[var(--color-border)] pb-2 font-mono text-xs text-[var(--color-text-muted)]">
                <div>CHALLENGE TARGET</div>
                <div>MODE</div>
                <div className="text-right">PERSONAL BEST SCORE</div>
              </div>

              <div className="space-y-1">
                {tracks.flatMap((track) =>
                  (["blitz", "sprint"] as ChallengeMode[]).map((mode) => {
                    const challengeId = `${mode}:${track.id}`;
                    const score = speedChallengeHighScores[challengeId] ?? null;

                    return (
                      <div
                        key={challengeId}
                        className="grid grid-cols-3 font-mono text-xs py-1"
                        style={{ borderBottom: "1px dashed var(--color-border)" }}
                      >
                        <div className="text-white">
                          {track.emoji} {track.label}
                        </div>
                        <div className="uppercase" style={{ color: mode === "blitz" ? "var(--color-accent)" : "var(--color-amber)" }}>
                          {mode}
                        </div>
                        <div className="text-right tabular-nums" style={{ color: score ? "var(--color-success)" : "var(--color-text-dim)" }}>
                          {score !== null ? `${score} pts` : "---"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Box>
        </div>
      )}
    </div>
  );
}
