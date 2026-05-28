import { Link } from "react-router-dom";
import { useReviewQueueStore } from "../store";
import { dueRecords } from "../lib/leitner";
import { getQuizItem } from "../lib/contentLoader";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";
import { useMemo, useState } from "react";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

export function ReviewPage() {
  const records = useReviewQueueStore((s) => s.records);
  const dueIds = useMemo(
    () => dueRecords(Object.values(records)).map((r) => r.itemId),
    [records],
  );
  const [idx, setIdx] = useState(0);

  if (dueIds.length === 0) {
    return (
      <div className="space-y-4 max-w-xl">
        <Prompt path="~/review">
          <span style={{ color: "var(--color-accent)" }}>queue: empty ✓</span>
        </Prompt>
        <Box title="$ inbox-zero">
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            nothing due. wrong answers resurface here on a 1d / 3d / 7d / 14d /
            30d cadence (leitner box).
          </div>
          <div className="mt-3">
            <Link to="/">
              <BracketButton variant="primary">← home</BracketButton>
            </Link>
          </div>
        </Box>
      </div>
    );
  }

  const itemId = dueIds[Math.min(idx, dueIds.length - 1)];
  const item = getQuizItem(itemId);

  if (!item) {
    return (
      <div className="space-y-3 font-mono text-sm">
        <Prompt path="~/review">
          <span style={{ color: "var(--color-danger)" }}>
            warn: item not found
          </span>
        </Prompt>
        <div style={{ color: "var(--color-text-dim)" }}>
          // <code>{itemId}</code> was renamed or removed
        </div>
        <BracketButton onClick={() => setIdx((i) => i + 1)}>
          skip →
        </BracketButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Prompt path="~/review">
        <span>
          next --item={Math.min(idx + 1, dueIds.length)}/{dueIds.length}
        </span>
      </Prompt>

      <div
        className="flex items-center justify-between px-3 py-2 text-xs font-mono"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-amber-dim)",
        }}
      >
        <div>
          <span style={{ color: "var(--color-amber)" }}>leitner.queue</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span style={{ color: "var(--color-text-dim)" }}>
            {dueIds.length} due · item {Math.min(idx + 1, dueIds.length)} /{" "}
            {dueIds.length}
          </span>
        </div>
        <BracketButton
          onClick={() => setIdx((i) => i + 1)}
          disabled={idx >= dueIds.length - 1}
        >
          next →
        </BracketButton>
      </div>

      {item.type === "mcq" && <McqCard key={item.id} item={item} />}
      {item.type === "coding" && <CodingSandbox key={item.id} item={item} />}
      {item.type === "sql" && <SqlSandbox key={item.id} item={item} />}
    </div>
  );
}
