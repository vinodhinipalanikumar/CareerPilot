// SavedResumePicker.jsx
// Small "Choose Resume" radio list shown when a user has more than one
// saved resume, so ATS Analysis / Career Guidance can analyze a specific
// one instead of always using whichever was last edited.
export default function SavedResumePicker({ resumes, selectedId, onSelect }) {
  if (!resumes || resumes.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-sm font-semibold text-gray-700 mb-2">Choose Resume</p>
      <div className="space-y-2">
        {resumes.map((resume) => (
          <label
            key={resume.id}
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              type="radio"
              name="saved-resume"
              checked={selectedId === resume.id}
              onChange={() => onSelect(resume.id)}
              className="text-blue-600 focus:ring-blue-400"
            />
            {resume.title || "My Resume"}
          </label>
        ))}
      </div>
    </div>
  );
}
