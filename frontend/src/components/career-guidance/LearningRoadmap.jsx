// src/components/career-guidance/LearningRoadmap.jsx
import { CheckCircle2, ArrowRightCircle } from "lucide-react";

export default function LearningRoadmap({ phases }) {
  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-1">Your Learning Roadmap</h3>
      <p className="text-sm text-gray-500 mb-6">A practical, ordered plan — work through each phase in sequence.</p>

      <div className="space-y-6">
        {phases.map((phase, idx) => (
          <div key={phase.title} className="relative pl-6">
            {idx !== phases.length - 1 && (
              <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-gray-200" />
            )}
            <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-cyan-500" />
            <h4 className="font-bold text-gray-800">{phase.title}</h4>
            <p className="text-xs text-gray-500 mb-2">{phase.description}</p>
            <ul className="space-y-1.5">
              {phase.items.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm text-gray-700">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <ArrowRightCircle className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <span className={item.done ? "text-gray-500 line-through decoration-gray-300" : ""}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
