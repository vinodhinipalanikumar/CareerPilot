// src/components/ats/ResumeQualityPanel.jsx
import { ShieldCheck, PenLine, ListChecks, Award } from "lucide-react";

function MiniGauge({ score, label, icon: Icon }) {
  const color = score === null ? "text-gray-400" : score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 bg-white">
      <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{score === null ? "N/A" : `${score}/100`}</p>
      </div>
    </div>
  );
}

export default function ResumeQualityPanel({ structure, atsCompatibility, writingQuality, achievements }) {
  const gauges = [
    { key: "structure", score: structure?.score ?? null, label: "Resume Structure", icon: ListChecks, observations: structure?.observations },
    { key: "ats", score: atsCompatibility?.score ?? null, label: "ATS Compatibility", icon: ShieldCheck, observations: atsCompatibility?.observations },
    {
      key: "writing",
      score: writingQuality?.applicable ? writingQuality.score : null,
      label: "Writing Quality",
      icon: PenLine,
      observations: writingQuality?.applicable ? writingQuality.observations : [],
    },
    { key: "achievements", score: achievements?.score ?? null, label: "Achievements", icon: Award, observations: achievements?.reasons },
  ].filter((g) => g.score !== null || g.observations?.length);

  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Resume Quality</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {gauges.map((g) => (
          <MiniGauge key={g.key} score={g.score} label={g.label} icon={g.icon} />
        ))}
      </div>

      <div className="space-y-2">
        {gauges.flatMap((g) =>
          (g.observations || []).map((obs, i) => (
            <p key={`${g.key}-${i}`} className="text-sm text-gray-600 flex gap-2">
              <span className="text-blue-500">•</span> {obs}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
