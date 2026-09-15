// src/components/ats/ScoreBreakdownList.jsx
function barColor(score) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function ScoreBreakdownList({ items }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.key || item.label}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-semibold text-gray-800">
              {item.label}
              <span className="ml-2 text-xs font-normal text-gray-400">({item.weightPct}% weight)</span>
            </span>
            <span className="font-semibold text-gray-700">
              {item.score === null ? "N/A" : `${item.score}/100`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.score === null ? "bg-gray-300" : barColor(item.score)}`}
              style={{ width: `${item.score === null ? 0 : item.score}%` }}
            />
          </div>
          {item.reason && <p className="text-sm text-gray-500 mt-1.5">{item.reason}</p>}
        </div>
      ))}
    </div>
  );
}