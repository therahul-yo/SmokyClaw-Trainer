import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getTracks, getAllQuizItems, getAllLessons } from "../lib/contentLoader";
import {
  useProgressStore,
  useReviewQueueStore,
  useStreakStore,
  useBookmarksStore,
} from "../store";
import { dueRecords } from "../lib/leitner";
import { OnboardingModal } from "../components/OnboardingModal";
import { DailyTargetCard } from "../components/DailyTargetCard";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { SmokeyStrip } from "../components/SmokeyStrip";
import { Box } from "../components/terminal/Box";
import { Prompt } from "../components/terminal/Prompt";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { BracketButton } from "../components/terminal/BracketButton";

const BANNER = String.raw`
███████╗███╗   ███╗ ██████╗ ██╗  ██╗██╗   ██╗ ██████╗██╗      █████╗ ██╗    ██╗
██╔════╝████╗ ████║██╔═══██╗██║ ██╔╝╚██╗ ██╔╝██╔════╝██║     ██╔══██╗██║    ██║
███████╗██╔████╔██║██║   ██║█████╔╝  ╚████╔╝ ██║     ██║     ███████║██║ █╗ ██║
╚════██║██║╚██╔╝██║██║   ██║██╔═██╗   ╚██╔╝  ██║     ██║     ██╔══██║██║███╗██║
███████║██║ ╚═╝ ██║╚██████╔╝██║  ██╗   ██║   ╚██████╗███████╗██║  ██║╚███╔███╔╝
╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝
`;

export function HomePage() {
  const tracks = getTracks();
  const allItems = getAllQuizItems();
  const allLessons = getAllLessons();
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const dueIds = useMemo(
    () => dueRecords(Object.values(reviewRecords)).map((r) => r.itemId),
    [reviewRecords],
  );
  const streak = useStreakStore((s) => s.currentStreak);
  const bookmarksCount = useBookmarksStore((s) => Object.keys(s.items).length);
  const completedLessons = useProgressStore(
    (s) => Object.keys(s.completedLessons).length,
  );
  const totalAttempts = useProgressStore((s) => s.attempts.length);

  return (
    <div className="space-y-6">
      <OnboardingModal />

      <div className="-mx-2">
        {/* Phones can't fit the 78-col ASCII banner without ugly clipping —
            show a compact wordmark there, full banner on sm+ screens. */}
        <div
          className="sm:hidden px-2 text-4xl font-bold tracking-widest crt-glow"
          style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
        >
          SMOKYCLAW
        </div>
        <pre
          className="hidden sm:block sm:text-[10px] leading-[1.1] whitespace-pre crt-glow px-2 overflow-x-auto"
          style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
        >
          {BANNER}
        </pre>
        <div className="px-2 mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          interview cracker · 100% local · no signup · v3.0
        </div>
      </div>

      <Prompt path="~">
        <span>boot --mode=cracker --time=monday</span>
        <span className="caret-blink ml-1" style={{ color: "var(--color-accent)" }}>
          ▌
        </span>
      </Prompt>

      <SmokeyStrip />

      <div className="grid md:grid-cols-2 gap-3">
        <DailyChallengeCard />
        <DailyTargetCard />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          label="streak"
          value={`${streak}d`}
          accent="amber"
          hint="keep the chain"
        />
        <StatTile
          label="due"
          value={String(dueIds.length)}
          accent={dueIds.length > 0 ? "amber" : "default"}
          hint="leitner queue"
        />
        <StatTile
          label="lessons"
          value={`${completedLessons}/${allLessons.length}`}
          hint="read"
        />
        <StatTile
          label="attempts"
          value={String(totalAttempts)}
          hint={`${bookmarksCount} ★`}
        />
      </div>

      {/* Tracks grid */}
      <Box title="$ ls -la ~/tracks/" trailing={`${tracks.length} dirs`}>
        <div className="grid md:grid-cols-2 gap-3">
          {tracks.map((t) => {
            const trackItems = allItems.filter((q) => q.track === t.id);
            const ids = trackItems.map((q) => q.id);
            const pct = useProgressStore
              .getState()
              .trackMasteryPct(t.id, ids);
            return (
              <Link
                key={t.id}
                to={`/track/${t.id}`}
                className="block px-3 py-3 transition-colors hover:brightness-110"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-mono">
                      <span style={{ color: "var(--color-text-muted)" }}>drwx </span>
                      <span style={{ color: "var(--color-accent)" }} className="font-bold">
                        {t.id}/
                      </span>
                    </div>
                    <div
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {t.blurb}
                    </div>
                  </div>
                  <div
                    className="text-[10px] shrink-0 tabular-nums"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {trackItems.length}b
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <AsciiProgress value={pct} width={18} />
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {pct}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Box>

      <Box title="$ today" trailing="quick jump">
        <div className="grid md:grid-cols-2 gap-3">
          <ActionRow
            to="/review"
            cmd="recall"
            label={`leitner queue — ${dueIds.length} due`}
            blurb="wrong answers resurface until they're fast and clean."
          />
          <ActionRow
            to="/machine"
            cmd="loop"
            label="machine loop — gates + repair"
            blurb="daily warm-up, pattern, mixed, repair, and speed blocks."
          />
          <ActionRow
            to="/mock/tcs-nqt-cognitive"
            cmd="mock"
            label="tcs cognitive — official-style"
            blurb="65 questions across numerical, verbal, and reasoning."
          />
          <ActionRow
            to="/mock/infosys-irt"
            cmd="mock"
            label="infosys irt — logic + pseudocode"
            blurb="timed logic, technical, verbal, pseudocode, and puzzles."
          />
          <ActionRow
            to="/mock/accenture-cognitive-technical"
            cmd="mock"
            label="accenture — cognitive + technical"
            blurb="company-style cognitive speed plus CS fundamentals."
          />
          <ActionRow
            to="/plan/setup"
            cmd="plan"
            label="generate a 7-day plan"
            blurb="weak topics first, paced to your daily minutes."
          />
          <ActionRow
            to="/progress"
            cmd="stats"
            label="see what's actually sticking"
            blurb="per-topic mastery, attempts, heatmap."
          />
        </div>
      </Box>

      <Box title="$ help" variant="amber">
        <div className="text-sm space-y-1" style={{ color: "var(--color-text-dim)" }}>
          <div>
            <span style={{ color: "var(--color-amber)" }}>tracks/</span> learn a topic
            cold — lessons + MCQs + coding problems with hints, brute→optimal, complexity check.
          </div>
          <div>
            <span style={{ color: "var(--color-amber)" }}>plan/</span> a deadline-aware
            adaptive plan. setup once, follow daily.
          </div>
          <div>
            <span style={{ color: "var(--color-amber)" }}>review/</span> leitner-style
            spaced repetition. fixes the "saw it once, forgot it" problem.
          </div>
          <div>
            <span style={{ color: "var(--color-amber)" }}>mock/</span> full TCS NQT or
            Infosys SP simulator with the real section / time structure.
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link to="/track/dsa">
              <BracketButton variant="primary">start dsa</BracketButton>
            </Link>
            <Link to="/track/python">
              <BracketButton>start python</BracketButton>
            </Link>
            <Link to="/track/sql">
              <BracketButton>start sql</BracketButton>
            </Link>
            <Link to="/track/aptitude">
              <BracketButton>start aptitude</BracketButton>
            </Link>
          </div>
        </div>
      </Box>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "amber";
}) {
  const valueColor = accent === "amber" ? "var(--color-amber)" : "var(--color-accent)";
  return (
    <div
      className="px-3 py-2"
      style={{
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border-bright)",
      }}
    >
      <div
        className="text-[10px] tracking-widest uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold tabular-nums crt-glow"
        style={{ color: valueColor }}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function ActionRow({
  to,
  cmd,
  label,
  blurb,
}: {
  to: string;
  cmd: string;
  label: string;
  blurb: string;
}) {
  return (
    <Link
      to={to}
      className="block px-3 py-3 transition-colors hover:brightness-110"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-baseline gap-2 text-sm">
        <span style={{ color: "var(--color-text-muted)" }}>$</span>
        <span style={{ color: "var(--color-amber)" }} className="font-bold">
          {cmd}
        </span>
        <span style={{ color: "var(--color-text)" }}>{label}</span>
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: "var(--color-text-dim)" }}
      >
        {blurb}
      </div>
    </Link>
  );
}
