import type { ReactNode } from "react";

type Props = {
  user?: string;
  path?: string;
  children?: ReactNode;
  caret?: boolean;
  className?: string;
};

export function Prompt({ user = "rahul", path = "~", children, caret = false, className = "" }: Props) {
  return (
    <div className={"font-mono text-sm flex flex-wrap items-baseline gap-1 " + className}>
      <span style={{ color: "var(--color-accent)" }}>{user}@smokyclaw</span>
      <span style={{ color: "var(--color-text-muted)" }}>:</span>
      <span style={{ color: "var(--color-cyan)" }}>{path}</span>
      <span style={{ color: "var(--color-text-muted)" }}>$</span>
      {children && <span style={{ color: "var(--color-text)" }}>{children}</span>}
      {caret && <span className="caret-blink" style={{ color: "var(--color-accent)" }}>▌</span>}
    </div>
  );
}
