import { NavLink } from "react-router-dom";

// Bottom tab bar for phones — the TreeNav sidebar is hidden below `md`, so this
// gives mobile/PWA users a thumb-reachable way to move around. Hidden on `md+`.
const TABS: { to: string; label: string; glyph: string; end?: boolean }[] = [
  { to: "/", label: "home", glyph: "~", end: true },
  { to: "/track/dsa", label: "learn", glyph: "▤" },
  { to: "/review", label: "review", glyph: "↻" },
  { to: "/coach", label: "smokey", glyph: "◉" },
  { to: "/progress", label: "stats", glyph: "▦" },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden shrink-0 grid grid-cols-5"
      style={{
        background: "var(--color-bg-alt)",
        borderTop: "1px solid var(--color-border-bright)",
        fontFamily: "var(--font-mono)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className="flex flex-col items-center justify-center py-2 gap-0.5"
          style={({ isActive }) => ({
            color: isActive ? "var(--color-accent)" : "var(--color-text-dim)",
            borderTop: isActive
              ? "2px solid var(--color-accent)"
              : "2px solid transparent",
          })}
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>{t.glyph}</span>
          <span style={{ fontSize: 9 }}>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
