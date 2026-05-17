import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { getLesson, getQuizItemsByTopic } from "../lib/contentLoader";
import { useProgressStore } from "../store";
import { LessonRenderer } from "../components/LessonRenderer";

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
    <div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
        <Link to={`/track/${lesson.track}`} className="hover:text-white">
          ← back to {lesson.track}
        </Link>
      </div>
      <LessonRenderer body={lesson.body} />

      <div className="mt-12 p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="font-semibold text-white">Practice this topic</div>
        <div className="text-sm text-[var(--color-text-dim)] mt-1">
          {practiceItems.length > 0
            ? `${practiceItems.length} drills queued — apply what you just read.`
            : "No drills wired for this topic yet."}
        </div>
        {practiceItems.length > 0 && (
          <Link
            to={`/quiz/${lesson.track}/${lesson.topic}`}
            className="inline-block mt-3 px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-medium"
          >
            Start practice →
          </Link>
        )}
      </div>
    </div>
  );
}
