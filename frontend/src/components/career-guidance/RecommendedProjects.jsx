// src/components/career-guidance/RecommendedProjects.jsx
import { FolderGit2 } from "lucide-react";

export default function RecommendedProjects({ projects }) {
  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-1">Recommended Projects</h3>
      <p className="text-sm text-gray-500 mb-5">Projects picked to close your specific skill gaps for this role.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div key={project.title} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <FolderGit2 className="w-4 h-4 text-cyan-600" />
              <h4 className="font-semibold text-gray-800">{project.title}</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.skillsDisplay.map((s) => (
                <span key={s} className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600">{project.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
