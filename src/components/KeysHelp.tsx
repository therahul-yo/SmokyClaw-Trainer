type Binding = { keys: string[]; desc: string };

const BINDINGS: { group: string; items: Binding[] }[] = [
  {
    group: "global",
    items: [
      { keys: ["⌘ K", "Ctrl K"], desc: "open command palette" },
      { keys: ["/"], desc: "search items (palette / mode)" },
      { keys: ["?"], desc: "show this help" },
      { keys: ["Esc"], desc: "close modal / palette" },
    ],
  },
  {
    group: "navigation",
    items: [
      { keys: ["g g"], desc: "go home" },
      { keys: ["g p"], desc: "go to plan" },
      { keys: ["g r"], desc: "go to review queue" },
      { keys: ["g s"], desc: "go to progress" },
      { keys: ["g c"], desc: "go to smokey (coach)" },
      { keys: ["g b"], desc: "go to bookmarks" },
      { keys: ["j"], desc: "scroll down" },
      { keys: ["k"], desc: "scroll up" },
    ],
  },
  {
    group: "in palette",
    items: [
      { keys: ["↑ / ↓"], desc: "move between results" },
      { keys: ["Ctrl P / N"], desc: "move (emacs style)" },
      { keys: ["↵"], desc: "select" },
    ],
  },
];

export function KeysHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-4 boot-in font-mono"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-cyan)",
          boxShadow: "0 0 40px rgba(255, 217, 163, 0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between text-xs mb-3 pb-2"
          style={{ borderBottom: "1px dashed var(--color-border-bright)" }}
        >
          <span style={{ color: "var(--color-cyan)" }}>── KEYS.MAP ──</span>
          <span style={{ color: "var(--color-text-muted)" }}>press esc / ? to close</span>
        </div>

        <div className="space-y-4">
          {BINDINGS.map((g) => (
            <div key={g.group}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {g.group}
              </div>
              <div className="space-y-1 text-sm">
                {g.items.map((b) => (
                  <div key={b.desc} className="flex items-center gap-3">
                    <div className="flex gap-1 shrink-0 w-32">
                      {b.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-xs"
                          style={{
                            background: "var(--color-bg-card)",
                            border: "1px solid var(--color-border-bright)",
                            color: "var(--color-amber)",
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span style={{ color: "var(--color-text-dim)" }}>{b.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
