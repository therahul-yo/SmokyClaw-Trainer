import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { getTracks } from "../lib/contentLoader";

const linkBase =
  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors";
const linkInactive =
  "text-[var(--color-text-dim)] hover:text-white hover:bg-[var(--color-bg-card)]";
const linkActive = "bg-[var(--color-bg-card)] text-white";

export function Sidebar() {
  const tracks = getTracks();
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--color-border)] p-4 hidden md:flex flex-col gap-1 bg-[var(--color-bg)]">
      <div className="px-2 mb-4">
        <div className="text-lg font-bold text-white">🦞 Trainer</div>
        <div className="text-xs text-[var(--color-text-muted)]">
          TCS NQT · Infosys · DSA
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          <span>🏠</span> Dashboard
        </NavLink>
        <NavLink
          to="/review"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          <span>🔁</span> Review
        </NavLink>
        <NavLink
          to="/bookmarks"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          <span>🔖</span> Bookmarks
        </NavLink>
        <NavLink
          to="/progress"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          <span>📊</span> Progress
        </NavLink>
      </nav>

      <div className="mt-4 mb-1 px-3 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        Tracks
      </div>
      <nav className="flex flex-col gap-0.5">
        {tracks.map((t) => (
          <NavLink
            key={t.id}
            to={`/track/${t.id}`}
            className={({ isActive }) =>
              clsx(linkBase, isActive ? linkActive : linkInactive)
            }
          >
            <span>{t.emoji}</span> {t.title}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 mb-1 px-3 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        Sandboxes
      </div>
      <nav className="flex flex-col gap-0.5">
        <NavLink
          to="/sandbox/python"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          🐍 Python REPL
        </NavLink>
        <NavLink
          to="/sandbox/sql"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          🗃️ SQL REPL
        </NavLink>
      </nav>

      <div className="mt-4 mb-1 px-3 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        Mock tests
      </div>
      <nav className="flex flex-col gap-0.5">
        <NavLink
          to="/mock/tcs-nqt"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          🎯 TCS NQT
        </NavLink>
        <NavLink
          to="/mock/infosys-sp"
          className={({ isActive }) =>
            clsx(linkBase, isActive ? linkActive : linkInactive)
          }
        >
          🎯 Infosys SP
        </NavLink>
      </nav>
    </aside>
  );
}
