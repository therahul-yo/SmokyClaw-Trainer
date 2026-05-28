import { useState } from "react";
import { Link } from "react-router-dom";

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
    emoji: "🦞",
    title: "Welcome to SmokyClaw Trainer",
    body: "Solo prep for Indian campus tests — TCS NQT, Infosys SP, Wipro, Capgemini. Python + DSA + SQL + Aptitude, in-browser, no signup.",
  },
  {
    emoji: "📅",
    title: "Tell us your deadline",
    body: "Build a study plan: pick a 1-week, 2-week, or 1-month deadline plus how much time you can give it daily. We lay out lessons and practice every day.",
  },
  {
    emoji: "🎯",
    title: "Practice + mocks",
    body: "Code Python and SQL right here. Wrong answers go into a Leitner spaced-repetition queue. Run full TCS NQT / Infosys SP mocks under timer to taste the real thing.",
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 space-y-5 shadow-xl">
        <div className="text-5xl text-center">{slide.emoji}</div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">{slide.title}</h2>
          <p className="text-sm text-[var(--color-text-dim)]">{slide.body}</p>
        </div>
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i === step ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-[var(--color-text-muted)] hover:text-white"
          >
            Skip
          </button>
          {isLast ? (
            <Link
              to="/plan/setup"
              onClick={finish}
              className="px-4 py-2 rounded-md text-sm bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-semibold"
            >
              Build my plan →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="px-4 py-2 rounded-md text-sm bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-semibold"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
