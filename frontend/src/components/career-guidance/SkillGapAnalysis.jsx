// src/components/career-guidance/SkillGapAnalysis.jsx
import { CheckCircle2, Circle } from "lucide-react";

export default function SkillGapAnalysis({ matchedSkills, missingSkills }) {
  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-5">Skill Gap Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Already Have</h4>
          {matchedSkills.length > 0 ? (
            <ul className="space-y-2">
              {matchedSkills.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">No matching skills found yet.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Need to Learn</h4>
          {missingSkills.highPriority.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">High Priority</p>
              <ul className="space-y-2">
                {missingSkills.highPriority.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <Circle className="w-4 h-4 text-red-400 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {missingSkills.mediumPriority.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Medium Priority</p>
              <ul className="space-y-2">
                {missingSkills.mediumPriority.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <Circle className="w-4 h-4 text-amber-400 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {missingSkills.highPriority.length === 0 && missingSkills.mediumPriority.length === 0 && (
            <p className="text-sm text-gray-400 italic">No major gaps found — you're well aligned with this role.</p>
          )}
        </div>
      </div>
    </div>
  );
}
