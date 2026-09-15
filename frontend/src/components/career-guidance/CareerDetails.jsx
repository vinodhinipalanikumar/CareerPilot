// src/components/career-guidance/CareerDetails.jsx
import ScoreGauge from "../ats/ScoreGauge";
import SkillGapAnalysis from "./SkillGapAnalysis";
import LearningRoadmap from "./LearningRoadmap";
import RecommendedProjects from "./RecommendedProjects";
import InterviewFocus from "./InterviewFocus";
import NextSteps from "./NextSteps";
import { ArrowLeft } from "lucide-react";

export default function CareerDetails({ matchResult, roadmap, onBack }) {
  const { role, matchPercent, reasons, matchedSkills, missingSkills } = matchResult;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-cyan-700 hover:text-cyan-900 font-semibold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to recommendations
      </button>

      <div className="border border-gray-200 rounded-2xl bg-white shadow-md p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <ScoreGauge score={matchPercent} label="Match" size={140} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{role.title}</h2>
            <p className="text-gray-600 mb-4">{role.description}</p>

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Why this career matches you</h4>
            <ul className="space-y-1.5 list-disc list-inside mb-2">
              {reasons.map((r, i) => (
                <li key={i} className="text-sm text-gray-600">{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-3">Typical Responsibilities</h4>
          <ul className="space-y-1.5 list-disc list-inside">
            {role.responsibilities.map((r) => (
              <li key={r} className="text-sm text-gray-600">{r}</li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-3">Tools & Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {role.tools.map((t) => (
              <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                {t}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">{role.futureGrowth}</p>
        </div>
      </div>

      <SkillGapAnalysis matchedSkills={matchedSkills} missingSkills={missingSkills} />
      <LearningRoadmap phases={roadmap.phases} />
      <RecommendedProjects projects={roadmap.recommendedProjects} />
      <InterviewFocus interviewTopics={role.interviewTopics} />
      <NextSteps steps={roadmap.nextSteps} />
    </div>
  );
}
