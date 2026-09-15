// ResumeTemplates.jsx
// Template picker shown in Resume Preview's left panel. Purely presentational —
// it receives the current selection and a callback, it does not own any
// resume data itself. Selecting a template never touches formData.

import { templateRegistry } from "../data/templateRegistry";
import { SAMPLE_RESUME_DATA } from "../data/sampleResumeData";
import TemplateThumbnail from "./resume-templates/TemplateThumbnail";

export default function ResumeTemplates({ selectedTemplateId, onSelect }) {
  return (
    <div className="space-y-3">
      {templateRegistry.map((template) => {
        const isSelected = template.id === selectedTemplateId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`w-full text-left border rounded-xl p-3 transition-colors ${
              isSelected
                ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 bg-white"
            }`}
          >
            <TemplateThumbnail
              TemplateComponent={template.component}
              formData={SAMPLE_RESUME_DATA}
              font="Arial"
            />

            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">{template.name}</p>
                <p className="text-xs text-gray-500">{template.category}</p>
              </div>
              {isSelected && (
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>

            {template.atsFriendly && (
              <span className="inline-block mt-2 text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                ATS Friendly
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
