import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./routes/HomePage";
import { TrackPage } from "./routes/TrackPage";
import { LessonPage } from "./routes/LessonPage";
import { QuizPage } from "./routes/QuizPage";
import { SandboxPage } from "./routes/SandboxPage";
import { ReviewPage } from "./routes/ReviewPage";
import { BookmarksPage } from "./routes/BookmarksPage";
import { ProgressPage } from "./routes/ProgressPage";
import { MockTestPage } from "./routes/MockTestPage";
import { PlanPage } from "./routes/PlanPage";
import { PlanSetupPage } from "./routes/PlanSetupPage";
import { PatternsPage } from "./routes/PatternsPage";
import { CoachPage } from "./routes/CoachPage";
import { MachinePage } from "./routes/MachinePage";
import { RecognitionPage } from "./routes/RecognitionPage";
import { SpeedChallengePage } from "./routes/SpeedChallengePage";
import { RulebookPage } from "./routes/RulebookPage";


export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/track/:trackId" element={<TrackPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/quiz/:trackId/:topic" element={<QuizPage />} />
          <Route path="/sandbox/:kind" element={<SandboxPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/rulebook" element={<RulebookPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/machine" element={<MachinePage />} />
          <Route path="/recognition" element={<RecognitionPage />} />
          <Route path="/speedrun" element={<SpeedChallengePage />} />
          <Route path="/mock/:id" element={<MockTestPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/setup" element={<PlanSetupPage />} />
          <Route path="/patterns/:trackId" element={<PatternsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
