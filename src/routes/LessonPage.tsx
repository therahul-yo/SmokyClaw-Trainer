import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getLesson,
  getLessonsByTrack,
  getQuizItemsByTopic,
} from "../lib/contentLoader";
import { useProgressStore } from "../store";
import { LessonRenderer } from "../components/LessonRenderer";
import { HumanCompilerPanel } from "../components/HumanCompilerPanel";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

const FONT_SIZES = ["sm", "md", "lg"] as const;
type FontSize = (typeof FONT_SIZES)[number];

const FONT_PX: Record<FontSize, string> = {
  sm: "14px",
  md: "16px",
  lg: "18px",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractTOC(body: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  const lines = body.split("\n");
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) out.push({ id: slugify(m[1]), text: m[1] });
  }
  return out;
}

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const markCompleted = useProgressStore((s) => s.markLessonCompleted);

  const articleRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const stored = localStorage.getItem("smokyclaw/font-size");
      if (stored && FONT_SIZES.includes(stored as FontSize)) return stored as FontSize;
    } catch {
      // ignore
    }
    return "md";
  });

  useEffect(() => {
    if (lesson) markCompleted(lesson.id);
  }, [lesson, markCompleted]);

  useEffect(() => {
    try {
      localStorage.setItem("smokyclaw/font-size", fontSize);
    } catch {
      // ignore
    }
  }, [fontSize]);

  // Reading-progress bar — scrolls within the main pane (overflow-y-auto).
  useEffect(() => {
    const main = articleRef.current?.closest("main");
    if (!main) return;
    const article = articleRef.current;
    if (!article) return;
    function onScroll() {
      if (!main || !article) return;
      const articleTop = article.offsetTop;
      const articleBottom = articleTop + article.scrollHeight;
      const viewBottom = main.scrollTop + main.clientHeight;
      const total = articleBottom - articleTop;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const read = Math.max(0, viewBottom - articleTop);
      setProgress(Math.min(100, Math.round((read / total) * 100)));

      // Active heading: the last H2 whose top has passed.
      const headings = article.querySelectorAll<HTMLElement>("h2[id]");
      const cutoff = main.scrollTop + 80;
      let current: string | null = null;
      for (const h of Array.from(headings)) {
        if (h.offsetTop <= cutoff) current = h.id;
        else break;
      }
      setActiveHeading(current);
    }
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [lesson?.id]);

  const trackLessons = useMemo(() => {
    if (!lesson) return [];
    return getLessonsByTrack(lesson.track);
  }, [lesson]);

  const navIndex = useMemo(() => {
    if (!lesson) return -1;
    return trackLessons.findIndex((l) => l.id === lesson.id);
  }, [trackLessons, lesson]);

  const toc = useMemo(
    () => (lesson ? extractTOC(lesson.body) : []),
    [lesson],
  );

  if (!lesson) return <Navigate to="/" replace />;

  const prev = navIndex > 0 ? trackLessons[navIndex - 1] : undefined;
  const next =
    navIndex >= 0 && navIndex < trackLessons.length - 1
      ? trackLessons[navIndex + 1]
      : undefined;

  const practiceItems = getQuizItemsByTopic(lesson.track, lesson.topic);

  return (
    <div className="space-y-4" style={{ fontSize: FONT_PX[fontSize] }}>
      {/* Reading progress bar — fixed at top of main pane */}
      <div
        className="sticky top-0 z-30 -mx-6 -mt-5 mb-4"
        style={{
          background: "var(--color-bg)",
        }}
      >
        <div
          className="h-0.5"
          style={{
            background: "var(--color-accent)",
            width: `${progress}%`,
            transition: "width 80ms linear",
            boxShadow: "0 0 4px var(--color-accent)",
          }}
        />
      </div>

      <Prompt path={`~/tracks/${lesson.track}/lessons/${lesson.id}`}>
        <span>cat lesson.md</span>
      </Prompt>

      <div className="flex items-center justify-between text-xs">
        <div style={{ color: "var(--color-text-muted)" }}>
          <Link
            to={`/track/${lesson.track}`}
            style={{ color: "var(--color-cyan)" }}
            className="underline"
          >
            ← {lesson.track}/
          </Link>{" "}
          · {lesson.topic} · {lesson.estMinutes}m ·{" "}
          <span style={{ color: "var(--color-accent)" }}>{progress}% read</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span
            className="text-[10px] mr-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            font
          </span>
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFontSize(s)}
              className="px-1.5 py-0.5 transition-colors hover:brightness-110"
              style={{
                border: `1px solid ${
                  fontSize === s
                    ? "var(--color-accent)"
                    : "var(--color-border-bright)"
                }`,
                color:
                  fontSize === s ? "var(--color-accent)" : "var(--color-text-dim)",
                background: "transparent",
                fontSize: 10,
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-6">
        <article ref={articleRef}>
          <HumanCompilerPanel
            mode="lesson"
            lessonId={lesson.id}
            track={lesson.track}
            topic={lesson.topic}
            title={lesson.title}
          />

          <div className="mt-6" />

          <LessonRenderer body={lesson.body} withHeadingIds />

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {prev ? (
              <Link
                to={`/lesson/${prev.id}`}
                className="block px-3 py-2 font-mono transition-colors hover:brightness-110"
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border-bright)",
                }}
              >
                <div
                  className="text-[10px] tracking-widest uppercase"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ← prev
                </div>
                <div
                  className="text-sm font-bold truncate"
                  style={{ color: "var(--color-accent)" }}
                >
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to={`/lesson/${next.id}`}
                className="block px-3 py-2 font-mono transition-colors hover:brightness-110 text-right"
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border-bright)",
                }}
              >
                <div
                  className="text-[10px] tracking-widest uppercase"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  next →
                </div>
                <div
                  className="text-sm font-bold truncate"
                  style={{ color: "var(--color-accent)" }}
                >
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>

          <Box
            title="$ next steps"
            trailing={`${practiceItems.length} drills`}
            variant={practiceItems.length > 0 ? "amber" : "default"}
            className="mt-6"
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              {practiceItems.length > 0
                ? `${practiceItems.length} drills queued — code what you just read.`
                : "no drills wired for this topic yet."}
            </div>
            {practiceItems.length > 0 && (
              <div className="mt-3">
                <Link to={`/quiz/${lesson.track}/${lesson.topic}`}>
                  <BracketButton variant="primary">start practice →</BracketButton>
                </Link>
              </div>
            )}
          </Box>
        </article>

        {/* TOC sidebar */}
        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-6 font-mono text-xs">
              <div
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                ── on this page ──
              </div>
              <ul className="space-y-1">
                {toc.map((h) => {
                  const active = activeHeading === h.id;
                  return (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="block px-2 py-0.5 transition-colors hover:brightness-125"
                        style={{
                          color: active
                            ? "var(--color-accent)"
                            : "var(--color-text-dim)",
                          borderLeft: `2px solid ${
                            active ? "var(--color-accent)" : "transparent"
                          }`,
                        }}
                      >
                        {active ? "▸ " : "  "}
                        {h.text}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div
                className="mt-4 pt-3 text-[10px]"
                style={{
                  borderTop: "1px dashed var(--color-border-bright)",
                  color: "var(--color-text-muted)",
                }}
              >
                {progress}% read · est {lesson.estMinutes}m
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
