import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllQuizItems } from "../lib/contentLoader";
import { nowMs } from "../lib/daily";
import { buildMachinePlan } from "../lib/trainingMachine";
import { useProgressStore, useReviewQueueStore } from "../store";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";
import { Prompt } from "../components/terminal/Prompt";

export function MachinePage() {
  const [now] = useState(() => nowMs());
  const items = getAllQuizItems();
  const attempts = useProgressStore((s) => s.attempts);
  const reviewRecords = useReviewQueueStore((s) => s.records);

  const plan = useMemo(
    () =>
      buildMachinePlan({
        items,
        attempts,
        reviewRecords: Object.values(reviewRecords),
        now,
      }),
    [items, attempts, reviewRecords, now],
  );

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const nextGate = plan.nextGate;

  return (
    <div className="space-y-4">
      <Prompt path="~/machine">
        <span>train --mode=machine --loop=daily --repair=weakest</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        machine loop
        <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
          // zero → interview execution
        </span>
      </div>

      <Box
        title="$ gate --next"
        trailing={nextGate ? `${nextGate.masteryPct}/${nextGate.targetPct}%` : "all gates passed"}
        variant={nextGate ? "amber" : "default"}
      >
        {nextGate ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 font-mono text-sm">
              <span style={{ color: "var(--color-amber)" }}>{nextGate.label}</span>
              <AsciiProgress value={nextGate.masteryPct} width={30} showPercent />
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              {nextGate.description}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              mastered {nextGate.mastered}/{nextGate.total} · attempted{" "}
              {nextGate.attempted}/{nextGate.total}
            </div>
          </div>
        ) : (
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            All stage gates are passing. Keep mock pressure and speed blocks active.
          </div>
        )}
      </Box>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {plan.readiness.map((score) => (
          <ReadinessTile key={score.id} score={score} />
        ))}
      </div>

      <Box title="$ stages" trailing="gated">
        <div className="space-y-3">
          {plan.stages.map((stage) => (
            <div
              key={stage.id}
              className="grid md:grid-cols-[170px_1fr_86px] gap-3 items-center font-mono text-sm"
              style={{ opacity: stage.unlocked ? 1 : 0.55 }}
            >
              <div>
                <span
                  style={{
                    color:
                      stage.gate === "passed"
                        ? "var(--color-accent)"
                        : stage.gate === "train"
                          ? "var(--color-amber)"
                          : "var(--color-text-muted)",
                  }}
                >
                  {stage.gate === "passed" ? "PASS" : stage.gate === "train" ? "TRAIN" : "LOCK"}
                </span>{" "}
                {stage.label}
              </div>
              <AsciiProgress value={stage.masteryPct} width={36} showPercent />
              <div className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                {stage.mastered}/{stage.total}
              </div>
            </div>
          ))}
        </div>
      </Box>

      <Box title="$ today --machine-loop" trailing="5 blocks">
        <div className="grid lg:grid-cols-5 gap-3">
          {plan.blocks.map((block) => (
            <div
              key={block.id}
              className="p-3 min-h-[190px] flex flex-col"
              style={{
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-mono text-sm" style={{ color: "var(--color-accent)" }}>
                  {block.title}
                </div>
                <div className="text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                  {block.estMinutes}m
                </div>
              </div>
              <div className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                {block.objective}
              </div>
              <div className="mt-3 space-y-1 flex-1">
                {block.itemIds.slice(0, 4).map((id) => {
                  const item = itemById.get(id);
                  if (!item) return null;
                  return (
                    <Link
                      key={id}
                      to={`/quiz/${item.track}/${item.topic}`}
                      className="block truncate text-xs underline"
                      style={{ color: "var(--color-cyan)" }}
                      title={id}
                    >
                      {item.track}/{item.topic}
                    </Link>
                  );
                })}
                {block.itemIds.length === 0 && (
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    no items queued
                  </div>
                )}
              </div>
              {block.itemIds[0] && itemById.get(block.itemIds[0]) && (
                <Link
                  to={`/quiz/${itemById.get(block.itemIds[0])!.track}/${itemById.get(block.itemIds[0])!.topic}`}
                  className="mt-3"
                >
                  <BracketButton>start</BracketButton>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Box>

      <Box title="$ weak --repair">
        {plan.weakestTopics.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            No repeated weak topic yet. Attempt more problems and the repair list will sharpen.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {plan.weakestTopics.map((row) => (
              <Link
                key={`${row.track}:${row.topic}`}
                to={`/quiz/${row.track}/${row.topic}`}
                className="flex items-center justify-between gap-3 px-3 py-2 font-mono text-sm"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span style={{ color: "var(--color-cyan)" }}>
                  {row.track}/{row.topic}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--color-amber)" }}>
                  {row.wrong}/{row.total} wrong
                </span>
              </Link>
            ))}
          </div>
        )}
      </Box>
    </div>
  );
}

function ReadinessTile({
  score,
}: {
  score: ReturnType<typeof buildMachinePlan>["readiness"][number];
}) {
  const color =
    score.status === "ready"
      ? "var(--color-accent)"
      : score.status === "training"
        ? "var(--color-amber)"
        : "var(--color-text-muted)";

  return (
    <div
      className="px-3 py-3 font-mono"
      style={{
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border-bright)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {score.label}
        </div>
        <div className="text-[10px]" style={{ color }}>
          {score.status}
        </div>
      </div>
      <div className="mt-2">
        <AsciiProgress value={score.pct} width={22} showPercent />
      </div>
      <div className="mt-2 text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>
        mastered {score.mastered}/{score.total} · target {score.targetPct}%
      </div>
    </div>
  );
}
