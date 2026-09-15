// resumeFormatters.js
// Pure data-derivation helpers shared across every resume template.
// No JSX here — templates each decide how to *display* this data,
// but they all derive it the same way, from the same formData shape
// produced by ResumeBuilder.jsx / resumeFormConfig.js.

export function formatDuration(duration) {
  if (!duration) return "";
  const start = [duration.startMonth, duration.startYear].filter(Boolean).join(" ");
  const end = duration.current
    ? "Present"
    : [duration.endMonth, duration.endYear].filter(Boolean).join(" ");
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}

// Contact lines: phone, email, linkedin, github, portfolio/website, then location.
export function getContactLines(personalInfo = {}) {
  const lines = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio || personalInfo.website,
  ].filter(Boolean);

  const locationLine = [personalInfo.city, personalInfo.state, personalInfo.country]
    .filter(Boolean)
    .join(", ");
  if (locationLine) lines.push(locationLine);

  return lines;
}

// Groups the flat `skills` array into { category: ["Name (Proficiency)", ...] }
export function groupSkillsByCategory(skills = []) {
  const byCategory = {};
  skills.forEach((s) => {
    if (!s.skillName) return;
    const cat = s.category || "Other Skills";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s.proficiency ? `${s.skillName} (${s.proficiency})` : s.skillName);
  });
  return byCategory;
}

export function getLanguageSkills(skills = []) {
  return skills
    .filter((s) => s.category === "Languages Known")
    .map((s) => (s.proficiency ? `${s.skillName} (${s.proficiency})` : s.skillName));
}

export function getInterestNames(interests = []) {
  return interests.map((i) => i.interestName).filter(Boolean);
}

// Mappers for the sections that don't have a distinct visual treatment
// (Achievements, Awards, Publications, Research, Volunteer Work, Workshops,
// Conferences, References) — every template renders these the same
// generic { heading, subheading, dateText, bullets } shape.
export const genericSectionMappers = {
  achievements: (list = []) =>
    list.map((e) => ({ heading: e.title, subheading: e.organization, dateText: e.date, bullets: [e.description] })),
  awards: (list = []) =>
    list.map((e) => ({ heading: e.name, subheading: e.organization, dateText: e.date, bullets: [e.description] })),
  publications: (list = []) =>
    list.map((e) => ({
      heading: e.title,
      subheading: [e.publisher, e.authors].filter(Boolean).join(" · "),
      dateText: e.date,
      bullets: [e.doi && `DOI: ${e.doi}`, e.url && `URL: ${e.url}`, e.description],
    })),
  research: (list = []) =>
    list.map((e) => ({
      heading: e.title,
      subheading: [e.organization, e.supervisor && `Supervisor: ${e.supervisor}`].filter(Boolean).join(" · "),
      dateText: formatDuration(e.duration),
      bullets: [e.description, e.url && `URL: ${e.url}`],
    })),
  volunteerWork: (list = []) =>
    list.map((e) => ({
      heading: e.organization,
      subheading: e.role,
      dateText: formatDuration(e.duration),
      bullets: [e.description],
    })),
  workshops: (list = []) =>
    list.map((e) => ({
      heading: e.name,
      subheading: e.organizer,
      dateText: e.date,
      bullets: [e.certificateReceived && "Certificate Received", e.description],
    })),
  conferences: (list = []) =>
    list.map((e) => ({
      heading: e.name,
      subheading: e.organizer,
      dateText: e.date,
      bullets: [e.paperPresented && `Paper Presented${e.paperTitle ? `: ${e.paperTitle}` : ""}`, e.description],
    })),
  references: (list = []) =>
    list.map((e) => ({
      heading: e.fullName,
      subheading: [e.designation, e.company].filter(Boolean).join(", "),
      bullets: [e.email, e.phone],
    })),
};

export const GENERIC_SECTIONS = [
  ["achievements", "Achievements"],
  ["awards", "Awards"],
  ["publications", "Publications"],
  ["research", "Research"],
  ["volunteerWork", "Volunteer Work"],
  ["workshops", "Workshops"],
  ["conferences", "Conferences"],
];
