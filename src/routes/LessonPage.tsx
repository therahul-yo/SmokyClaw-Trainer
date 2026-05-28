import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { getLesson, getQuizItemsByTopic } from "../lib/contentLoader";
import { useProgressStore } from "../store";
import { LessonRenderer } from "../components/LessonRenderer";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const markCompleted = useProgressStore((s) => s.markLessonCompleted);

  useEffect(() => {
    if (lesson) markCompleted(lesson.id);
  }, [lesson, markCompleted]);

  if (!lesson) return <Navigate to="/" replace />;

  const practiceItems = getQuizItemsByTopic(lesson.track, lesson.topic);

  return (
    <div className="space-y-4">
      <Prompt path={`~/tracks/${lesson.track}/lessons/${lesson.id}`}>
        <span>cat lesson.md</span>
      </Prompt>
      <div
        className="text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Link
          to={`/track/${lesson.track}`}
          style={{ color: "var(--color-cyan)" }}
          className="underline"
        >
          ← {lesson.track}/
        </Link>{" "}
        · {lesson.topic} · {lesson.estMinutes}m
      </div>

      <article className="prose-lesson">
        <LessonRenderer body={lesson.body} />
      </article>

      <Box
        title="$ next steps"
        trailing={`${practiceItems.length} drills`}
        variant={practiceItems.length > 0 ? "amber" : "default"}
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
    </div>
  );
}
