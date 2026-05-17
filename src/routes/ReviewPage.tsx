import { Link } from "react-router-dom";
import { useReviewQueueStore } from "../store";
import { dueRecords } from "../lib/leitner";
import { getQuizItem } from "../lib/contentLoader";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";
import { useMemo, useState } from "react";

export function ReviewPage() {
  const records = useReviewQueueStore((s) => s.records);
  const dueIds = useMemo(
    () => dueRecords(Object.values(records)).map((r) => r.itemId),
    [records],
  );
  const [idx, setIdx] = useState(0);

  if (dueIds.length === 0) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-white mb-2">🔁 Review queue</h1>
        <p className="text-[var(--color-text-dim)]">
          Nothing due right now. Wrong answers from quizzes resurface here on a
          1d / 3d / 7d / 14d / 30d schedule (Leitner box).
        </p>
        <Link to="/" className="inline-block mt-4 text-[var(--color-accent)]">
          ← back to dashboard
        </Link>
      </div>
    );
  }

  const itemId = dueIds[Math.min(idx, dueIds.length - 1)];
  const item = getQuizItem(itemId);

  if (!item) {
    return (
      <div className="text-[var(--color-text-dim)]">
        Queued item <code>{itemId}</code> not found — content may have been
        renamed. Skip to the next.
        <button
          onClick={() => setIdx((i) => i + 1)}
          className="ml-2 underline text-[var(--color-accent)]"
        >
          next
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🔁 Review queue</h1>
        <div className="text-sm text-[var(--color-text-dim)]">
          {dueIds.length} items due · item {Math.min(idx + 1, dueIds.length)} of{" "}
          {dueIds.length}
        </div>
      </div>

      {item.type === "mcq" && <McqCard key={item.id} item={item} />}
      {item.type === "coding" && <CodingSandbox key={item.id} item={item} />}
      {item.type === "sql" && <SqlSandbox key={item.id} item={item} />}

      <div className="flex justify-end">
        <button
          onClick={() => setIdx((i) => i + 1)}
          disabled={idx >= dueIds.length - 1}
          className="px-4 py-2 rounded-md border border-[var(--color-border)] disabled:opacity-40"
        >
          next item →
        </button>
      </div>
    </div>
  );
}
