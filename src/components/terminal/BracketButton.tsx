import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "amber" | "danger" | "ghost";

type Props = {
  variant?: Variant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const palette: Record<Variant, { fg: string; border: string; bg: string }> = {
  default: { fg: "var(--color-text)", border: "var(--color-border-bright)", bg: "transparent" },
  primary: { fg: "var(--color-bg)", border: "var(--color-accent)", bg: "var(--color-accent)" },
  amber: { fg: "var(--color-bg)", border: "var(--color-amber)", bg: "var(--color-amber)" },
  danger: { fg: "var(--color-bg)", border: "var(--color-danger)", bg: "var(--color-danger)" },
  ghost: { fg: "var(--color-text-dim)", border: "transparent", bg: "transparent" },
};

export function BracketButton({
  variant = "default",
  children,
  className = "",
  ...rest
}: Props) {
  const { fg, border, bg } = palette[variant];
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center gap-1 px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:translate-y-px " +
        className
      }
      style={{ color: fg, border: `1px solid ${border}`, background: bg }}
    >
      <span style={{ opacity: 0.6 }}>[</span>
      <span>{children}</span>
      <span style={{ opacity: 0.6 }}>]</span>
    </button>
  );
}
