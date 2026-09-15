// src/components/ats/JobMatchResults.jsx
import ScoreGauge from "./ScoreGauge";
import ScoreBreakdownList from "./ScoreBreakdownList";
import SkillPillList from "./SkillPillList";
import ResumeQualityPanel from "./ResumeQualityPanel";
import { buildJobMatchSuggestions } from "../../utils/ats/suggestionEngine";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

const IMPACT_STYLES = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-gray-100 text-gray-600",
};

export default function JobMatchResults({ result }) {
  const suggestions = buildJobMatchSuggestions(result);
  const strongAreas = result.breakdown.filter((b) => b.score !== null && b.score >= 75);
  const weakAreas = result.breakdown.filter((b) => b.score !== null && b.score < 50);
  const achievementsItem = result.breakdown.find((b) => b.key === "achievements");
  const atsItem = result.breakdown.find((b) => b.key === "atsCompatibility");
  const structureItem = result.breakdown.find((b) => b.key === "structure");

  return (
    <div className="space-y-8">
      <div className="border border-gray-200 rounded-2xl bg-white shadow-md p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <ScoreGauge score={result.overallScore} label="Job Match Score" />
          <div className="flex-1 w-full">
            {result.scoreSummary && (
              <p className="text-gray-700 font-medium mb-4">{result.scoreSummary}</p>
            )}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Score Breakdown</h3>
            <ScoreBreakdownList items={result.breakdown} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 space-y-5">
          <SkillPillList title="Matched Required Skills" skills={result.matchedRequired} variant="matched" emptyText="No required skills were matched." />
          <SkillPillList title="Missing Required Skills" skills={result.missingRequired} variant="missingRequired" emptyText="None — all required skills were found." />
        </div>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 space-y-5">
          <SkillPillList title="Matched Preferred Skills" skills={result.matchedPreferred} variant="matched" emptyText="No preferred skills were matched." />
          <SkillPillList title="Missing Preferred Skills" skills={result.missingPreferred} variant="missingPreferred" emptyText="None — all preferred skills were found." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-green-200 rounded-xl bg-green-50 p-6">
          <h4 className="flex items-center gap-2 font-bold text-green-700 mb-3">
            <TrendingUp className="w-5 h-5" /> Strong Areas
          </h4>
          {strongAreas.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-green-800 list-disc list-inside">
              {strongAreas.map((b) => <li key={b.key}>{b.label} ({b.score}/100)</li>)}
            </ul>
          ) : (
            <p className="text-sm text-green-800/70 italic">No category currently scores 75+.</p>
          )}
        </div>
        <div className="border border-red-200 rounded-xl bg-red-50 p-6">
          <h4 className="flex items-center gap-2 font-bold text-red-700 mb-3">
            <TrendingDown className="w-5 h-5" /> Areas to Improve
          </h4>
          {weakAreas.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-red-800 list-disc list-inside">
              {weakAreas.map((b) => <li key={b.key}>{b.label} ({b.score}/100)</li>)}
            </ul>
          ) : (
            <p className="text-sm text-red-800/70 italic">No category currently scores below 50.</p>
          )}
        </div>
      </div>

      <ResumeQualityPanel
        structure={{ score: structureItem?.score ?? null, observations: result.structureObservations }}
        atsCompatibility={{ score: atsItem?.score ?? null, observations: result.atsCompatibilityObservations }}
        writingQuality={result.writingQuality}
        achievements={{ score: achievementsItem?.score ?? null, reasons: [] }}
      />

      <div className="border border-blue-200 rounded-xl bg-blue-50 p-6">
        <h4 className="flex items-center gap-2 font-bold text-blue-700 mb-3">
          <Lightbulb className="w-5 h-5" /> Resume Improvement Suggestions
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
