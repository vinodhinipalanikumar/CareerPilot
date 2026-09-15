/**
 * HeroResumeMockup — decorative dashboard preview for the Hero right panel.
 * Built with HTML/CSS only (no external images).
 */
function HeroResumeMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Glow behind the mockup */}
      <div
        className="absolute -inset-4 rounded-3xl bg-blue-400/20 blur-2xl"
        aria-hidden="true"
      />

      {/* Dashboard window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl shadow-blue-900/20 backdrop-blur-sm">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="ml-2 text-xs font-medium text-slate-500">
            CareerPilot Dashboard
          </span>
        </div>

        <div className="flex gap-4 p-4 sm:p-5">
          {/* Sidebar */}
          <aside className="hidden w-28 shrink-0 flex-col gap-2 sm:flex">
            {["Resume", "ATS Score", "Guidance", "Interview"].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-2 py-2 text-center text-[10px] font-semibold ${
                  i === 0
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          {/* Resume preview */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* ATS score card */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-blue-100">
                  ATS Score
                </p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/30">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Resume document skeleton */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100" aria-hidden="true" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-24 rounded-full bg-slate-800" aria-hidden="true" />
                  <div className="h-2 w-32 rounded-full bg-slate-300" aria-hidden="true" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-slate-200" aria-hidden="true" />
                <div className="h-2 w-5/6 rounded-full bg-slate-200" aria-hidden="true" />
                <div className="h-2 w-2/3 rounded-full bg-slate-200" aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-20 rounded-full bg-blue-200" aria-hidden="true" />
                <div className="h-2 w-full rounded-full bg-slate-100" aria-hidden="true" />
                <div className="h-2 w-full rounded-full bg-slate-100" aria-hidden="true" />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 px-3 py-2">
                <p className="text-[10px] text-emerald-600">Keywords</p>
                <p className="text-sm font-bold text-emerald-700">24/28</p>
              </div>
              <div className="rounded-lg bg-violet-50 px-3 py-2">
                <p className="text-[10px] text-violet-600">Interview</p>
                <p className="text-sm font-bold text-violet-700">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero — full-screen split layout with copy on the left and a resume dashboard mockup on the right.
 */
function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900"
    >
      {/* Gradient overlays for depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.25),transparent_45%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(129,140,248,0.2),transparent_40%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
        {/* ── Left: headline, copy, and CTA ── */}
        <div className="text-center lg:text-left">
          <h1 className="opacity-0-start animate-fade-in-up text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to CareerPilot
          </h1>

          <p className="opacity-0-start animate-fade-in-up animate-delay-150 mt-5 text-xl font-medium text-blue-200 sm:text-2xl">
            Your AI Career Preparation Platform
          </p>

          <p className="opacity-0-start animate-fade-in-up animate-delay-300 mt-6 max-w-xl text-base leading-relaxed text-blue-100/90 sm:text-lg lg:mx-0 mx-auto">
            Take control of your career journey with intelligent tools designed
            for modern job seekers. Use our{" "}
            <span className="font-semibold text-white">Resume Builder</span> to
            craft polished CVs, run{" "}
            <span className="font-semibold text-white">ATS Analysis</span> to
            optimize for recruiters, receive personalized{" "}
            <span className="font-semibold text-white">Career Guidance</span>,
            and sharpen your skills with realistic{" "}
            <span className="font-semibold text-white">Mock Interview</span>{" "}
            sessions.
          </p>

          <div className="opacity-0-start animate-fade-in-up animate-delay-450 mt-10 flex justify-center lg:justify-start">
            <a
              href="#get-started"
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-blue-900/40 transition hover:bg-blue-400 hover:shadow-blue-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get Started
            </a>
          </div>
        </div>

        {/* ── Right: resume dashboard mockup ── */}
        <div className="opacity-0-start animate-fade-in-right animate-delay-600 flex justify-center lg:justify-end">
          <HeroResumeMockup />
        </div>
      </div>
    </section>
  );
}

export default Hero;
