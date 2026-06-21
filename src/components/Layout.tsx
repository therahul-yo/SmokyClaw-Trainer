import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TreeNav } from "./TreeNav";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { KeysHelp } from "./KeysHelp";
import { BootOverlay } from "./BootOverlay";
import { InstallButton } from "./InstallButton";
import { MobileNav } from "./MobileNav";

// Isolated clock component: ticking the wall clock here re-renders only this
// small leaf rather than the entire Layout tree (TreeNav, MobileNav, etc.).
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums">{now.toTimeString().slice(0, 8)}</span>
  );
}

function pathBreadcrumb(pathname: string): string {
  if (pathname === "/") return "~";
  return "~" + pathname.replace(/\/+$/g, "");
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (t.isContentEditable) return true;
  // CodeMirror editor area
  if (t.closest(".cm-editor")) return true;
  return false;
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const crumb = pathBreadcrumb(location.pathname);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"command" | "search">("command");
  const [keysOpen, setKeysOpen] = useState(false);
  const gPrefix = useRef<number>(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ⌘K / Ctrl+K — always available, even from inside editors.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteMode("command");
        setPaletteOpen(true);
        setKeysOpen(false);
        return;
      }
      // Don't hijack typing.
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        setPaletteOpen(false);
        setKeysOpen(false);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setKeysOpen((v) => !v);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setPaletteMode("search");
        setPaletteOpen(true);
        return;
      }
      if (e.key === "j") {
        e.preventDefault();
        window.scrollBy({ top: 80, behavior: "smooth" });
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        window.scrollBy({ top: -80, behavior: "smooth" });
        return;
      }
      // Multi-key 'g X' navigation, 1s window.
      if (e.key === "g") {
        const t = Date.now();
        if (t - gPrefix.current < 1000) {
          // second g → home
          gPrefix.current = 0;
          navigate("/");
          return;
        }
        gPrefix.current = t;
        return;
      }
      if (Date.now() - gPrefix.current < 1000) {
        gPrefix.current = 0;
        if (e.key === "p") navigate("/plan");
        else if (e.key === "r") navigate("/review");
        else if (e.key === "s") navigate("/progress");
        else if (e.key === "b") navigate("/bookmarks");
        else if (e.key === "c") navigate("/coach");
        else if (e.key === "d") navigate("/rulebook");
        else if (e.key === "h") navigate("/");
        else return;

        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <BootOverlay />

      {/* Top bar — fixed height, ASCII frame */}
      <header
        className="shrink-0 flex items-center justify-between px-3 text-xs"
        style={{
          height: 32,
          borderBottom: "1px solid var(--color-border-bright)",
          background: "var(--color-bg-alt)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span style={{ width: 10, height: 10, background: "var(--color-danger)" }} />
            <span style={{ width: 10, height: 10, background: "var(--color-amber)" }} />
            <span style={{ width: 10, height: 10, background: "var(--color-accent)" }} />
          </div>
          <span style={{ color: "var(--color-text-muted)" }}>—</span>
          <span style={{ color: "var(--color-accent)" }} className="crt-glow font-bold tracking-wider">
            SMOKYCLAW
          </span>
          <span className="hidden md:inline" style={{ color: "var(--color-text-muted)" }}>·</span>
          <span className="hidden md:inline" style={{ color: "var(--color-text-dim)" }}>v3.0 / interview cracker</span>
        </div>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-dim)" }}>
          {/* Install + keyboard affordances are desktop-only — hidden on phones
              to keep the top bar uncluttered (mobile users navigate via the
              bottom tab bar; the app stays installable from the browser menu). */}
          <div className="hidden md:flex items-center gap-3">
            <InstallButton />
            <button
              type="button"
              onClick={() => {
                setPaletteMode("command");
                setPaletteOpen(true);
              }}
              className="px-2 py-0.5 transition-colors hover:brightness-125"
              style={{
                border: "1px solid var(--color-border-bright)",
                color: "var(--color-text-dim)",
                fontSize: 10,
              }}
              title="open command palette (⌘K)"
            >
              ⌘K
            </button>
            <button
              type="button"
              onClick={() => setKeysOpen(true)}
              className="px-2 py-0.5 transition-colors hover:brightness-125"
              style={{
                border: "1px solid var(--color-border-bright)",
                color: "var(--color-text-dim)",
                fontSize: 10,
              }}
              title="keyboard shortcuts (?)"
            >
              ?
            </button>
            <span>{crumb}</span>
            <span style={{ color: "var(--color-text-muted)" }}>·</span>
          </div>
          <Clock />
        </div>
      </header>

      {/* Main split: nav + content */}
      <div className="flex-1 flex min-h-0">
        <TreeNav />
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ background: "var(--color-bg)" }}
        >
          <div className="px-6 py-5 max-w-6xl mx-auto boot-in">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar (hidden on md+) */}
      <MobileNav />

      {/* Status bar */}
      <StatusBar />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        initialMode={paletteMode}
      />
      <KeysHelp open={keysOpen} onClose={() => setKeysOpen(false)} />
    </div>
  );
}
