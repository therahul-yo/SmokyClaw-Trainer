import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useProgressStore,
  useReviewQueueStore,
  useMachineSessionStore,
} from "../store";
import { getAllQuizItems } from "../lib/contentLoader";
import { defaultSpeedTargetSec } from "../lib/trainingMachine";
import { McqCard } from "./McqCard";
import { CodingSandbox } from "./CodingSandbox";
import { SqlSandbox } from "./SqlSandbox";
import { HumanCompilerPanel } from "./HumanCompilerPanel";
import { Box } from "./terminal/Box";
import { BracketButton } from "./terminal/BracketButton";
import { Prompt } from "./terminal/Prompt";
import { RecognitionDrill } from "./RecognitionDrill";
import type { MachineBlock } from "../lib/trainingMachine";

export function MachineSession() {
  const {
    isActive,
    isCompleted,
    currentBlockIndex,
    currentItemIndex,
    blocks,
    results,
    sessionStartedAt,
    itemStartedAt,
    recordItemResult,
    goToNext,
    endSession,
    resetAll,
  } = useMachineSessionStore();

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);

  const allItems = useMemo(() => getAllQuizItems(), []);
  const itemMap = useMemo(() => new Map(allItems.map((it) => [it.id, it])), [allItems]);

  // Local state for tracking block transition screens.
  const [showBlockSummary, setShowBlockSummary] = useState(false);

  // Pattern recognition sub-phase state (for the pattern block)
  const [patternRecognized, setPatternRecognized] = useState(false);
  const [recognitionDrillSubmitted, setRecognitionDrillSubmitted] = useState(false);

  // Time elapsed for the current item in seconds.
  const [elapsedItemSec, setElapsedItemSec] = useState(0);
  const [elapsedSessionSec, setElapsedSessionSec] = useState(0);

  const currentBlock: MachineBlock | undefined = blocks[currentBlockIndex];
  const currentItemId = currentBlock?.itemIds[currentItemIndex];
  const currentItem = currentItemId ? itemMap.get(currentItemId) : undefined;

  // Track if current item is already answered.
  const isAnswered = currentItemId ? Boolean(results[currentItemId]) : false;

  // Handle intervals for the item and session timers.
  useEffect(() => {
    if (!isActive || isCompleted || showBlockSummary) return;

    const timer = setInterval(() => {
      if (itemStartedAt) {
        setElapsedItemSec(Math.floor((Date.now() - itemStartedAt) / 1000));
      }
      if (sessionStartedAt) {
        setElapsedSessionSec(Math.floor((Date.now() - sessionStartedAt) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isCompleted, showBlockSummary, itemStartedAt, sessionStartedAt]);

  // Reset item timer and recognition sub-phase when current item changes.
  useEffect(() => {
    setElapsedItemSec(0);
    setPatternRecognized(false);
    setRecognitionDrillSubmitted(false);
  }, [currentItemId]);

  // If session is not active and not completed, render nothing or redirect (should be handled by page).
  if (!isActive && !isCompleted) {
    return (
      <div className="text-center font-mono py-12">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No active training session detected.
        </p>
        <Link to="/machine" className="mt-4 inline-block">
          <BracketButton variant="primary">Go to Machine Dashboard</BracketButton>
        </Link>
      </div>
    );
  }

  // Formatting helper for seconds to MM:SS.
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Skip the current question.
  const handleSkip = () => {
    if (!currentBlock || !currentItem) return;
    if (
      !confirm(
        "Skip this item? It will count as a failed attempt and be added to your spaced-repetition review queue."
      )
    )
      return;

    // Record as failed/skipped
    recordAttempt({
      itemId: currentItem.id,
      correct: false,
      timeMs: 0,
      gaveUp: false,
    });
    registerAttempt(currentItem.id, false);

    recordItemResult(currentItem.id, currentBlock.id, {
      correct: false,
      timeMs: 0,
      skipped: true,
      gaveUp: false,
    });

    setPatternRecognized(false);
    setRecognitionDrillSubmitted(false);
    handleContinue();
  };

  // Called when item is answered (e.g. McqCard chosen, Coding sandbox run passes, etc.)
  const handleAnswered = (correct: boolean) => {
    if (!currentBlock || !currentItem || isAnswered) return;

    const timeTakenMs = itemStartedAt ? Date.now() - itemStartedAt : 0;
    recordItemResult(currentItem.id, currentBlock.id, {
      correct,
      timeMs: timeTakenMs,
      skipped: false,
      gaveUp: !correct && currentItem.type !== "mcq", // gave up or failed coding/sql
    });
  };

  // Click handler to advance from the current item.
  const handleContinue = () => {
    if (!currentBlock) return;

    // If we're in the pattern block and haven't finished pattern recognition yet, transition to solve phase.
    if (currentBlock.id === "pattern" && !patternRecognized) {
      setPatternRecognized(true);
      setElapsedItemSec(0); // Reset timer for the coding sandbox phase
      return;
    }

    setPatternRecognized(false);
    setRecognitionDrillSubmitted(false);

    const isLastInBlock = currentItemIndex === currentBlock.itemIds.length - 1;
    if (isLastInBlock) {
      // Show block transition screen.
      setShowBlockSummary(true);
    } else {
      // Advance to next item in the same block.
      goToNext();
    }
  };

  const handleStartNextBlock = () => {
    setShowBlockSummary(false);
    goToNext();
  };

  // Calculate speed target status.
  const speedTarget = currentItem ? defaultSpeedTargetSec(currentItem) : 0;
  const speedPct = speedTarget > 0 ? (elapsedItemSec / speedTarget) * 100 : 0;
  let speedText = "EXCELLENT SPEED";
  let speedColor = "var(--color-success)";

  if (speedPct > 100) {
    speedText = "SPEED LIMIT EXCEEDED";
    speedColor = "var(--color-danger)";
  } else if (speedPct > 50) {
    speedText = "WARNING: RECALL SLOWING";
    speedColor = "var(--color-amber)";
  }

  // Render Session Completion Screen.
  if (isCompleted) {
    const attemptedCount = Object.keys(results).length;
    const correctCount = Object.values(results).filter((r) => r.correct).length;
    const correctPct = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const failedItems = Object.values(results).filter((r) => !r.correct);

    return (
      <div className="space-y-6 max-w-2xl mx-auto py-6 font-mono">
        <Prompt path="~/machine/session">
          <span>session --report --complete</span>
        </Prompt>

        <div
          className="text-3xl font-bold crt-glow text-center mb-6"
          style={{ color: "var(--color-accent)" }}
        >
          TRAINING COMPLETE
        </div>

        <Box title="$ session_metrics" variant="default">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-border)] pb-3">
              <div>
                <div style={{ color: "var(--color-text-muted)" }} className="text-xs">
                  TOTAL ATTEMPTED
                </div>
                <div className="text-xl font-bold text-white">{attemptedCount} items</div>
              </div>
              <div>
                <div style={{ color: "var(--color-text-muted)" }} className="text-xs">
                  ACCURACY RATE
                </div>
                <div className="text-xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {correctPct}% ({correctCount}/{attemptedCount})
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div style={{ color: "var(--color-text-muted)" }} className="text-xs">
                  SESSION DURATION
                </div>
                <div className="text-xl font-bold text-white">
                  {formatTime(elapsedSessionSec)}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--color-text-muted)" }} className="text-xs">
                  DAILY STREAK
                </div>
                <div className="text-xl font-bold" style={{ color: "var(--color-success)" }}>
                  UPDATED
                </div>
              </div>
            </div>
          </div>
        </Box>

        <Box title="$ repair_queue_additions" variant={failedItems.length > 0 ? "amber" : "default"}>
          {failedItems.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--color-success)" }}>
              Zero mistakes! Spaced repetition queue is fully operational.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                The following {failedItems.length} items have been registered to your Leitner review
                queue for systematic recall training:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {failedItems.map((f) => {
                  const it = itemMap.get(f.itemId);
                  return (
                    <div
                      key={f.itemId}
                      className="px-2 py-1.5 text-xs flex justify-between items-center"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ color: "var(--color-cyan)" }}>{f.itemId}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        {it?.track}/{it?.topic}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Box>

        <div className="flex justify-center pt-4">
          <Link to="/machine" onClick={() => resetAll()}>
            <BracketButton variant="primary">Return to Dashboard</BracketButton>
          </Link>
        </div>
      </div>
    );
  }

  // Render Block Completed Transition Screen.
  if (showBlockSummary && currentBlock) {
    const blockItemIds = currentBlock.itemIds;
    const blockResults = blockItemIds.map((id: string) => results[id]).filter(Boolean);
    const attempted = blockResults.length;
    const correct = blockResults.filter((r: { correct: boolean }) => r.correct).length;
    const successRate = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const blockTimeSec = blockResults.reduce((sum: number, r: { timeMs: number }) => sum + Math.round(r.timeMs / 1000), 0);

    const nextBlockIndex = currentBlockIndex + 1;
    const nextBlock: MachineBlock | undefined = blocks[nextBlockIndex];

    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 font-mono">
        <Prompt path={`~/machine/session/${currentBlock.id}`}>
          <span>sector --analyze</span>
        </Prompt>

        <div
          className="text-2xl font-bold crt-glow text-center border-y border-[var(--color-border-bright)] py-3 uppercase"
          style={{ color: "var(--color-accent)" }}
        >
          Sector Completed: {currentBlock.title}
        </div>

        <Box title="$ sector_report" variant="default">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Items Attempted:</span>
              <span className="font-bold text-white">{attempted}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Success Accuracy:</span>
              <span className="font-bold" style={{ color: correct === attempted ? "var(--color-success)" : "var(--color-amber)" }}>
                {successRate}% ({correct} / {attempted})
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Sector Solving Time:</span>
              <span className="font-bold text-white">{formatTime(blockTimeSec)}</span>
            </div>
          </div>
        </Box>

        {nextBlock ? (
          <Box title={`$ queue --next-sector`} variant="amber">
            <div className="space-y-2">
              <div className="text-sm font-bold" style={{ color: "var(--color-amber)" }}>
                {nextBlock.title}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                {nextBlock.objective}
              </p>
              <div className="text-xs pt-2" style={{ color: "var(--color-text-muted)" }}>
                Contains {nextBlock.itemIds.length} training components.
              </div>
            </div>
          </Box>
        ) : (
          <div className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            Final sector completed. Preparing final system report...
          </div>
        )}

        <div className="flex justify-center pt-4">
          {nextBlock ? (
            <BracketButton variant="primary" onClick={handleStartNextBlock}>
              Begin: {nextBlock.title}
            </BracketButton>
          ) : (
            <BracketButton variant="primary" onClick={handleStartNextBlock}>
              Finish Session & Generate Report
            </BracketButton>
          )}
        </div>
      </div>
    );
  }

  // Safe checks.
  if (!currentItem || !currentBlock) {
    return (
      <div className="text-center font-mono py-12 text-sm" style={{ color: "var(--color-danger)" }}>
        Error loading training item #{currentItemIndex + 1} inside {currentBlock?.title}.
        <div className="mt-4">
          <BracketButton onClick={() => endSession()}>Abort Session</BracketButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Progress Header */}
      <div
        className="px-3 py-2 font-mono text-xs border border-[var(--color-border-bright)]"
        style={{ background: "var(--color-bg-alt)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-accent)" }} className="font-bold uppercase tracking-wider">
              INTERVIEW DOMINATION MACHINE v1.0
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>·</span>
            <span className="text-[10px] tabular-nums" style={{ color: "var(--color-text-dim)" }}>
              ELAPSED: {formatTime(elapsedSessionSec)}
            </span>
          </div>

          {/* Block Pipeline Indicators */}
          <div className="flex items-center flex-wrap gap-1 text-[10px]">
            {blocks.map((blk, idx) => {
              const isActiveBlock = idx === currentBlockIndex;
              const isCompletedBlock = idx < currentBlockIndex;
              let color = "var(--color-text-muted)";
              let border = "transparent";

              if (isActiveBlock) {
                color = "var(--color-amber)";
                border = "1px solid var(--color-amber)";
              } else if (isCompletedBlock) {
                color = "var(--color-success)";
              }

              return (
                <div
                  key={blk.id}
                  className="px-2 py-0.5"
                  style={{
                    color,
                    border,
                    background: isActiveBlock ? "rgba(255, 140, 0, 0.05)" : "transparent",
                  }}
                >
                  {blk.title.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Item Subheader / Timer Panel */}
      <div
        className="px-3 py-1.5 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 border border-[var(--color-border)]"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--color-text-muted)" }}>sector:</span>
          <span style={{ color: "var(--color-cyan)" }}>{currentBlock.title}</span>
          <span style={{ color: "var(--color-text-muted)" }}>·</span>
          <span style={{ color: "var(--color-text-muted)" }}>item:</span>
          <span style={{ color: "var(--color-text)" }}>
            {currentItemIndex + 1} / {currentBlock.itemIds.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Speed limit indicator */}
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-muted)" }}>speed target:</span>
            <span className="tabular-nums" style={{ color: speedColor, fontWeight: "bold" }}>
              {formatTime(elapsedItemSec)} / {formatTime(speedTarget)}
            </span>
            <span
              style={{
                color: speedColor,
                fontSize: "10px",
                border: `1px solid ${speedColor}`,
                padding: "0 4px",
              }}
            >
              {speedText}
            </span>
          </div>
        </div>
      </div>

      {/* Structured thinking before coding/SQL */}
      {(currentItem.type === "coding" || currentItem.type === "sql") &&
        (currentBlock.id !== "pattern" || patternRecognized) && (
          <HumanCompilerPanel key={`trace:${currentItem.id}`} mode="item" item={currentItem} />
        )}

      {/* Interactive Item Container */}
      <div className="relative">
        {currentBlock.id === "pattern" && !patternRecognized ? (
          <RecognitionDrill
            key={`rec:${currentItem.id}`}
            item={currentItem}
            mode="medium"
            onAnswered={() => setRecognitionDrillSubmitted(true)}
          />
        ) : (
          <>
            {currentItem.type === "mcq" && (
              <McqCard key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
            {currentItem.type === "coding" && (
              <CodingSandbox key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
            {currentItem.type === "sql" && (
              <SqlSandbox key={currentItem.id} item={currentItem} onAnswered={handleAnswered} />
            )}
          </>
        )}
      </div>

      {/* Footer Navigation Bar */}
      {(() => {
        const activePhaseCompleted =
          currentBlock.id === "pattern" && !patternRecognized
            ? recognitionDrillSubmitted
            : isAnswered;

        return (
          <div className="flex items-center justify-between p-3 border border-[var(--color-border-bright)] bg-[var(--color-bg-alt)]">
            <div>
              {!activePhaseCompleted ? (
                <BracketButton variant="danger" onClick={handleSkip}>
                  Skip Item
                </BracketButton>
              ) : (
                <span style={{ color: "var(--color-success)" }} className="font-mono text-xs">
                  {currentBlock.id === "pattern" && !patternRecognized
                    ? "✓ Pattern classified. Proceed to write the solution."
                    : "✓ Item answered. Review explanation or continue."}
                </span>
              )}
            </div>
            <div>
              {activePhaseCompleted && (
                <BracketButton
                  variant="primary"
                  onClick={handleContinue}
                  className="animate-pulse"
                >
                  Continue (Next →)
                </BracketButton>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
