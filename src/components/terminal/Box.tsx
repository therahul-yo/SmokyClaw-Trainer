import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  trailing?: ReactNode;
  variant?: "default" | "amber" | "danger";
  className?: string;
  children: ReactNode;
};

const variantColor: Record<NonNullable<Props["variant"]>, string> = {
  default: "var(--color-border-bright)",
  amber: "var(--color-amber-dim)",
  danger: "var(--color-danger)",
};

export function Box({ title, trailing, variant = "default", className = "", children }: Props) {
  const border = variantColor[variant];
  return (
    <section
      className={"relative " + className}
      style={{ border: `1px solid ${border}`, background: "var(--color-bg-alt)" }}
    >
      {(title || trailing) && (
        <header
          className="flex items-center justify-between px-3 py-1 text-xs"
          style={{ borderBottom: `1px solid ${border}`, color: "var(--color-text-muted)" }}
        >
          <span className="truncate">{title}</span>
          {trailing && <span className="shrink-0 pl-3">{trailing}</span>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
