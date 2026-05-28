import { useBookmarksStore } from "../store";

export function BookmarkButton({ itemId }: { itemId: string }) {
  const isBookmarked = useBookmarksStore((s) => Boolean(s.items[itemId]));
  const toggle = useBookmarksStore((s) => s.toggle);
  return (
    <button
      onClick={() => toggle(itemId)}
      className="text-xs px-2 py-0.5 font-mono transition-colors hover:brightness-110"
      style={{
        border: `1px solid ${isBookmarked ? "var(--color-amber)" : "var(--color-border-bright)"}`,
        color: isBookmarked ? "var(--color-amber)" : "var(--color-text-dim)",
        background: "transparent",
      }}
      title={isBookmarked ? "Remove bookmark" : "Bookmark for review"}
    >
      {isBookmarked ? "★ saved" : "☆ save"}
    </button>
  );
}
