// src/components/jobs/JobResultCard.jsx
//
// Renders ONE normalized job object (see backend/services/*Service.js for
// the shared shape). Every field is optional except title/company/location,
// since different providers surface different data — we never invent a
// value the provider didn't supply.
import { Building2, MapPin, Clock, ExternalLink, CheckCircle2, Tag } from "lucide-react";
import SkillPillList from "../ats/SkillPillList";

function scoreStyle(score) {
  if (score >= 75) return { ring: "border-green-300", badge: "bg-green-100 text-green-700" };
  if (score >= 50) return { ring: "border-amber-300", badge: "bg-amber-100 text-amber-700" };
  return { ring: "border-gray-200", badge: "bg-gray-100 text-gray-600" };
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export default function JobResultCard({ job }) {
  const { ring, badge } = scoreStyle(job.matchScore ?? 0);
  const posted = timeAgo(job.postedDate);
  const sources = job.sources && job.sources.length > 0 ? job.sources : [job.source].filter(Boolean);

  return (
    <div className={`bg-white rounded-xl border-2 ${ring} shadow-sm p-6 flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{job.title || "Untitled role"}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
            {job.company && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" /> {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
              </span>
            )}
          </div>
        </div>
        {typeof job.matchScore === "number" && (
          <div className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold ${badge}`}>
            Match: {job.matchScore}%
          </div>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{job.description}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <SkillPillList title="Matched Skills" skills={job.matchedSkills} variant="matched" emptyText="No direct skill matches found." />
        <SkillPillList title="Missing / Not Found" skills={job.missingSkills} variant="missingPreferred" emptyText="No obvious skill gaps detected." />
      </div>

      {job.reasons && job.reasons.length > 0 && (
        <ul className="text-xs text-gray-500 space-y-1">
          {job.reasons.slice(0, 3).map((reason, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 flex-wrap">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {job.salary && <span className="font-medium text-gray-700">{job.salary}</span>}
          {job.employmentType && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {job.employmentType}
            </span>
          )}
          {posted && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {posted}
            </span>
          )}
          <span className="text-gray-400">Source: {sources.join(", ")}</span>
        </div>

        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            Apply Now <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 italic">No application link provided</span>
        )}
      </div>
    </div>
  );
}
