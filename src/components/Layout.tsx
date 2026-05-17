import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { StreakBadge } from "./StreakBadge";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text)]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-dim)]">
            Interview Trainer · solo mode
          </div>
          <StreakBadge />
        </header>
        <div className="px-6 py-6 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
