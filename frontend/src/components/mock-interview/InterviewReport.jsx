// src/components/mock-interview/InterviewReport.jsx
import { CheckCircle2, AlertTriangle, RotateCcw, BookOpen } from "lucide-react";
import ScoreGauge from "../ats/ScoreGauge";

const AREA_ORDER = [
  ["projectUnderstanding", "Project Understanding"],
  ["technicalSkills", "Technical Skills"],
  ["experience", "Internship/Experience"],
  ["communication", "Communication"],
  ["resumeKnowledge", "Resume Knowledge"],
];

function barColor(score) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function InterviewReport({ report, onBackToMockInterview, onRetake }) {
  if (!report) return null;

  const {
    resumeTitle,
    difficulty,
    questionCount,
    finalScore,
    areaScores,
    strongAreas,
    areasToImprove,
    questionsToPracticeAgain,
    preparationSuggestions,
  } = report;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Interview Completed</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resume: <span className="font-medium text-gray-700">{resumeTitle}</span>
        </p>
        <p className="text-sm text-gray-500">
          Interview Type: Resume-Based Mock Interview · Questions: {questionCount} · Difficulty:{" "}
          <span className="capitalize">{difficulty}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex flex-col items-center">
        <ScoreGauge score={finalScore} label="Overall Practice Score" size={180} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Area</h2>
        <div className="space-y-4">
          {AREA_ORDER.map(([key, label]) => {
            const score = areaScores?.[key];
            if (score === null || score === undefined) {
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-400">Not covered</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100" />
                </div>
              );
            }
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <span className="text-gray-600">{score}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
            <CheckCircle2 className="w-4 h-4" /> Strong Areas
          </h3>
          {strongAreas.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-gray-700 list-disc list-inside">
              {strongAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">None yet — keep practicing.</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-3">
            <AlertTriangle className="w-4 h-4" /> Areas to Improve
          </h3>
          {areasToImprove.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-gray-700 list-disc list-inside">
              {areasToImprove.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Nothing stands out — solid performance.</p>
          )}
        </div>
      </div>

      {questionsToPracticeAgain.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Questions to Practice Again</h3>
          <div className="space-y-3">
            {questionsToPracticeAgain.map((q) => (
              <div key={q.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                  {q.categoryLabel}
                </p>
                <p className="text-sm text-gray-800 font-medium">{q.text}</p>
                <p className="text-xs text-gray-500 mt-1">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <BookOpen className="w-4 h-4 text-blue-600" /> Resume-Based Preparation
        </h3>
        <ul className="space-y-1.5 text-sm text-gray-700 list-disc list-inside">
          {preparationSuggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4" /> Try another resume
        </button>
        <button
          onClick={onBackToMockInterview}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Mock Interview
        </button>
      </div>
    </div>
  );
}
