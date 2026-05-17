import { useBookmarksStore } from "../store";

export function BookmarkButton({ itemId }: { itemId: string }) {
  const isBookmarked = useBookmarksStore((s) => Boolean(s.items[itemId]));
  const toggle = useBookmarksStore((s) => s.toggle);
  return (
    <button
      onClick={() => toggle(itemId)}
      className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-dim)]"
      title={isBookmarked ? "Remove bookmark" : "Bookmark for review"}
    >
      {isBookmarked ? "🔖 Saved" : "🔖 Save"}
    </button>
  );
}
