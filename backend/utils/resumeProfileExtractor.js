// backend/utils/resumeProfileExtractor.js
//
// Turns a resume into the flat profile the Job Recommendations pipeline
// needs: { skills, jobTitles, projectTitles, educationText, location,
// experienceLevel, targetRoles }.
//
// IMPORTANT — this works on ONE shape only: the canonical CareerPilot resume
// shape (personalInfo / education / skills / projects / workExperience /
// internships / certifications / achievements), the exact same shape as:
//   - a saved Resume document's `formData` field (backend/models/Resume.js), and
//   - the object the frontend's EXISTING ATS parser (resumeParser.js /
//     formDataAdapter.js) already produces for an uploaded PDF/DOCX.
// This is why the frontend sends that already-normalized object for uploads
// instead of the raw file — the file-parsing itself (pdf.js/mammoth) is
// browser-only and already implemented there; duplicating it in Node would
// violate "do not rebuild existing systems". Both resume sources therefore
// funnel through this ONE backend extraction function.

const { ROLE_RULES } = require("../data/roleRules");
const { scanTextForSkills, canonicalizeSkill } = require("../data/skillVocabulary");

function arr(v) {
  return Array.isArray(v) ? v : [];
}
function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

function extractJobProfile(resume) {
  const data = resume && typeof resume === "object" ? resume : {};
  const personalInfo = data.personalInfo && typeof data.personalInfo === "object" ? data.personalInfo : {};

  // --- Skills: explicit Skills-section entries + anything scanned out of
  // project/experience free text (covers a skill used in a project but never
  // separately listed). ---
  // ROOT CAUSE FIX: explicit Skills-section entries used to go into the
  // profile as a raw lowercased string ("react.js", "mongo", "node") while
  // everything scanned out of project/experience text (scanTextForSkills)
  // was already canonical ("react", "mongodb", "node.js") — so the exact
  // same skill, spelled two different ways, silently failed to match
  // itself against job postings and role rules. Canonicalizing here puts
  // both sources on the same footing. Skills the vocabulary doesn't
  // recognize are kept as-is (never dropped) so they still count for
  // matching purposes.
  const skillSet = new Set();
  arr(data.skills).forEach((s) => {
    const name = str(s?.skillName);
    if (name) skillSet.add(canonicalizeSkill(name));
  });

  const projectTitles = [];
  arr(data.projects).forEach((p) => {
    if (str(p?.title)) projectTitles.push(str(p.title));
    const text = [p?.technologies, p?.description, p?.keyFeatures, p?.responsibilities].map(str).join(" ");
    scanTextForSkills(text).forEach((s) => skillSet.add(s));
  });

  const jobTitles = [];
  arr(data.workExperience).forEach((w) => {
    if (str(w?.jobTitle)) jobTitles.push(str(w.jobTitle));
    scanTextForSkills([w?.technologies, w?.responsibilities].map(str).join(" ")).forEach((s) => skillSet.add(s));
  });
  arr(data.internships).forEach((i) => {
    if (str(i?.position)) jobTitles.push(str(i.position));
    scanTextForSkills([i?.technologies, i?.responsibilities].map(str).join(" ")).forEach((s) => skillSet.add(s));
  });
  arr(data.certifications).forEach((c) => {
    scanTextForSkills([c?.name, c?.organization].map(str).join(" ")).forEach((s) => skillSet.add(s));
  });

  if (str(personalInfo.professionalTitle)) jobTitles.push(str(personalInfo.professionalTitle));

  // Fall back to the parser's raw text blob (uploads only) so a resume whose
  // sections weren't perfectly detected still contributes skill signal.
  if (str(data.meta?.rawText)) {
    scanTextForSkills(data.meta.rawText).forEach((s) => skillSet.add(s));
  }

  const skills = Array.from(skillSet);

  // --- Education ---
  const educationEntries = arr(data.education);
  const educationText = educationEntries
    .map((e) => [e?.degree, e?.fieldOfStudy, e?.institution].map(str).filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" | ");

  // --- Location: prefer explicit city/state/country from personal info ---
  const location = [personalInfo.city, personalInfo.state, personalInfo.country]
    .map(str)
    .filter(Boolean)
    .join(", ");

  // --- Experience level (used for search filters + match scoring) ---
  const hasWorkExperience = arr(data.workExperience).length > 0;
  const hasInternship = arr(data.internships).length > 0;
  let experienceLevel = "fresher";
  if (hasWorkExperience) experienceLevel = "experienced";
  else if (hasInternship) experienceLevel = "intern";

  // --- Target roles: rule-based, from the skill set above ---
  const lowerSkills = new Set(skills.map((s) => s.toLowerCase()));
  const targetRoles = ROLE_RULES.filter((rule) => {
    const hits = rule.skills.filter((s) => lowerSkills.has(s)).length;
    return hits >= rule.minMatches;
  }).map((rule) => rule.title);

  return {
    skills,
    jobTitles: Array.from(new Set(jobTitles)),
    projectTitles: Array.from(new Set(projectTitles)),
    educationText,
    location,
    experienceLevel,
    targetRoles,
    fullName: str(personalInfo.fullName),
  };
}

module.exports = { extractJobProfile };
