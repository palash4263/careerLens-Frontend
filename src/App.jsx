import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumePage from "./pages/ResumePage";
import JobDescriptionPage from "./pages/JobDescriptionPage";
import AtsPage from "./pages/AtsPage";
import ResumeOptimizationPage from "./pages/ResumeOptimizationPage";
import ResumeEditorPage from "./pages/ResumeEditorPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TemplatesPage from "./pages/TemplatesPage";
import AtsScoreCalculatorPage from "./pages/AtsScoreCalculatorPage";
import InterviewPrepPage from "./pages/InterviewPrepPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import SkillRoadmapPage from "./pages/SkillRoadmapPage";
import JobExtractionPage from "./pages/JobExtractionPage";
import api from "./api/axiosConfig";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Layout() {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/resume-editor" ||
    location.pathname === "/resume-builder";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobDescriptionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview-prep"
            element={
              <ProtectedRoute>
                <InterviewPrepPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/java-tutor"
            element={
              <ProtectedRoute>
                <InterviewPrepPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview-prep/:jobId"
            element={
              <ProtectedRoute>
                <InterviewPrepPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume-optimizer"
            element={
              <ProtectedRoute>
                <Navigate to="/resume-builder" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/optimizer"
            element={
              <ProtectedRoute>
                <Navigate to="/resume-builder" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume-editor"
            element={
              <ProtectedRoute>
                <Navigate to="/resume-builder" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume-builder"
            element={
              <ProtectedRoute>
                <ResumeBuilderPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/skill-roadmap"
            element={
              <ProtectedRoute>
                <SkillRoadmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ats"
            element={
              <ProtectedRoute>
                <AtsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ats-calculator"
            element={
              <ProtectedRoute>
                <AtsScoreCalculatorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/job-extractor"
            element={
              <ProtectedRoute>
                <JobExtractionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </>
  );
}

function App() {
  // Wake up Render free tier backend container early on page load
  useEffect(() => {
    api.get("/health").catch(() => {
      // Silent catch — pinging just to wake server from sleep
    });
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;