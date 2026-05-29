import { Link } from "react-router-dom";
import type { MockTestBlueprint, McqItem, MockSection } from "../types";
import { Box } from "./terminal/Box";
import { BracketButton } from "./terminal/BracketButton";
import { Prompt } from "./terminal/Prompt";

type PickedSection = {
  meta: {
    id: string;
    title: string;
    durationMinutes: number;
    questionCount: number;
    pickFrom: MockSection["pickFrom"];
  };
  items: McqItem[];
};

type PostMockReportProps = {
  blueprint: MockTestBlueprint;
  sections: PickedSection[];
  answers: Record<string, number>;
};

export function PostMockReport({ blueprint, sections, answers }: PostMockReportProps) {
  const sectionResults = sections.map((sec) => {
    let correct = 0;
    const wrongItems: McqItem[] = [];
    for (const q of sec.items) {
      if (answers[q.id] === q.answerIndex) {
        correct += 1;
      } else {
        wrongItems.push(q);
      }
    }
    return {
      id: sec.meta.id,
      title: sec.meta.title,
      correct,
      total: sec.items.length,
      wrongItems,
      pickFrom: sec.meta.pickFrom,
    };
  });

  const totalCorrect = sectionResults.reduce((a, s) => a + s.correct, 0);
  const totalQs = sectionResults.reduce((a, s) => a + s.total, 0);
  const pct = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  // Identify weak sections (accuracy < 70% or lowest score)
  const weakSections = sectionResults.filter((s) => s.total > 0 && (s.correct / s.total) < 0.7);

  // If none are < 70% but they missed something, pick the lowest accuracy one
  const lowestSection = [...sectionResults]
    .filter((s) => s.total > 0)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))[0];

  const sectionsToRepair = weakSections.length > 0 ? weakSections : (pct < 100 && lowestSection ? [lowestSection] : []);

  return (
    <div className="max-w-2xl space-y-4 font-mono">
      <Prompt path={`~/mock/${blueprint.id}/report`}>
        <span>cat score.report</span>
      </Prompt>

      <div
        className="text-2xl font-bold crt-glow"
        style={{ color: "var(--color-accent)" }}
      >
        {blueprint.title}.report
      </div>

      <div
        className="text-3xl font-bold tabular-nums"
        style={{
          color: pct >= 70 ? "var(--color-accent)" : "var(--color-danger)",
        }}
      >
        {totalCorrect}/{totalQs}
        <span
          className="text-base font-normal ml-3"
          style={{ color: "var(--color-text-dim)" }}
        >
          = {pct}%
        </span>
      </div>

      <Box title="$ section --breakdown">
        <div className="space-y-1 text-sm">
          {sectionResults.map((r) => {
            const sectionPct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
            return (
              <div key={r.title} className="flex justify-between">
                <span style={{ color: "var(--color-text)" }}>{r.title}</span>
                <span>
                  <span
                    style={{
                      color: sectionPct >= 70 ? "var(--color-accent)" : "var(--color-danger)",
                    }}
                  >
                    {r.correct}/{r.total}
                  </span>
                  <span
                    className="ml-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ({sectionPct}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Box>

      {sectionsToRepair.length > 0 && (
        <Box title="$ repair --suggest-plan" variant="amber">
          <div className="text-xs mb-3" style={{ color: "var(--color-text-dim)" }}>
            // auto-generated weakness repair pathways based on missed items:
          </div>
          <div className="space-y-3">
            {sectionsToRepair.map((sec) => {
              // Extract unique tracks, and unique (track, topic) pairs — keying
              // topics by track alone collapses same-named topics from different
              // tracks and would link to the wrong track's quiz.
              const tracks = Array.from(new Set(sec.wrongItems.map((item) => item.track)));
              const topicPairs = Array.from(
                new Map(
                  sec.wrongItems.map((item) => [
                    `${item.track}::${item.topic}`,
                    { track: item.track, topic: item.topic },
                  ]),
                ).values(),
              );

              return (
                <div key={sec.id} className="text-xs border-l-2 pl-3 py-1" style={{ borderColor: "var(--color-amber)" }}>
                  <div className="font-bold text-white mb-1">
                    Section Weakness: {sec.title}
                  </div>
                  <div style={{ color: "var(--color-text-dim)" }} className="mb-2">
                    Review theory and attempt targeted drills for the following areas:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tracks.map((track) => (
                      <Link key={track} to={`/track/${track}`}>
                        <BracketButton variant="primary">drill {track}</BracketButton>
                      </Link>
                    ))}
                    {topicPairs.map(({ track, topic }) => (
                      <Link key={`${track}::${topic}`} to={`/quiz/${track}/${topic}`}>
                        <BracketButton>quiz: {topic}</BracketButton>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      )}

      <div
        className="text-xs leading-relaxed"
        style={{ color: "var(--color-text-dim)" }}
      >
        // missed items have been inserted back into your Leitner spaced repetition review queue to guarantee retention.
      </div>

      <div className="flex gap-2">
        <BracketButton variant="danger" onClick={() => window.location.reload()}>
          ↻ restart simulation
        </BracketButton>
        <Link to="/">
          <BracketButton>← return to home</BracketButton>
        </Link>
      </div>
    </div>
  );
}
