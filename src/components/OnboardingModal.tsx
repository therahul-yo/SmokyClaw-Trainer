import { useState } from "react";
import { Link } from "react-router-dom";
import { BracketButton } from "./terminal/BracketButton";

const STORAGE_KEY = "smokyclaw/onboarded";

function shouldShowOnMount(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

const SLIDES = [
  {
    title: "// boot smokyclaw v3",
    body: "solo prep for indian campus tests — tcs nqt, infosys sp, wipro, capgemini. python + dsa + sql + aptitude, in-browser, no signup, 100% local.",
  },
  {
    title: "// configure plan",
    body: "pick a deadline (7 / 14 / 30 days) plus daily minutes. we lay out lessons + practice every day, weakness-prioritized.",
  },
  {
    title: "// practice + mocks",
    body: "code python + sql here. wrong answers go into a leitner spaced-repetition queue. run full tcs nqt / infosys sp mocks under timer.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState<boolean>(shouldShowOnMount);
  const [step, setStep] = useState(0);

  if (!open) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="max-w-md w-full p-5 space-y-4 font-mono boot-in"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-accent)",
          boxShadow: "0 0 40px rgba(92, 255, 159, 0.15)",
        }}
      >
        <div
          className="flex items-center justify-between text-xs"
          style={{
            borderBottom: "1px dashed var(--color-border-bright)",
            paddingBottom: "0.5rem",
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>
            ── ONBOARD.SH ──
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            step {step + 1}/{SLIDES.length}
          </span>
        </div>

        <div
          className="text-base font-bold crt-glow"
          style={{ color: "var(--color-accent)" }}
        >
          {slide.title}
        </div>
        <div className="text-sm" style={{ color: "var(--color-text)" }}>
          {slide.body}
        </div>

        <div className="flex justify-center gap-1">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="h-1 w-8"
              style={{
                background:
                  i === step
                    ? "var(--color-accent)"
                    : "var(--color-border-bright)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <BracketButton variant="ghost" onClick={finish}>
            skip
          </BracketButton>
          {isLast ? (
            <Link to="/plan/setup" onClick={finish}>
              <BracketButton variant="primary">build my plan →</BracketButton>
            </Link>
          ) : (
            <BracketButton
              variant="primary"
              onClick={() =>
                setStep((s) => Math.min(SLIDES.length - 1, s + 1))
              }
            >
              next →
            </BracketButton>
          )}
        </div>
      </div>
    </div>
  );
}
