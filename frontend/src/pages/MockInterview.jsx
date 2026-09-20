// src/pages/MockInterview.jsx
//
// Orchestrator page only — question generation lives in
// utils/mock-interview/questionGenerator.js, answer scoring in
// answerEvaluator.js, report aggregation in reportBuilder.js, and report
// presentation in components/mock-interview/InterviewReport.jsx.
//
// Every saved resume gets its own, separate interview: the selected
// resume's formData is the only input to extractProfile() /
// generateQuestions(), so a different resume always produces different
// questions (see CORE FLOW / MULTIPLE RESUME ISOLATION in the spec this
// module was built from).
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Loader2, ChevronRight, FileText, Briefcase, Code2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useSavedResumes } from "../hooks/useSavedResumes";
import { interviewAPI } from "../utils/api";
import { extractProfile } from "../utils/career-guidance/profileExtractor";
import { generateQuestions, CATEGORY_LABELS } from "../utils/mock-interview/questionGenerator";
import { evaluateAnswer } from "../utils/mock-interview/answerEvaluator";
import { buildReport } from "../utils/mock-interview/reportBuilder";
import InterviewReport from "../components/mock-interview/InterviewReport";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const QUESTION_COUNTS = [5, 10, 15];

function sessionToReport(session) {
  return {
    resumeTitle: session.resumeTitleSnapshot,
    difficulty: session.difficulty,
    questionCount: session.questionCount,
    finalScore: session.finalScore ?? 0,
    areaScores: session.areaScores || {},
    strongAreas: session.strongAreas || [],
    areasToImprove: session.areasToImprove || [],
    preparationSuggestions: session.preparationSuggestions?.length
      ? session.preparationSuggestions
      : ["No suggestions recorded for this interview."],
    questionsToPracticeAgain: (session.items || [])
      .filter((it) => it.evaluation && it.evaluation.verdict !== "good")
      .map((it) => ({
        id: it.question.id,
        category: it.question.category,
        categoryLabel: CATEGORY_LABELS[it.question.category] || it.question.category,
        text: it.question.text,
        feedback: it.evaluation.feedback,
      })),
  };
}

export default function MockInterview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Mock Interview always needs the saved-resume list (there is no
  // localStorage/single-resume fallback here — every interview must be
  // tied to one specific saved resume, per the spec).
  const { resumes, loading: resumesLoading } = useSavedResumes(true);

  const [step, setStep] = useState("select"); // select | setup | interview | report
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState(10);

  const [session, setSession] = useState(null); // { id, items: [{question, answerText, evaluation}] }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerDraft, setAnswerDraft] = useState("");
  const [submittedThisQuestion, setSubmittedThisQuestion] = useState(false);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [finishing, setFinishing] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [viewedReport, setViewedReport] = useState(null); // when opened via /mock-interview/:sessionId or "View Report"

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) || null;
  const profile = useMemo(
    () => (selectedResume ? extractProfile(selectedResume.formData) : null),
    [selectedResume]
  );

  // Load interview history for the "Previous Interviews" list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await interviewAPI.getAll();
        if (!cancelled) setHistory(data?.sessions || []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Direct link to a single report: /mock-interview/:sessionId
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await interviewAPI.getById(sessionId);
        if (!cancelled && data?.session) {
          setViewedReport(sessionToReport(data.session));
          setStep("report");
        }
      } catch {
        if (!cancelled) navigate("/mock-interview", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  function handleSelectResume(id) {
    setSelectedResumeId(id);
    setStartError("");
    setStep("setup");
  }

  async function handleStartInterview() {
    if (!profile || !selectedResume) return;
    setStarting(true);
    setStartError("");
    try {
      const questions = generateQuestions(profile, { difficulty, count: questionCount });
      if (questions.length === 0) {
        setStartError(
          "This resume doesn't have enough detail yet to generate an interview. Add some skills, projects, or experience in Resume Builder first."
        );
        setStarting(false);
        return;
      }

      const items = questions.map((q) => ({
        question: q,
        answerText: "",
        evaluation: null,
        answeredAt: null,
      }));

      const data = await interviewAPI.create({
        resumeId: selectedResume.id,
        difficulty,
        questionCount: questions.length,
        items,
      });

      setSession({ id: data.session.id, items });
      setCurrentIndex(0);
      setAnswerDraft("");
      setSubmittedThisQuestion(false);
      setStep("interview");
    } catch (err) {
      setStartError(err.message || "Could not start the interview. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function handleSubmitAnswer() {
    const currentItem = session.items[currentIndex];
    const evaluation = evaluateAnswer(currentItem.question, answerDraft);
    const updatedItems = session.items.map((it, i) =>
      i === currentIndex ? { ...it, answerText: answerDraft, evaluation, answeredAt: new Date().toISOString() } : it
    );
    setSession({ ...session, items: updatedItems });
    setSubmittedThisQuestion(true);
  }

  async function handleNextQuestion() {
    const isLast = currentIndex === session.items.length - 1;
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      setAnswerDraft("");
      setSubmittedThisQuestion(false);
      return;
    }

    // Last question — finalize the interview.
    setFinishing(true);
    try {
      const reportData = buildReport(session.items);
      await interviewAPI.update(session.id, {
        items: session.items,
        status: "completed",
        finalScore: reportData.finalScore,
        areaScores: reportData.areaScores,
        strongAreas: reportData.strongAreas,
        areasToImprove: reportData.areasToImprove,
        preparationSuggestions: reportData.preparationSuggestions,
      });
      setViewedReport({
        resumeTitle: selectedResume.title,
        difficulty,
        questionCount: session.items.length,
        ...reportData,
      });
      setStep("report");
      // Refresh history in the background so it's up to date if they go back.
      interviewAPI.getAll().then((d) => setHistory(d?.sessions || [])).catch(() => {});
    } catch (err) {
      setStartError(err.message || "Could not save your results. Please try again.");
    } finally {
      setFinishing(false);
    }
  }

  function resetToSelect() {
    setStep("select");
    setSelectedResumeId(null);
    setSession(null);
    setViewedReport(null);
    setStartError("");
    if (sessionId) navigate("/mock-interview");
  }

  async function handleViewHistoryReport(id) {
    try {
      const data = await interviewAPI.getById(id);
      setViewedReport(sessionToReport(data.session));
      setStep("report");
    } catch {
      // silently ignore — history list stays as-is
    }
  }

  // ---------- RENDER ----------

  if (step === "report") {
    return (
      <DashboardLayout>
        <InterviewReport report={viewedReport} onBackToMockInterview={resetToSelect} onRetake={resetToSelect} />
      </DashboardLayout>
    );
  }

  if (step === "interview" && session) {
    const currentItem = session.items[currentIndex];
    const isLast = currentIndex === session.items.length - 1;
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" /> Mock Interview
            </h1>
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {session.items.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Resume: {selectedResume?.title}</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2.5 py-1 mb-3">
              {CATEGORY_LABELS[currentItem.question.category] || currentItem.question.category}
            </span>
            <p className="text-lg font-medium text-gray-900 mb-4">{currentItem.question.text}</p>

            <textarea
              value={submittedThisQuestion ? currentItem.answerText : answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              disabled={submittedThisQuestion}
              rows={7}
              placeholder="Type your answer here..."
              className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
            />

            {!submittedThisQuestion ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!answerDraft.trim()}
                className="mt-4 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <div className="mt-4">
                <div
                  className={`rounded-xl p-4 text-sm mb-4 ${
                    currentItem.evaluation.verdict === "good"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : currentItem.evaluation.verdict === "needs-improvement"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <p className="font-semibold mb-1 capitalize">
                    {currentItem.evaluation.verdict.replace("-", " ")} · Score {currentItem.evaluation.score}/100
                  </p>
                  <p>{currentItem.evaluation.feedback}</p>
                </div>
                <button
                  onClick={handleNextQuestion}
                  disabled={finishing}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {finishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLast ? (
                    "Finish Interview"
                  ) : (
                    <>
                      Next Question <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === "setup" && selectedResume && profile) {
    const previewQuestions = generateQuestions(profile, { difficulty, count: questionCount });
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Mic className="w-5 h-5 text-blue-600" /> Interview Setup
          </h1>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Selected Resume</p>
            <p className="text-lg font-semibold text-gray-900 mb-4">{selectedResume.title}</p>

            {profile.explicitSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Code2 className="w-3.5 h-3.5" /> Detected Skills</p>
                <p className="text-sm text-gray-800">{profile.explicitSkills.map((s) => s.raw).join(" • ")}</p>
              </div>
            )}
            {profile.projects.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Projects</p>
                <p className="text-sm text-gray-800">{profile.projects.map((p) => p.title).join(", ")}</p>
              </div>
            )}
            {(profile.workExperience.length > 0 || profile.internships.length > 0) && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Experience</p>
                <p className="text-sm text-gray-800">
                  {[...profile.workExperience.map((w) => `${w.jobTitle} at ${w.company}`), ...profile.internships.map((i) => `${i.position} at ${i.company}`)].join(", ")}
                </p>
              </div>
            )}
            {profile.isEmpty && (
              <p className="text-sm text-amber-600">This resume doesn't have much detail yet — add skills or projects for a richer interview.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">Interview Difficulty</p>
            <div className="flex gap-2 mb-5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 capitalize px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    difficulty === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-900 mb-2">Number of Questions</p>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    questionCount === n
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {previewQuestions.length < questionCount
                ? `This resume currently supports ${previewQuestions.length} distinct question${previewQuestions.length === 1 ? "" : "s"} at this setting.`
                : `${previewQuestions.length} questions will be generated from this resume.`}
            </p>
          </div>

          {startError && <p className="text-sm text-red-600 mb-4">{startError}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleStartInterview}
              disabled={starting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {starting && <Loader2 className="w-4 h-4 animate-spin" />}
              Start Mock Interview
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // step === "select"
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Mic className="w-6 h-6 text-blue-600" /> Mock Interview
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Pick one of your saved resumes — the interview questions are generated entirely from that resume's own content.
        </p>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Resumes</h2>
        {resumesLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your resumes...
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center mb-8">
            <p className="text-sm text-gray-600 mb-3">You don't have any saved resumes yet.</p>
            <a href="/resume-builder" className="text-blue-600 text-sm font-semibold hover:underline">
              Create one in Resume Builder →
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {resumes.map((resume) => {
              const p = extractProfile(resume.formData);
              return (
                <button
                  key={resume.id}
                  onClick={() => handleSelectResume(resume.id)}
                  className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 hover:shadow-md transition"
                >
                  <p className="font-semibold text-gray-900 mb-2">{resume.title}</p>
                  {p.explicitSkills.length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      Skills: {p.explicitSkills.slice(0, 4).map((s) => s.raw).join(", ")}
                    </p>
                  )}
                  {p.projects.length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      Projects: {p.projects.slice(0, 2).map((pr) => pr.title).join(", ")}
                    </p>
                  )}
                  {(p.workExperience.length > 0 || p.internships.length > 0) && (
                    <p className="text-xs text-gray-500">
                      Experience: {(p.workExperience[0]?.jobTitle || p.internships[0]?.position) || "—"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-700 mb-3">Previous Interviews</h2>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">No interviews yet — start one above.</p>
        ) : (
          <div className="space-y-3">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.resumeTitleSnapshot}</p>
                  <p className="text-xs text-gray-500">
                    Resume-Based Interview · {s.questionCount} Questions
                    {s.status === "completed" ? ` · Score: ${s.finalScore}%` : " · In progress"} ·{" "}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {s.status === "completed" && (
                  <button
                    onClick={() => handleViewHistoryReport(s.id)}
                    className="text-sm font-semibold text-blue-600 hover:underline shrink-0 ml-3"
                  >
                    View Report
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
