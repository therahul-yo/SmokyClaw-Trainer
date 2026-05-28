import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { getTracks, getAllQuizItems } from "../lib/contentLoader";
import { useProgressStore, useReviewQueueStore } from "../store";
import { dueRecords } from "../lib/leitner";

type TreeRowProps = {
  prefix: string;
  to: string;
  label: string;
  trailing?: string;
  color?: string;
};

function TreeRow({ prefix, to, label, trailing, color }: TreeRowProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        "flex items-center gap-1 px-2 py-0.5 text-sm leading-tight font-mono whitespace-nowrap " +
        (isActive ? "" : "")
      }
      style={({ isActive }) => ({
        background: isActive ? "var(--color-bg-sel)" : "transparent",
        color: isActive ? "var(--color-accent)" : color || "var(--color-text)",
        borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
      })}
    >
      <span style={{ color: "var(--color-text-muted)" }}>{prefix}</span>
      <span>{label}</span>
      {trailing && (
        <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
          {trailing}
        </span>
      )}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="px-2 mt-3 mb-1 text-[10px] tracking-widest uppercase"
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </div>
  );
}

export function TreeNav() {
  const tracks = getTracks();
  const allItems = getAllQuizItems();
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const dueCount = useMemo(
    () => dueRecords(Object.values(reviewRecords)).length,
    [reviewRecords],
  );

  // Re-derive mastery whenever attempts change.
  const attempts = useProgressStore((s) => s.attempts);
  const trackMastery = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of tracks) {
      const ids = allItems.filter((q) => q.track === t.id).map((q) => q.id);
      out[t.id] = useProgressStore.getState().trackMasteryPct(t.id, ids);
    }
    return out;
    // attempts is read indirectly via getState() — listed to trigger recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, allItems, attempts]);

  return (
    <aside
      className="shrink-0 hidden md:flex flex-col overflow-y-auto"
      style={{
        width: 260,
        background: "var(--color-bg-alt)",
        borderRight: "1px solid var(--color-border-bright)",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div className="px-3 py-3" style={{ borderBottom: "1px dashed var(--color-border)" }}>
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          $ tree ~/smokyclaw -L 2
        </div>
      </div>

      <div className="px-1 py-2 flex-1 min-h-0">
        <TreeRow prefix="~ " to="/" label="home" />

        <SectionLabel>tracks/</SectionLabel>
        {tracks.map((t, i) => {
          const last = i === tracks.length - 1;
          const pct = trackMastery[t.id] ?? 0;
          return (
            <TreeRow
              key={t.id}
              prefix={last ? "└─ " : "├─ "}
              to={`/track/${t.id}`}
              label={t.id}
              trailing={`${pct}%`}
            />
          );
        })}

        <SectionLabel>study/</SectionLabel>
        <TreeRow prefix="├─ " to="/plan" label="plan" />
        <TreeRow
          prefix="├─ "
          to="/review"
          label="review"
          trailing={dueCount > 0 ? `${dueCount} due` : undefined}
          color={dueCount > 0 ? "var(--color-amber)" : undefined}
        />
        <TreeRow prefix="└─ " to="/bookmarks" label="bookmarks" />

        <SectionLabel>sandbox/</SectionLabel>
        <TreeRow prefix="├─ " to="/sandbox/python" label="python" />
        <TreeRow prefix="└─ " to="/sandbox/sql" label="sql" />

        <SectionLabel>mock/</SectionLabel>
        <TreeRow prefix="├─ " to="/mock/tcs-nqt" label="tcs-nqt" />
        <TreeRow prefix="└─ " to="/mock/infosys-sp" label="infosys-sp" />

        <SectionLabel>meta/</SectionLabel>
        <TreeRow prefix="└─ " to="/progress" label="progress" />
      </div>

      <div
        className="px-3 py-2 text-[10px]"
        style={{ borderTop: "1px dashed var(--color-border)", color: "var(--color-text-muted)" }}
      >
        :hjkl to navigate · :q to wake up
      </div>
    </aside>
  );
}
