// src/layouts/DashboardLayout.jsx
//
// Shared shell for every AUTHENTICATED page (Dashboard, Resume Builder, ATS
// Analysis, Career Guidance, Mock Interview): a persistent left sidebar with
// CareerPilot branding, nav links with a clear active state, and a
// user/logout area — replacing the plain top Navbar (MainLayout) that only
// public pages (Home, Login, Signup, How It Works) still use.
//
// This is the ONE authenticated navigation surface for the whole app; no
// page under it should render its own separate nav/back-to-dashboard chrome.
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, ScanSearch, Compass, Mic, Briefcase,
  LogOut, Menu, X, Rocket,
} from "lucide-react";
import { getUser, logout } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Resume Builder", to: "/resume-builder", icon: FileText },
  { label: "ATS Analysis", to: "/ats-analysis", icon: ScanSearch },
  { label: "Career Guidance", to: "/career-guidance", icon: Compass },
  { label: "Job Recommendations", to: "/job-recommendations", icon: Briefcase },
  { label: "Mock Interview", to: "/mock-interview", icon: Mic },
];

function initialsFor(name) {
  if (!name) return "CP";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "CP";
}

function SidebarContent({ user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">CareerPilot</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-100/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {initialsFor(user?.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName || "Your account"}</p>
            <p className="text-xs text-blue-200/70 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100/80 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const user = getUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-blue-950 to-blue-900">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar (slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 h-full bg-gradient-to-b from-blue-950 to-blue-900 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-3 p-1.5 rounded-lg text-blue-100/80 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-blue-600">CareerPilot</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
