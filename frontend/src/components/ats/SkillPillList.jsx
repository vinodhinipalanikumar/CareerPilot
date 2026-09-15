// src/components/ats/SkillPillList.jsx
const VARIANTS = {
  matched: "bg-green-50 text-green-700 border border-green-200",
  missingRequired: "bg-red-50 text-red-700 border border-red-200",
  missingPreferred: "bg-amber-50 text-amber-700 border border-amber-200",
  neutral: "bg-gray-50 text-gray-700 border border-gray-200",
};

export default function SkillPillList({ title, skills, variant = "neutral", emptyText }) {
  if (!skills || skills.length === 0) {
    if (!emptyText) return null;
    return (
      <div>
        {title && <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>}
        <p className="text-sm text-gray-400 italic">{emptyText}</p>
      </div>
    );
  }
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className={`text-xs font-medium px-2.5 py-1 rounded-full ${VARIANTS[variant]}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}