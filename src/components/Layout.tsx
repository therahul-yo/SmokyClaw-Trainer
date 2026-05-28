import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TreeNav } from "./TreeNav";
import { StatusBar } from "./StatusBar";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatTime(d: Date) {
  return d.toTimeString().slice(0, 8);
}

function pathBreadcrumb(pathname: string): string {
  if (pathname === "/") return "~";
  return "~" + pathname.replace(/\/+$/g, "");
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const now = useClock();
  const crumb = pathBreadcrumb(location.pathname);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
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
          <span style={{ color: "var(--color-text-muted)" }}>·</span>
          <span style={{ color: "var(--color-text-dim)" }}>v3.0 / interview cracker</span>
        </div>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-dim)" }}>
          <span>{crumb}</span>
          <span style={{ color: "var(--color-text-muted)" }}>·</span>
          <span className="tabular-nums">{formatTime(now)}</span>
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

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
