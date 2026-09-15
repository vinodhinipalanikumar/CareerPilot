// src/utils/career-guidance/careerMatcher.js
//
// Deterministic, local, rule-based career matching engine. No AI/API calls,
// no fixed/fake scores — every number here is derived from the extracted
// profile (see profileExtractor.js) against the role dataset
// (data/career-guidance/careerRoles.js).
//
// Weights (must total 100):
//   Skill match           40%
//   Project relevance     20%
//   Experience relevance  15%
//   Education relevance   10%
//   Certification match    5%
//   Interest relevance    10%

import { displaySkill } from "./skillTaxonomy.js";

const WEIGHTS = {
  skills: 40,
  projects: 20,
  experience: 15,
  education: 10,
  certifications: 5,
  interests: 10,
};

function pct(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function roleAllSkills(role) {
  return [...new Set([...role.requiredSkills, ...role.preferredSkills])];
}

// ---- Skill match (40%) ----
function scoreSkills(profile, role) {
  const required = role.requiredSkills || [];
  const preferred = role.preferredSkills || [];
  const matchedRequired = required.filter((s) => profile.skillSet.has(s));
  const matchedPreferred = preferred.filter((s) => profile.skillSet.has(s));

  const totalWeight = required.length * 2 + preferred.length * 1;
  const earnedWeight = matchedRequired.length * 2 + matchedPreferred.length * 1;
  const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

  return { score: pct(score), matchedRequired, matchedPreferred };
}

// ---- Project relevance (20%) ----
function scoreProjects(profile, role) {
  const roleSkills = new Set(roleAllSkills(role));
  const relevantProjects = profile.projects.filter((p) =>
    p.technologies.some((t) => roleSkills.has(t))
  );

  const coverageSkills = new Set();
  relevantProjects.forEach((p) => p.technologies.forEach((t) => { if (roleSkills.has(t)) coverageSkills.add(t); }));

  const countFraction = Math.min(relevantProjects.length, 3) / 3;
  const coverageFraction = roleSkills.size > 0 ? coverageSkills.size / roleSkills.size : 0;
  const score = ((countFraction * 0.6) + (coverageFraction * 0.4)) * 100;

  return { score: pct(score), relevantProjects };
}

// ---- Experience / internship relevance (15%) ----
function scoreExperience(profile, role) {
  const roleSkills = new Set(roleAllSkills(role));
  const titleTokens = role.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const allExperience = [...profile.workExperience, ...profile.internships];
  const relevant = allExperience.filter((e) => {
    const techOverlap = e.technologies.some((t) => roleSkills.has(t));
    const titleText = (e.jobTitle || e.position || "").toLowerCase();
    const titleOverlap = titleTokens.some((tok) => titleText.includes(tok));
    return techOverlap || titleOverlap;
  });

  const countFraction = Math.min(relevant.length, 2) / 2;
  const score = countFraction * 100;

  return { score: pct(score), relevantExperience: relevant };
}

// ---- Education relevance (10%) ----
function scoreEducation(profile, role) {
  const keywords = role.educationKeywords || [];
  const eduText = (profile.educationText || "").toLowerCase();
  const degreeText = (profile.highestEducation?.degree || "").toLowerCase();
  const fieldText = (profile.highestEducation?.fieldOfStudy || "").toLowerCase();
  const combined = `${eduText} ${degreeText} ${fieldText}`;

  const isMatch = keywords.some((k) => combined.includes(k));
  if (isMatch) return { score: 100, matched: true };
  if (profile.education.length > 0) return { score: 40, matched: false }; // has some education, just not a direct field match
  return { score: 0, matched: false };
}

// ---- Certification relevance (5%) ----
function scoreCertifications(profile, role) {
  const roleSkills = new Set(roleAllSkills(role));
  const titleTokens = role.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const relevant = profile.certifications.filter((c) => {
    const techOverlap = c.technologies.some((t) => roleSkills.has(t));
    const nameText = `${c.name} ${c.organization}`.toLowerCase();
    const titleOverlap = titleTokens.some((tok) => nameText.includes(tok));
    return techOverlap || titleOverlap;
  });

  const score = (Math.min(relevant.length, 2) / 2) * 100;
  return { score: pct(score), relevantCertifications: relevant };
}

// ---- Interest relevance (10%) ----
function scoreInterests(profile, role) {
  if (!profile.interests || profile.interests.length === 0) return { score: 0, matched: [] };
  const categoryWords = [role.category.toLowerCase(), ...role.title.toLowerCase().split(/\s+/)];
  const matched = profile.interests.filter((interest) => {
    const lower = interest.toLowerCase();
    return categoryWords.some((w) => w.length > 3 && (lower.includes(w) || w.includes(lower)));
  });
  return { score: matched.length > 0 ? 100 : 0, matched };
}

function buildReasons({ role, skillsResult, projectsResult, experienceResult, certsResult, interestsResult }) {
  const reasons = [];

  const topMatchedSkills = [...skillsResult.matchedRequired, ...skillsResult.matchedPreferred].slice(0, 4);
  if (topMatchedSkills.length > 0) {
    reasons.push(`You already know ${topMatchedSkills.map(displaySkill).join(", ")}.`);
  }
  if (projectsResult.relevantProjects.length > 0) {
    const names = projectsResult.relevantProjects.slice(0, 2).map((p) => p.title);
    reasons.push(`Your project${projectsResult.relevantProjects.length > 1 ? "s" : ""} "${names.join('", "')}" show relevant hands-on experience.`);
  }
  if (experienceResult.relevantExperience.length > 0) {
    reasons.push(`Your work/internship experience aligns with this role.`);
  }
  if (certsResult.relevantCertifications.length > 0) {
    reasons.push(`You hold ${certsResult.relevantCertifications.length} certification(s) relevant to this field.`);
  }
  if (interestsResult.matched.length > 0) {
    reasons.push(`Your stated interests align with ${role.title}.`);
  }
  if (reasons.length === 0) {
    reasons.push(`This role is a foundational option to explore based on general profile signals — building a few relevant skills or projects would strengthen this match.`);
  }
  return reasons.slice(0, 5);
}

function buildMissingSkills(role, skillsResult) {
  const missingRequired = role.requiredSkills.filter((s) => !skillsResult.matchedRequired.includes(s));
  const missingPreferred = role.preferredSkills.filter((s) => !skillsResult.matchedPreferred.includes(s));
  // Cap total shown so the user isn't overwhelmed.
  const highPriority = missingRequired.slice(0, 3).map(displaySkill);
  const mediumPriority = missingPreferred.slice(0, Math.max(0, 5 - highPriority.length)).map(displaySkill);
  return { highPriority, mediumPriority };
}

/**
 * Compute a match result for a single role against a profile.
 */
export function scoreRoleForProfile(profile, role) {
  const skillsResult = scoreSkills(profile, role);
  const projectsResult = scoreProjects(profile, role);
  const experienceResult = scoreExperience(profile, role);
  const educationResult = scoreEducation(profile, role);
  const certsResult = scoreCertifications(profile, role);
  const interestsResult = scoreInterests(profile, role);

  const overall = pct(
    (skillsResult.score * WEIGHTS.skills +
      projectsResult.score * WEIGHTS.projects +
      experienceResult.score * WEIGHTS.experience +
      educationResult.score * WEIGHTS.education +
      certsResult.score * WEIGHTS.certifications +
      interestsResult.score * WEIGHTS.interests) /
      100
  );

  const matchedSkillsDisplay = [...skillsResult.matchedRequired, ...skillsResult.matchedPreferred].map(displaySkill);
  const missingSkills = buildMissingSkills(role, skillsResult);
  const reasons = buildReasons({ role, skillsResult, projectsResult, experienceResult, certsResult, interestsResult });

  return {
    role,
    matchPercent: overall,
    breakdown: [
      { key: "skills", label: "Skill Match", score: skillsResult.score, weightPct: WEIGHTS.skills },
      { key: "projects", label: "Project Relevance", score: projectsResult.score, weightPct: WEIGHTS.projects },
      { key: "experience", label: "Experience Relevance", score: experienceResult.score, weightPct: WEIGHTS.experience },
      { key: "education", label: "Education Relevance", score: educationResult.score, weightPct: WEIGHTS.education },
      { key: "certifications", label: "Certification Match", score: certsResult.score, weightPct: WEIGHTS.certifications },
      { key: "interests", label: "Interest Relevance", score: interestsResult.score, weightPct: WEIGHTS.interests },
    ],
    matchedSkills: matchedSkillsDisplay,
    missingSkills,
    reasons,
    relevantProjects: projectsResult.relevantProjects,
  };
}

/**
 * Score every role in the dataset against a profile, sorted best-first.
 */
export function matchCareers(profile, roles) {
  return roles
    .map((role) => scoreRoleForProfile(profile, role))
    .sort((a, b) => b.matchPercent - a.matchPercent);
}
