// src/utils/ats/jobMatchScorer.js
//
// Mode A: "How well does this resume match THIS specific job description?"
//
// Combines seven explainable subscores into one weighted overall score:
// required/preferred skill coverage (against the JD parsed by jdParser.js,
// with skills actually DEMONSTRATED in projects/experience weighted above
// ones merely listed), experience relevance, project relevance, achievement
// quantification, resume structure, and a separate ATS-compatibility
// (format/parseability risk) score. This is deliberately NOT a simple
// "matched keywords / total keywords" calculation.
//
// Weight is redistributed away from Experience Relevance when the resume has
// no work/internship entries (documented in experienceAnalyzer.js), since
// for a fresher, project evidence is the primary substitute rather than a
// penalty-worthy gap.

import { extractSkillSet, getBulletTexts } from "./resumeNormalizer.js";
import { matchTerm, isRealMatch } from "./keywordMatcher.js";
import { analyzeExperience } from "./experienceAnalyzer.js";
import { analyzeProjects } from "./projectAnalyzer.js";
import { analyzeStructure } from "./structureAnalyzer.js";
import { analyzeAchievements } from "./achievementAnalyzer.js";
import { analyzeWritingQuality } from "./writingQualityAnalyzer.js";
import { analyzeAtsCompatibility } from "./atsCompatibilityAnalyzer.js";
import { DEGREE_LEVELS } from "../../data/ats/skills.js";

const BASE_WEIGHTS = {
  requiredSkills: 26,
  preferredSkills: 9,
  experience: 16,
  projects: 16,
  achievements: 11,
  structure: 10,
  atsCompatibility: 12,
};

function coverageFor(terms, resumeSkillSet, fullText, demonstratedSet) {
  if (terms.length === 0) return { coverage: null, matched: [], missing: [] };
  const results = terms.map((t) => matchTerm(t, resumeSkillSet, fullText, demonstratedSet));
  const matched = results.filter(isRealMatch);
  const missing = results.filter((r) => !isRealMatch(r));
  const coverage = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  return { coverage, matched, missing };
}

/** Resume's highest detected education level, reusing the same DEGREE_LEVELS
 *  scale jdParser.js uses for the JD side, so the two are directly
 *  comparable. Returns null if nothing recognizable was found. */
function highestEducationLevel(resume) {
  const text = (resume.education || [])
    .map((e) => `${e.degree || ""} ${e.fieldOfStudy || ""}`)
    .join(" ")
    .toLowerCase();
  let level = null;
  DEGREE_LEVELS.forEach((entry) => {
    entry.terms.forEach((term) => {
      if (text.includes(term)) level = level === null ? entry.level : Math.max(level, entry.level);
    });
  });
  return level;
}

function buildEducationNote(resume, jd) {
  if (!jd.education?.level) return null;
  const resumeLevel = highestEducationLevel(resume);
  if (resumeLevel === null) {
    return "The job description mentions an education requirement, but no matching degree level was found on the resume — this may just mean it wasn't clearly labeled.";
  }
  if (resumeLevel >= jd.education.level) {
    return "The resume's education level appears to meet the job description's stated requirement.";
  }
  return "The resume's education level appears to be below what the job description mentions — this doesn't rule out a strong application, but is worth being aware of.";
}

function buildDomainKeywordNote(jd, fullText) {
  if (!jd.domainKeywords || jd.domainKeywords.length === 0) return null;
  const hits = jd.domainKeywords.filter((kw) => fullText.includes(kw));
  if (hits.length === 0) return null;
  return `Also found ${hits.length} of ${jd.domainKeywords.length} related terms from the job description in the resume's text.`;
}

export function runJobMatchAnalysis(resume, jd) {
  const { canonicalSet: resumeSkillSet, fullText, demonstratedSet } = extractSkillSet(resume);
  const bullets = getBulletTexts(resume);

  const required = coverageFor(jd.requiredSkills, resumeSkillSet, fullText, demonstratedSet);
  const preferred = coverageFor(jd.preferredSkills, resumeSkillSet, fullText, demonstratedSet);

  const experienceResult = analyzeExperience(resume, jd);
  const projectsResult = analyzeProjects(resume, jd);
  const achievementsResult = analyzeAchievements(bullets);
  const structureResult = analyzeStructure(resume);
  const atsCompatibilityResult = analyzeAtsCompatibility(resume);
  const writingQuality = analyzeWritingQuality(bullets);

  // Redistribute Experience Relevance's weight onto Project Relevance when
  // there is no work/internship evidence at all (see experienceAnalyzer.js).
  const weights = { ...BASE_WEIGHTS };
  if (!experienceResult.applicable) {
    weights.projects += weights.experience;
    weights.experience = 0;
  }

  const requiredScore = required.coverage === null ? 100 : Math.round(required.coverage * 100);
  const preferredScore = preferred.coverage === null ? 100 : Math.round(preferred.coverage * 100);

  const scored = {
    requiredSkills: requiredScore,
    preferredSkills: preferredScore,
    experience: experienceResult.applicable ? experienceResult.score : null,
    projects: projectsResult.score,
    achievements: achievementsResult.score,
    structure: structureResult.score,
    atsCompatibility: atsCompatibilityResult.score,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + (scored[key] ?? 0) * w, 0) / totalWeight
  );

  const educationNote = buildEducationNote(resume, jd);
  const domainKeywordNote = buildDomainKeywordNote(jd, fullText);

  const demonstratedAmongMatched = required.matched.some((m) => demonstratedSet.has(m.term));
  const requiredReason =
    jd.requiredSkills.length === 0
      ? "No specific required skills were detected in the job description."
      : `${required.matched.length} of ${jd.requiredSkills.length} required skills were found on the resume` +
        `${demonstratedAmongMatched ? ", including some demonstrated directly in projects or experience" : ""}.`;

  const preferredReason =
    (jd.preferredSkills.length === 0
      ? "No preferred (nice-to-have) skills were detected in the job description."
      : `${preferred.matched.length} of ${jd.preferredSkills.length} preferred skills were found on the resume.`) +
    (domainKeywordNote ? ` ${domainKeywordNote}` : "");

  const breakdown = [
    {
      key: "requiredSkills",
      label: "Required Skills Match",
      score: scored.requiredSkills,
      weightPct: weights.requiredSkills,
      reason: requiredReason,
    },
    {
      key: "preferredSkills",
      label: "Preferred Skills Match",
      score: scored.preferredSkills,
      weightPct: weights.preferredSkills,
      reason: preferredReason,
    },
    {
      key: "experience",
      label: "Experience Relevance",
      score: scored.experience,
      weightPct: weights.experience,
      reason: experienceResult.reasons.join(" "),
    },
    {
      key: "projects",
      label: "Project Relevance",
      score: scored.projects,
      weightPct: weights.projects,
      reason: projectsResult.reasons.join(" "),
    },
    {
      key: "achievements",
      label: "Achievements & Impact",
      score: scored.achievements,
      weightPct: weights.achievements,
      reason: achievementsResult.reasons.join(" "),
    },
    {
      key: "structure",
      label: "Resume Structure",
      score: scored.structure,
      weightPct: weights.structure,
      reason:
        "Based on contact completeness, summary, section coverage, and content depth." +
        (educationNote ? ` ${educationNote}` : ""),
    },
    {
      key: "atsCompatibility",
      label: "ATS Compatibility",
      score: scored.atsCompatibility,
      weightPct: weights.atsCompatibility,
      reason: "Estimated parsing risk based on document format (tables, columns, images) — separate from keyword or content quality.",
    },
  ];

  return {
    mode: "job-match",
    overallScore,
    breakdown,
    matchedRequired: required.matched.map((m) => m.displayName),
    missingRequired: required.missing.map((m) => m.displayName),
    matchedPreferred: preferred.matched.map((m) => m.displayName),
    missingPreferred: preferred.missing.map((m) => m.displayName),
    structureObservations: structureResult.observations,
    atsCompatibilityObservations: atsCompatibilityResult.observations,
    writingQuality,
  };
}
