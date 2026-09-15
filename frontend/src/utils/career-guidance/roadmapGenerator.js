// src/utils/career-guidance/roadmapGenerator.js
//
// Builds the practical, role-specific roadmap shown on the Career Details
// screen: phased learning plan, prioritized skill gaps, gap-driven project
// recommendations, interview focus, and next steps. Everything here is
// derived from the role definition + the user's actual profile — nothing
// is marked "done" unless the profile shows real evidence of it.

import { normalizeSkill, displaySkill } from "./skillTaxonomy.js";

function hasSkillLike(profile, itemLabel) {
  const normalized = normalizeSkill(itemLabel);
  if (normalized && profile.skillSet.has(normalized.canonical)) return true;
  // Loose fallback: check if any explicit skill's raw text contains this label.
  const lower = itemLabel.toLowerCase();
  return profile.explicitSkills.some((s) => s.raw.toLowerCase().includes(lower) || lower.includes(s.raw.toLowerCase()));
}

function buildFundamentalsPhase(profile, role) {
  const items = (role.beginnerLearningPath || []).flatMap((group) => group.items);
  return {
    title: "Phase 1 — Strengthen Fundamentals",
    description: "The baseline knowledge this role builds on.",
    items: items.map((label) => ({ label, done: hasSkillLike(profile, label) })),
  };
}

function buildCoreSkillsPhase(role) {
  const items = (role.intermediateLearningPath || []).flatMap((group) => group.items);
  return {
    title: "Phase 2 — Core Career Skills",
    description: `The skills that specifically make you job-ready for ${role.title}.`,
    items: items.map((label) => ({ label, done: false })),
  };
}

function buildProjectsPhase(recommendedProjects) {
  return {
    title: "Phase 3 — Build Projects",
    description: "Apply what you're learning to real, portfolio-worthy work.",
    items: recommendedProjects.map((p) => ({ label: p.title, done: false })),
  };
}

function buildPlacementPrepPhase(profile) {
  const dsaDone = profile.skillSet.has("data structures and algorithms");
  return {
    title: "Phase 4 — Placement Preparation",
    description: "General preparation every candidate needs, regardless of role.",
    items: [
      { label: "Data Structures & Algorithms", done: dsaDone },
      { label: "Aptitude practice", done: false },
      { label: "Technical interview practice", done: false },
      { label: "Project explanation practice", done: false },
      { label: "HR interview practice", done: false },
    ],
  };
}

/**
 * Rank a role's recommended projects by how many of the user's current
 * skill gaps they'd close, so the projects shown are the ones that matter
 * most right now.
 */
function rankRecommendedProjects(role, missingSkillsCanonical) {
  const missingSet = new Set(missingSkillsCanonical);
  return [...role.recommendedProjects]
    .map((p) => ({
      ...p,
      gapCoverage: p.skills.filter((s) => missingSet.has(s)).length,
      skillsDisplay: p.skills.map(displaySkill),
    }))
    .sort((a, b) => b.gapCoverage - a.gapCoverage)
    .slice(0, 4);
}

function buildNextSteps(role, matchResult, rankedProjects) {
  const steps = [];
  const topMissing = matchResult.missingSkills.highPriority[0] || matchResult.missingSkills.mediumPriority[0];
  if (topMissing) steps.push(`Learn ${topMissing}.`);
  if (rankedProjects[0]) steps.push(`Build a project: "${rankedProjects[0].title}".`);
  steps.push("Practice core DSA and aptitude for placement rounds.");
  steps.push("Improve your resume with measurable, quantified achievements.");
  steps.push(`Prepare for ${role.title} interview questions (technical + HR).`);
  return steps;
}

/**
 * @param profile - output of extractProfile()
 * @param matchResult - one entry from matchCareers() / scoreRoleForProfile()
 */
export function buildRoadmap(profile, matchResult) {
  const role = matchResult.role;
  const missingSkillsCanonical = [
    ...role.requiredSkills.filter((s) => !profile.skillSet.has(s)),
    ...role.preferredSkills.filter((s) => !profile.skillSet.has(s)),
  ];

  const rankedProjects = rankRecommendedProjects(role, missingSkillsCanonical);

  const phases = [
    buildFundamentalsPhase(profile, role),
    buildCoreSkillsPhase(role),
    buildProjectsPhase(rankedProjects),
    buildPlacementPrepPhase(profile),
  ];

  return {
    phases,
    recommendedProjects: rankedProjects,
    nextSteps: buildNextSteps(role, matchResult, rankedProjects),
  };
}
