// src/components/ats/CareerFitResults.jsx
import ScoreGauge from "./ScoreGauge";
import ScoreBreakdownList from "./ScoreBreakdownList";
import SkillPillList from "./SkillPillList";
import ResumeQualityPanel from "./ResumeQualityPanel";
import { buildCareerFitSuggestions } from "../../utils/ats/suggestionEngine";
import { Lightbulb, Award } from "lucide-react";

const IMPACT_STYLES = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-gray-100 text-gray-600",
};

function fitColor(score) {
  if (score >= 75) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function RoleCard({ role }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-800">{role.title}</h4>
        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${fitColor(role.fitScore)}`}>
          {role.fitScore}% Fit
        </span>
      </div>

      {role.whyItMatches.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-1.5">Why it matches</h5>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            {role.whyItMatches.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkillPillList title="Strong Skills" skills={role.matchedSkills} variant="matched" emptyText="No matched skills." />
        <SkillPillList
          title="Skill Gaps"
          skills={[...role.missingRequired, ...role.missingImportant]}
          variant="missingRequired"
          emptyText="No notable gaps detected."
        />
      </div>
    </div>
  );
}

export default function CareerFitResults({ result }) {
  const suggestions = buildCareerFitSuggestions(result);

  return (
    <div className="space-y-8">
      <div className="border border-gray-200 rounded-2xl bg-white shadow-md p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <ScoreGauge score={result.overallScore} label="General ATS Resume Score" />
          <div className="flex-1 w-full">
            {result.scoreSummary && (
              <p className="text-gray-700 font-medium mb-4">{result.scoreSummary}</p>
            )}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Score Breakdown</h3>
            <ScoreBreakdownList items={result.breakdown} />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl bg-white shadow-md p-8">
        <h3 className="text-2xl font-bold text-blue-600 mb-2">Career Fit Suggestions</h3>
        <p className="text-gray-600 mb-6">
          No job description was provided, so roles below are suggested based on the skills, projects, and experience found on your resume — not a guarantee of qualification for any specific job.
        </p>

        {result.hasAnyEvidence ? (
          <div className="space-y-5">
            {result.roles.map((role) => <RoleCard key={role.id} role={role} />)}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
            <Award className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            Not enough evidence was found to confidently suggest specific roles yet. Try adding more skills, or describing your projects with the technologies you used.
          </div>
        )}
      </div>

      <ResumeQualityPanel
        structure={result.structure}
        atsCompatibility={result.atsCompatibility}
        writingQuality={result.writingQuality}
        achievements={result.achievements}
      />

      <div className="border border-blue-200 rounded-xl bg-blue-50 p-6">
        <h4 className="flex items-center gap-2 font-bold text-blue-700 mb-3">
          <Lightbulb className="w-5 h-5" /> Recommended Improvements
        </h4>
        <ul className="space-y-2.5 text-sm text-blue-900">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              {s.impact && (
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${IMPACT_STYLES[s.impact] || IMPACT_STYLES.LOW}`}>
                  {s.impact}
                </span>
              )}
              <span>{s.text || s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
