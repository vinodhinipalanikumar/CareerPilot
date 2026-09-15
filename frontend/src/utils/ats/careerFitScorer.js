// src/utils/ats/careerFitScorer.js
//
// Mode B: "No job description was given — how good is this resume overall,
// and what jobs is this candidate suited for?"
//
// Two distinct, intentionally separate things are computed here:
//
// 1. `overallScore` — a General ATS Resume Score describing the resume on
//    its own merits (skill breadth, experience/project depth, structure,
//    achievements, writing quality, ATS format compatibility). This does
//    NOT depend on any specific job.
// 2. `roles` — a ranked shortlist of job titles this resume shows real
//    evidence for, each with its own independent fit percentage. A role is
//    only surfaced if there's real evidence for it — no role is recommended
//    purely because one keyword happened to appear.
//
// These stay separate on purpose: a resume can score well overall while
// still not showing enough evidence to confidently suggest any specific
// role (e.g. strong writing/structure, but very generic skills).

import { ROLES } from "../../data/ats/roles.js";
import { extractSkillSet, getExperienceEntries, getBulletTexts } from "./resumeNormalizer.js";
import { matchTerm, isRealMatch } from "./keywordMatcher.js";
import { textMentionsSkill } from "./skillNormalizer.js";
import { analyzeExperience } from "./experienceAnalyzer.js";
import { analyzeProjects } from "./projectAnalyzer.js";
import { analyzeStructure } from "./structureAnalyzer.js";
import { analyzeAchievements } from "./achievementAnalyzer.js";
import { analyzeWritingQuality } from "./writingQualityAnalyzer.js";
import { analyzeAtsCompatibility } from "./atsCompatibilityAnalyzer.js";

const TIER_WEIGHTS = { required: 0.5, important: 0.35, supporting: 0.15 };
const EVIDENCE_BONUS_WEIGHT = 0.15; // portion of fit score driven by project/experience overlap
const MIN_FIT_SCORE = 35; // below this, evidence is too thin to responsibly suggest the role

// General overall score weights (no specific job to compare against).
const GENERAL_WEIGHTS = {
  skillBreadth: 12,
  experienceProjects: 28,
  structure: 20,
  atsCompatibility: 15,
  achievements: 13,
  writingQuality: 12,
};

function tierCoverage(skills, resumeSkillSet, fullText, demonstratedSet) {
  if (skills.length === 0) return { coverage: 1, matched: [], missing: [] };
  const results = skills.map((s) => matchTerm(s, resumeSkillSet, fullText, demonstratedSet));
  const matched = results.filter(isRealMatch);
  const missing = results.filter((r) => !isRealMatch(r));
  const coverage = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  return { coverage, matched, missing };
}

function bestEvidenceOverlap(resume, roleSkills) {
  const projects = resume.projects || [];
  const experiences = getExperienceEntries(resume);
  const entries = [...projects, ...experiences];
  if (entries.length === 0 || roleSkills.length === 0) return { ratio: 0, source: null };

  let best = { ratio: 0, source: null };
  entries.forEach((e) => {
    const text = `${e.title || e.company || ""} ${e.technologies || ""} ${e.description || e.responsibilities || ""}`.toLowerCase();
    const hits = roleSkills.filter((s) => textMentionsSkill(text, s));
    const ratio = hits.length / roleSkills.length;
    if (ratio > best.ratio) best = { ratio, source: e.title || e.company || null };
  });
  return best;
}

/** A rough 0-100 "how many recognized technical skills does this resume show
 *  evidence of" signal, used only as a small piece of the general overall
 *  score — not as a stand-in for the whole analysis. Diminishing returns
 *  past a reasonable count so simply padding a Skills list doesn't dominate
 *  the score. */
function skillBreadthScore(resumeSkillSet) {
  const count = resumeSkillSet.size;
  if (count === 0) return 0;
  return Math.round(Math.min(100, (Math.log2(count + 1) / Math.log2(13)) * 100));
}

export function runCareerFitAnalysis(resume) {
  const { canonicalSet: resumeSkillSet, fullText, demonstratedSet } = extractSkillSet(resume);
  const bullets = getBulletTexts(resume);

  // --- 1. Ranked role suggestions (unchanged methodology) -----------------
  const roleResults = ROLES.map((role) => {
    const required = tierCoverage(role.requiredSkills, resumeSkillSet, fullText, demonstratedSet);
    const important = tierCoverage(role.importantSkills, resumeSkillSet, fullText, demonstratedSet);
    const supporting = tierCoverage(role.supportingSkills, resumeSkillSet, fullText, demonstratedSet);

    const allRoleSkills = [...role.requiredSkills, ...role.importantSkills, ...role.supportingSkills];
    const evidence = bestEvidenceOverlap(resume, allRoleSkills);

    const baseFit =
      required.coverage * TIER_WEIGHTS.required +
      important.coverage * TIER_WEIGHTS.important +
      supporting.coverage * TIER_WEIGHTS.supporting;

    const fitFraction = Math.min(1, baseFit * (1 - EVIDENCE_BONUS_WEIGHT) + evidence.ratio * EVIDENCE_BONUS_WEIGHT);
    const fitScore = Math.round(fitFraction * 100);
    const hasEvidence = required.matched.length > 0 || important.matched.length > 0;

    const matchedSkillNames = [...required.matched, ...important.matched, ...supporting.matched].map((m) => m.displayName);
    const whyItMatches = [];
    if (required.matched.length > 0) whyItMatches.push(`${required.matched.map((m) => m.displayName).join(", ")} found among required skills.`);
    if (important.matched.length > 0) whyItMatches.push(`${important.matched.map((m) => m.displayName).join(", ")} found among important supporting skills.`);
    if (evidence.ratio > 0.3 && evidence.source) whyItMatches.push(`Relevant hands-on evidence found in "${evidence.source}".`);

    return {
      id: role.id,
      title: role.title,
      fitScore,
      hasEvidence,
      matchedSkills: matchedSkillNames,
      missingRequired: required.missing.map((m) => m.displayName),
      missingImportant: important.missing.map((m) => m.displayName),
      whyItMatches,
    };
  });

  const ranked = roleResults
    .filter((r) => r.fitScore >= MIN_FIT_SCORE && r.hasEvidence)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 4);

  // --- 2. General overall resume score (job-independent) -------------------
  const experienceResult = analyzeExperience(resume, null);
  const projectsResult = analyzeProjects(resume, null);
  const structureResult = analyzeStructure(resume);
  const achievementsResult = analyzeAchievements(bullets);
  const writingQuality = analyzeWritingQuality(bullets);
  const atsCompatibilityResult = analyzeAtsCompatibility(resume);
  const skillBreadth = skillBreadthScore(resumeSkillSet);

  // Same fresher-friendly redistribution rule as jobMatchScorer.js: when
  // there's no work/internship evidence, that weight moves onto Projects
  // rather than penalizing the resume for lacking full-time experience.
  const weights = { ...GENERAL_WEIGHTS };
  const experienceProjectsScore = experienceResult.applicable
    ? Math.round(experienceResult.score * 0.45 + projectsResult.score * 0.55)
    : projectsResult.score;

  const generalScored = {
    skillBreadth,
    experienceProjects: experienceProjectsScore,
    structure: structureResult.score,
    atsCompatibility: atsCompatibilityResult.score,
    achievements: achievementsResult.score,
    writingQuality: writingQuality.applicable ? writingQuality.score : structureResult.score, // no bullets to judge — don't let this drag the score down artificially
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + (generalScored[key] ?? 0) * w, 0) / totalWeight
  );

  const breakdown = [
    {
      key: "skillBreadth",
      label: "Recognized Technical Skills",
      score: generalScored.skillBreadth,
      weightPct: weights.skillBreadth,
      reason: `${resumeSkillSet.size} recognized technical skill${resumeSkillSet.size === 1 ? "" : "s"} detected across the resume.`,
    },
    {
      key: "experienceProjects",
      label: "Experience & Project Depth",
      score: generalScored.experienceProjects,
      weightPct: weights.experienceProjects,
      reason: [...experienceResult.reasons, ...projectsResult.reasons].join(" "),
    },
    {
      key: "structure",
      label: "Resume Structure",
      score: generalScored.structure,
      weightPct: weights.structure,
      reason: "Based on contact completeness, summary, section coverage, and content depth.",
    },
    {
      key: "atsCompatibility",
      label: "ATS Compatibility",
      score: generalScored.atsCompatibility,
      weightPct: weights.atsCompatibility,
      reason: "Estimated parsing risk based on document format (tables, columns, images).",
    },
    {
      key: "achievements",
      label: "Achievements & Impact",
      score: generalScored.achievements,
      weightPct: weights.achievements,
      reason: achievementsResult.reasons.join(" "),
    },
    {
      key: "writingQuality",
      label: "Writing Quality",
      score: generalScored.writingQuality,
      weightPct: weights.writingQuality,
      reason: writingQuality.applicable
        ? "Based on phrasing, repetition, and length of project/experience bullet points."
        : "No project or experience bullet points were available to assess.",
    },
  ];

  return {
    mode: "career-fit",
    overallScore,
    breakdown,
    roles: ranked,
    hasAnyEvidence: ranked.length > 0,
    structure: structureResult,
    achievements: achievementsResult,
    writingQuality,
    atsCompatibility: atsCompatibilityResult,
  };
}
