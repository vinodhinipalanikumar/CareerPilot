// src/utils/ats/formDataAdapter.js
//
// Converts ResumeBuilder's `formData` state — the exact object the user has
// been filling in on /resume-builder (see src/data/resumeFormConfig.js for
// the section/field definitions) — directly into the canonical resume shape
// documented in resumeNormalizer.js. No file, no re-upload: this is the seam
// that lets "Use CareerPilot Resume" work straight off in-memory form state.
//
// ResumeBuilder's section keys and field names already match the canonical
// shape 1:1 (by design), so this is mostly a defensive pass-through: it just
// guarantees every expected array/object exists, even for sections the user
// never touched (repeatable sections default to `[]`, see
// ResumeBuilder's buildInitialState — but we don't rely on that; a resume
// coming from persisted storage could in principle be a partial/older shape).

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export function fromCareerPilotFormData(formData) {
  const data = obj(formData);

  return {
    personalInfo: obj(data.personalInfo),
    education: arr(data.education),
    skills: arr(data.skills),
    projects: arr(data.projects),
    workExperience: arr(data.workExperience),
    internships: arr(data.internships),
    certifications: arr(data.certifications),
    achievements: arr(data.achievements),
    awards: arr(data.awards),
    publications: arr(data.publications),
    research: arr(data.research),
    volunteerWork: arr(data.volunteerWork),
    workshops: arr(data.workshops),
    conferences: arr(data.conferences),
    interests: arr(data.interests),
    references: arr(data.references),
    meta: { source: "careerpilot" },
  };
}
