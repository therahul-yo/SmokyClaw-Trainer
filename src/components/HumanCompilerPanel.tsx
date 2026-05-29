import { useMemo, useState } from "react";
import type { QuizItem, TrackId } from "../types";
import {
  EMPTY_TRACE,
  MISTAKE_TAGS,
  idealTraceSeed,
  promptsForTrace,
  traceCompletionPct,
  traceTargetForItem,
  traceTargetForLesson,
} from "../lib/thinkingTrace";
import { useThinkingStore } from "../store";
import { AsciiProgress } from "./terminal/AsciiProgress";
import { Box } from "./terminal/Box";
import { BracketButton } from "./terminal/BracketButton";

type Props =
  | {
      mode: "lesson";
      lessonId: string;
      track: TrackId;
      topic: string;
      title: string;
    }
  | {
      mode: "item";
      item: QuizItem;
    };

export function HumanCompilerPanel(props: Props) {
  const [open, setOpen] = useState(true);
  const targetId =
    props.mode === "lesson"
      ? traceTargetForLesson(props.lessonId)
      : traceTargetForItem(props.item);
  const track = props.mode === "lesson" ? props.track : props.item.track;
  const trace = useThinkingStore((s) => s.traces[targetId] ?? EMPTY_TRACE);
  const updateField = useThinkingStore((s) => s.updateField);
  const toggleMistakeTag = useThinkingStore((s) => s.toggleMistakeTag);
  const resetTrace = useThinkingStore((s) => s.resetTrace);

  const prompts = useMemo(() => promptsForTrace(track), [track]);
  const completion = traceCompletionPct(trace);
  const seed = props.mode === "item" ? idealTraceSeed(props.item) : null;

  const title =
    props.mode === "lesson"
      ? `human-compiler: ${props.track}/${props.topic}`
      : `human-compiler: ${props.item.id}`;

  return (
    <Box
      title={`$ ${title}`}
      trailing={
        <button
          type="button"
          className="font-mono text-[10px] underline"
          style={{ color: "var(--color-cyan)" }}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "collapse" : "expand"}
        </button>
      }
      variant={completion >= 80 ? "default" : "amber"}
    >
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div>
            <div className="text-sm font-mono" style={{ color: "var(--color-accent)" }}>
              think before solving
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
              Parse input, classify pattern, build state, dry run, prove, then solve.
            </div>
          </div>
          <div className="font-mono text-xs flex items-center gap-2">
            <AsciiProgress value={completion} width={18} showPercent />
            <BracketButton variant="ghost" onClick={() => resetTrace(targetId)}>
              reset
            </BracketButton>
          </div>
        </div>

        {open && (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              {prompts.map((prompt) => (
                <label key={prompt.field} className="block">
                  <div
                    className="text-[10px] font-mono tracking-widest uppercase mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {prompt.label}
                  </div>
                  <textarea
                    value={trace[prompt.field]}
                    onChange={(e) =>
                      updateField(targetId, prompt.field, e.target.value)
                    }
                    placeholder={prompt.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 font-mono text-xs outline-none resize-y"
                    style={{
                      color: "var(--color-text)",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border-bright)",
                    }}
                  />
                  {seed?.[prompt.field] && trace[prompt.field].trim().length === 0 && (
                    <div
                      className="mt-1 text-[10px] leading-relaxed"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      seed: {seed[prompt.field]}
                    </div>
                  )}
                </label>
              ))}
            </div>

            <div>
              <div
                className="text-[10px] font-mono tracking-widest uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                mistake DNA
              </div>
              <div className="flex flex-wrap gap-2">
                {MISTAKE_TAGS.map((tag) => {
                  const active = trace.mistakeTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleMistakeTag(targetId, tag.id)}
                      className="px-2 py-1 font-mono text-xs transition-colors hover:brightness-110"
                      style={{
                        color: active
                          ? "var(--color-bg)"
                          : "var(--color-text-dim)",
                        background: active ? "var(--color-amber)" : "transparent",
                        border: `1px solid ${
                          active ? "var(--color-amber)" : "var(--color-border-bright)"
                        }`,
                      }}
                      title={tag.repair}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              {trace.mistakeTags.length > 0 && (
                <div className="mt-3 space-y-1">
                  {MISTAKE_TAGS.filter((tag) =>
                    trace.mistakeTags.includes(tag.id),
                  ).map((tag) => (
                    <div
                      key={tag.id}
                      className="text-xs"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      <span style={{ color: "var(--color-amber)" }}>
                        {tag.label}:
                      </span>{" "}
                      {tag.repair}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="block">
              <div
                className="text-[10px] font-mono tracking-widest uppercase mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                compressed rule
              </div>
              <textarea
                value={trace.mistakeRule}
                onChange={(e) =>
                  updateField(targetId, "mistakeRule", e.target.value)
                }
                placeholder="Convert the lesson or mistake into one rule your future brain can reuse."
                rows={2}
                className="w-full px-3 py-2 font-mono text-xs outline-none resize-y"
                style={{
                  color: "var(--color-text)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border-bright)",
                }}
              />
            </label>
          </>
        )}
      </div>
    </Box>
  );
}
