// src/pages/Dashboard.jsx
//
// The ONE authenticated landing page. Lives inside DashboardLayout (sidebar
// nav). Everything here uses real data: the logged-in user's name (never
// hardcoded) and their actual saved resumes from GET /api/resumes via the
// existing resumesAPI — no fake resumes, no invented progress metrics.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, ScanSearch, Compass, Mic, Plus, ArrowRight,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getUser } from "../utils/auth";
import { resumesAPI } from "../utils/api";
import { getTemplateById } from "../data/templateRegistry";

const QUICK_ACTIONS = [
  {
    title: "Resume Builder",
    description: "Create or improve a professional resume.",
    to: "/resume-builder",
    cta: "Start Building",
    icon: FileText,
  },
  {
    title: "ATS Analysis",
    description: "Analyze resume compatibility with ATS systems.",
    to: "/ats-analysis",
    cta: "Analyze Resume",
    icon: ScanSearch,
  },
  {
    title: "Career Guidance",
    description: "Get personalized career recommendations.",
    to: "/career-guidance",
    cta: "Get Guidance",
    icon: Compass,
  },
  {
    title: "Mock Interview",
    description: "Practice real interview questions.",
    to: "/mock-interview",
    cta: "Start Practice",
    icon: Mic,
  },
];

const ROADMAP_STEPS = [
  { title: "Build Resume", caption: "Create a strong resume", to: "/resume-builder", icon: FileText },
  { title: "Improve ATS Score", caption: "Analyze and enhance your resume", to: "/ats-analysis", icon: ScanSearch },
  { title: "Get Career Guidance", caption: "Discover suitable career paths", to: "/career-guidance", icon: Compass },
  { title: "Practice Mock Interview", caption: "Build confidence for interviews", to: "/mock-interview", icon: Mic },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const firstName = user?.fullName?.trim()?.split(/\s+/)[0];

  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [resumesError, setResumesError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingResumes(true);
      setResumesError("");
      try {
        const data = await resumesAPI.getAll();
        if (!cancelled) setResumes(data?.resumes || []);
      } catch (err) {
        if (!cancelled) setResumesError(err.message || "Could not load your saved resumes.");
      } finally {
        if (!cancelled) setLoadingResumes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await resumesAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete this resume. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-7 sm:p-9 text-white shadow-md">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-2xl">
            Let&apos;s prepare you for your next career opportunity.
          </p>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {QUICK_ACTIONS.map(({ title, description, to, cta, icon: Icon }) => (
              <div
                key={to}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col transition"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="text-blue-600" size={22} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 mt-1 flex-1">{description}</p>
                <button
                  onClick={() => navigate(to)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {cta} <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved resumes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Resumes</h2>
            <button
              onClick={() => navigate("/resume-builder")}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg px-4 py-2 hover:bg-blue-50 transition"
            >
              <Plus size={16} />
              Create New Resume
            </button>
          </div>

          {loadingResumes && <p className="text-gray-500 text-sm">Loading your resumes…</p>}

          {!loadingResumes && resumesError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{resumesError}</p>
          )}

          {!loadingResumes && !resumesError && resumes.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
              <p className="text-gray-800 font-semibold mb-1">No resumes yet</p>
              <p className="text-gray-500 text-sm mb-5">Create your first resume to get started.</p>
              <button
                onClick={() => navigate("/resume-builder")}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Create New Resume
              </button>
            </div>
          )}

          {!loadingResumes && !resumesError && resumes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumes.map((resume) => {
                const template = getTemplateById(resume.templateId);
                return (
                  <div key={resume.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{resume.title || "My Resume"}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Updated: {formatDate(resume.updatedAt)}</p>

                    <div className="flex gap-4 mt-5 text-sm font-semibold">
                      <button onClick={() => navigate(`/resume-preview/${resume.id}`)} className="text-blue-600 hover:underline">
                        View
                      </button>
                      <button onClick={() => navigate(`/resume-builder/${resume.id}`)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={deletingId === resume.id}
                        className="text-red-500 hover:underline disabled:opacity-60"
                      >
                        {deletingId === resume.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Career roadmap */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your CareerPilot Roadmap</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ROADMAP_STEPS.map(({ title, caption, to, icon: Icon }, i) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    {i < ROADMAP_STEPS.length - 1 && (
                      <div className="hidden lg:block flex-1 h-px bg-gray-200" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{caption}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
