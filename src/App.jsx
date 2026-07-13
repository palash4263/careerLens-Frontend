import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumePage from "./pages/ResumePage";
import JobDescriptionPage from "./pages/JobDescriptionPage";
import AtsPage from "./pages/AtsPage";
import InterviewPage from "./pages/InterviewPage";
import ResumeOptimizationPage from "./pages/ResumeOptimizationPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TemplatesPage from "./pages/TemplatesPage";

// ✅ Protected Route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function Layout() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Check if token exists
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, [location]);

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  // ✅ Show nothing while checking authentication
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0A0A0F',
      color: '#F1F5F9',
      fontSize: '1.2rem'
    }}>Loading...</div>;
  }

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="page-container">
        <Routes>
          {/* Authentication - No Navbar */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ✅ Protected Routes - With Navbar */}
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
            path="/interview" 
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/resume-optimizer" 
            element={
              <ProtectedRoute>
                <ResumeOptimizationPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/optimizer" 
            element={
              <ProtectedRoute>
                <ResumeOptimizationPage />
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
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* ✅ If authenticated, redirect to dashboard; otherwise to login */}
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
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;