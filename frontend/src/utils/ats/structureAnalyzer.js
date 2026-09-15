// src/utils/ats/structureAnalyzer.js
//
// Deterministic, rule-based check of resume "structure" — the things a real
// ATS (or a recruiter skimming for 6 seconds) needs present and parseable
// regardless of which job it's being matched against: contact info, a
// summary, and the core sections filled in with enough depth to be useful.
// This is intentionally independent of any job description.

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v : "");

const EMAIL_FORMAT = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function looksLikeValidPhone(raw) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function analyzeStructure(resume) {
  const p = resume.personalInfo || {};
  const observations = [];
  let score = 0;

  // Core contact completeness (20 pts) — name/email/phone are the ones that
  // actually matter for an application to reach the right place.
  const hasName = !!str(p.fullName).trim();
  const email = str(p.email).trim();
  const phone = str(p.phone).trim();
  const hasEmail = !!email;
  const hasPhone = !!phone;
  const contactPoints = [hasName, hasEmail, hasPhone].filter(Boolean).length;
  score += Math.round((contactPoints / 3) * 20);
  if (!hasEmail) observations.push("No email address was found — most ATS platforms require one to file the application.");
  if (!hasPhone) observations.push("No phone number was found on the resume.");

  // Malformed contact values — flagged but not treated as if the field were
  // entirely absent, since something was clearly provided.
  if (hasEmail && !EMAIL_FORMAT.test(email)) {
    score -= 5;
    observations.push("The email address on file doesn't look like a valid email format — double check it's typed correctly.");
  }
  if (hasPhone && !looksLikeValidPhone(phone)) {
    score -= 3;
    observations.push("The phone number on file has an unusual number of digits — double check it's complete and correct.");
  }

  // Location + professional links (10 pts) — useful but should not heavily
  // penalize a resume for omitting them, especially for students.
  const hasLocation = !!(str(p.city).trim() || str(p.state).trim() || str(p.country).trim());
  const hasProfessionalLink = !!(str(p.linkedin).trim() || str(p.github).trim() || str(p.portfolio).trim() || str(p.website).trim());
  score += hasLocation ? 5 : 0;
  score += hasProfessionalLink ? 5 : 0;
  if (!hasLocation) observations.push("No location (city/state/country) was found — optional, but helps recruiters gauge logistics.");
  if (!hasProfessionalLink) observations.push("No LinkedIn, GitHub, or portfolio link was found — optional, but a strong addition for technical roles.");

  // Professional summary (15 pts)
  const summary = str(p.summary).trim();
  if (summary.length >= 40) {
    score += 15;
  } else if (summary.length > 0) {
    score += 7;
    observations.push("The professional summary is quite short — a 2–3 sentence overview helps both ATS keyword scans and human reviewers.");
  } else {
    observations.push("No professional summary was found. Adding one gives the ATS and recruiters quick context on your profile.");
  }

  // Core sections present (35 pts total). Work Experience/Internships is
  // intentionally not required on its own — a fresher with solid projects
  // shouldn't be penalized for lacking full-time employment history.
  const sectionsChecked = [
    { list: arr(resume.education), label: "Education", pts: 9 },
    { list: arr(resume.skills), label: "Skills", pts: 9 },
    { list: arr(resume.projects), label: "Projects", pts: 9 },
    {
      list: [...arr(resume.workExperience), ...arr(resume.internships)],
      label: "Work Experience / Internships",
      pts: 8,
    },
  ];
  sectionsChecked.forEach(({ list, label, pts }) => {
    if (list.length > 0) {
      score += pts;
    } else if (label === "Work Experience / Internships") {
      observations.push("No work experience or internships were found — common for students; project evidence can carry a lot of weight instead.");
    } else {
      observations.push(`No ${label} entries were found.`);
    }
  });

  // Depth check (20 pts): at least some description-level detail, not just
  // bare titles — this is what keeps a "technically complete but empty"
  // resume from scoring artificially high.
  const descriptiveChars = [
    ...arr(resume.projects).map((x) => str(x.description) + str(x.responsibilities)),
    ...arr(resume.workExperience).map((x) => str(x.responsibilities)),
    ...arr(resume.internships).map((x) => str(x.responsibilities)),
  ].join(" ").trim().length;

  if (descriptiveChars >= 200) {
    score += 20;
  } else if (descriptiveChars >= 60) {
    score += 10;
    observations.push("Project/experience descriptions are fairly brief — adding a bit more detail helps ATS keyword matching and recruiter context.");
  } else {
    observations.push("Project and experience entries have little to no description text — this significantly limits ATS keyword matching.");
  }

  score = Math.max(0, Math.min(100, score));

  if (observations.length === 0) {
    observations.push("Resume structure looks complete: contact details, summary, and core sections are all present with reasonable detail.");
  }

  return { score, observations };
}
