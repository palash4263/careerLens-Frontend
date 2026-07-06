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
import InterviewPage from "./pages/InterviewPage";
import ResumeOptimizationPage from "./pages/ResumeOptimizationPage";
function Layout() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";
  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="page-container">
        <Routes>
          {/* Authentication */}
          <Route path="/" element={<Login />} />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          {/* Resume Management */}
          <Route
            path="/resumes"
            element={<ResumePage />}
          />
          {/* Job Descriptions */}
          <Route
            path="/jobs"
            element={<JobDescriptionPage />}
          />
          {/* Interview Questions */}
          <Route
            path="/interview"
            element={<InterviewPage />}
          />
          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/login" />}
          />
          {/* Resume Optimizer */}
          <Route
             path="/resume-optimizer"
             element={<ResumeOptimizationPage />}
           />
          <Route
             path="/optimizer"
             element={<ResumeOptimizationPage />}
           />
          <Route
             path="/ats"
             element={<AtsPage />}
           />
  
          
        </Routes>
      </div>
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
export default App;