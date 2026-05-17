import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useBookmarksStore } from "../store";
import { getQuizItem } from "../lib/contentLoader";

export function BookmarksPage() {
  const items = useBookmarksStore((s) => s.items);
  const ids = useMemo(
    () =>
      Object.entries(items)
        .sort((a, b) => b[1].addedAt - a[1].addedAt)
        .map(([id]) => id),
    [items],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🔖 Bookmarks</h1>
      {ids.length === 0 ? (
        <p className="text-[var(--color-text-dim)]">
          No bookmarks yet. Tap the 🔖 button on any quiz item to save it for
          targeted review.
        </p>
      ) : (
        <ul className="space-y-2">
          {ids.map((id) => {
            const item = getQuizItem(id);
            if (!item) {
              return (
                <li
                  key={id}
                  className="p-3 rounded border border-[var(--color-border)] text-[var(--color-text-muted)]"
                >
                  <code>{id}</code> (item missing)
                </li>
              );
            }
            return (
              <li key={id}>
                <Link
                  to={`/quiz/${item.track}/${item.topic}`}
                  className="block p-4 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
                >
                  <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                    {item.track} · {item.topic} · {item.difficulty}
                  </div>
                  <div className="mt-1 text-[var(--color-text)] line-clamp-2">
                    {item.type === "mcq"
                      ? item.question
                      : item.type === "coding"
                        ? item.prompt
                        : item.prompt}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
