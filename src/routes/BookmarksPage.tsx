import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useBookmarksStore } from "../store";
import { getQuizItem } from "../lib/contentLoader";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";

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
    <div className="space-y-4">
      <Prompt path="~/bookmarks">
        <span>cat saved.list</span>
      </Prompt>
      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-amber)" }}
      >
        ★ bookmarks{" "}
        <span
          style={{ color: "var(--color-text-muted)" }}
          className="text-sm font-normal"
        >
          // {ids.length} saved
        </span>
      </div>

      {ids.length === 0 ? (
        <Box title="$ ls" variant="amber">
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            no bookmarks yet. tap ☆ on any quiz item to save it for targeted review.
          </div>
        </Box>
      ) : (
        <ul className="space-y-2">
          {ids.map((id) => {
            const item = getQuizItem(id);
            if (!item) {
              return (
                <li
                  key={id}
                  className="px-3 py-2 font-mono text-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <code>{id}</code>{" "}
                  <span style={{ color: "var(--color-danger)" }}>// missing</span>
                </li>
              );
            }
            return (
              <li key={id}>
                <Link
                  to={`/quiz/${item.track}/${item.topic}`}
                  className="block px-3 py-2 font-mono text-sm transition-colors hover:brightness-110"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span style={{ color: "var(--color-amber)" }}>★</span>{" "}
                    {item.track}/{item.topic} · {item.difficulty}
                  </div>
                  <div
                    className="mt-1 line-clamp-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    {item.type === "mcq" ? item.question : item.prompt}
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
