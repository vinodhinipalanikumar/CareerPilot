import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import HowItWorks from "./pages/HowItWorks";
import ResumeBuilder from "./pages/ResumeBuilder";
import ATSAnalysis from "./pages/ATSAnalysis";
import CareerGuidance from "./pages/CareerGuidance";
import MockInterview from "./pages/MockInterview";
import ResumePreview from "./components/ResumePreview";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-builder"
        element={
          <ProtectedRoute>
            <ResumeBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-builder/:resumeId"
        element={
          <ProtectedRoute>
            <ResumeBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ats-analysis"
        element={
          <ProtectedRoute>
            <ATSAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/career-guidance"
        element={
          <ProtectedRoute>
            <CareerGuidance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mock-interview"
        element={
          <ProtectedRoute>
            <MockInterview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-preview"
        element={
          <ProtectedRoute>
            <ResumePreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-preview/:resumeId"
        element={
          <ProtectedRoute>
            <ResumePreview />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
