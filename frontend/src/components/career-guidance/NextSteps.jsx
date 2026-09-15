// src/components/career-guidance/NextSteps.jsx
export default function NextSteps({ steps }) {
  return (
    <div className="border border-cyan-200 rounded-2xl bg-cyan-50 p-6 md:p-8">
      <h3 className="text-xl font-bold text-cyan-800 mb-4">Your Next Steps</h3>
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-cyan-900">
            <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
