// src/components/ats/ScoreGauge.jsx
function scoreColor(score) {
  if (score >= 75) return { ring: "#16a34a", text: "text-green-600", bg: "bg-green-50" };
  if (score >= 50) return { ring: "#d97706", text: "text-amber-600", bg: "bg-amber-50" };
  return { ring: "#dc2626", text: "text-red-600", bg: "bg-red-50" };
}

export default function ScoreGauge({ score, label, size = 160 }) {
  const { ring, text, bg } = scoreColor(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-full ${bg}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={ring} strokeWidth="12" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${text}`}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      {label && <p className="mt-3 font-semibold text-gray-800 text-center">{label}</p>}
    </div>
  );
}