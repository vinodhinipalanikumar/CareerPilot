// src/utils/ats/experienceAnalyzer.js
//
// Work experience + internships are analyzed together, since for students
// internships are often the only professional evidence available.
//
// If the resume has NEITHER work experience NOR internships, this returns
// `applicable: false` instead of a low/zero score — the caller (jobMatchScorer)
// redistributes this category's weight onto Project Relevance, since that is
// the primary evidence source for a fresher. This is a documented reweighting
// rule, not an artificial score boost.

import { textMentionsSkill } from "./skillNormalizer.js";
import { getExperienceEntries } from "./resumeNormalizer.js";

export function analyzeExperience(resume, jd) {
  const entries = getExperienceEntries(resume);
  const internshipCount = (resume.internships || []).length;
  const workCount = (resume.workExperience || []).length;

  if (entries.length === 0) {
    return {
      score: null,
      applicable: false,
      reasons: [
        "No internship or work experience entries were found. This is common for students — project experience is evaluated separately and can offset this.",
      ],
    };
  }

  const jdSkills = jd ? [...jd.requiredSkills, ...jd.preferredSkills] : [];

  const entryScores = entries.map((e) => {
    const text = `${e.company || ""} ${e.jobTitle || e.position || ""} ${e.technologies || ""} ${e.responsibilities || ""}`.toLowerCase();
    if (jdSkills.length === 0) {
      const hasSubstance = (e.responsibilities || "").trim().length > 40;
      return hasSubstance ? 60 : 30;
    }
    const hits = jdSkills.filter((s) => textMentionsSkill(text, s));
    // A single entry doesn't need to cover every JD skill to be relevant —
    // scale up moderately, capped at 100.
    return Math.min(100, Math.round((hits.length / jdSkills.length) * 130));
  });

  const score = Math.round(entryScores.reduce((a, b) => a + b, 0) / entryScores.length);

  const detectedParts = [];
  if (internshipCount > 0) detectedParts.push(`${internshipCount} internship${internshipCount === 1 ? "" : "s"} detected`);
  if (workCount > 0) detectedParts.push(`${workCount} work experience ${workCount === 1 ? "entry" : "entries"} detected`);
  const detectedSummary = detectedParts.join(", ");

  const reasons = [
    jdSkills.length > 0
      ? `${detectedSummary}. Evaluated for overlap with the job's required and preferred skills.`
      : `${detectedSummary}. Evaluated for general depth (no job description was provided to compare against).`,
  ];

  return { score, applicable: true, reasons };
}