// src/components/career-guidance/CareerCard.jsx
import { ArrowRight } from "lucide-react";
import SkillPillList from "../ats/SkillPillList";

function matchColor(score) {
  if (score >= 75) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export default function CareerCard({ result, onViewPath }) {
  const { role, matchPercent, matchedSkills, missingSkills } = result;
  const skillsToDevelop = [...missingSkills.highPriority, ...missingSkills.mediumPriority];

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-lg font-bold text-gray-800">{role.title}</h4>
        <span className={`shrink-0 text-sm font-bold px-3 py-1 rounded-full border ${matchColor(matchPercent)}`}>
          {matchPercent}% Match
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{role.description}</p>

      <div className="space-y-3 flex-grow">
        <SkillPillList title="Strong matches" skills={matchedSkills.slice(0, 6)} variant="matched" emptyText="No strong matches yet." />
        <SkillPillList title="Skills to develop" skills={skillsToDevelop.slice(0, 5)} variant="missingPreferred" emptyText="No major gaps found." />
      </div>

      <button
        type="button"
        onClick={() => onViewPath(role.id)}
        className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
      >
        View Career Path <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
