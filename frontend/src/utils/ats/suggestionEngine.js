// src/utils/ats/suggestionEngine.js
//
// Turns already-computed analysis results into a short, prioritized list of
// plain-language suggestions. Every suggestion references something the
// engine actually detected (a missing skill, a low subscore, a specific
// writing issue) — nothing here invents new information about the candidate,
// and missing skills are always framed as "consider adding if you actually
// have this" rather than an instruction to claim something untrue.
//
// Capped at 5, ranked by impact (HIGH > MEDIUM > LOW), so the person sees
// the handful of things most worth fixing rather than an overwhelming list.

const IMPACT_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function rankAndCap(items, max = 5) {
  return items
    .sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact])
    .slice(0, max);
}

function lowercaseFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

export function buildJobMatchSuggestions(result) {
  const items = [];
  const byKey = (key) => result.breakdown.find((b) => b.key === key);

  if (result.missingRequired.length > 0) {
    items.push({
      impact: "HIGH",
      text: `Consider adding or highlighting experience with: ${result.missingRequired.slice(0, 5).join(", ")} — these are required skills the job description asks for, if you genuinely have relevant experience with them.`,
    });
  }

  const atsItem = byKey("atsCompatibility");
  if (atsItem && atsItem.score < 60) {
    items.push({
      impact: "HIGH",
      text: `Estimated ATS compatibility is low for this document — ${lowercaseFirst(result.atsCompatibilityObservations?.[0]) || "review the document's formatting for parsing risks."}`,
    });
  }

  const achievementsItem = byKey("achievements");
  if (achievementsItem && achievementsItem.score < 50) {
    items.push({
      impact: "HIGH",
      text: "Strengthen project/experience bullet points with a measurable result (a number, percentage, or scale) and a strong opening action verb.",
    });
  }

  const projectsItem = byKey("projects");
  if (projectsItem && projectsItem.score < 50) {
    items.push({
      impact: "MEDIUM",
      text: "Consider adding or emphasizing a project that more directly uses the target job's required technologies.",
    });
  }

  if (result.missingPreferred.length > 0) {
    items.push({
      impact: "MEDIUM",
      text: `If you have any real exposure to ${result.missingPreferred.slice(0, 5).join(", ")}, consider mentioning it — these are preferred (nice-to-have) skills.`,
    });
  }

  const structureItem = byKey("structure");
  if (structureItem && structureItem.score < 70 && result.structureObservations?.length) {
    items.push({ impact: "MEDIUM", text: result.structureObservations[0] });
  }

  if (result.writingQuality.applicable && result.writingQuality.score < 70) {
    items.push({
      impact: "LOW",
      text: 'Review your bullet points for repetitive openings, first-person pronouns, or passive phrasing like "responsible for".',
    });
  }

  if (items.length === 0) {
    return [{ impact: "LOW", text: "Your resume already shows strong alignment with this job description — a final proofread before applying is all that's left." }];
  }
  return rankAndCap(items);
}

export function buildCareerFitSuggestions(result) {
  const items = [];
  const byKey = (key) => result.breakdown?.find((b) => b.key === key);

  if (!result.hasAnyEvidence) {
    return [{ impact: "HIGH", text: "Add more specific technical skills, and describe your projects with the technologies you used, so the analyzer has enough evidence to suggest roles." }];
  }

  const top = result.roles[0];
  if (top.missingRequired.length > 0) {
    items.push({
      impact: "HIGH",
      text: `For "${top.title}", consider building experience with: ${top.missingRequired.slice(0, 4).join(", ")}, if these are genuinely areas you're developing.`,
    });
  }

  const atsItem = byKey("atsCompatibility");
  if (atsItem && atsItem.score < 60) {
    items.push({
      impact: "HIGH",
      text: `Estimated ATS compatibility is low for this document — ${lowercaseFirst(result.atsCompatibility?.observations?.[0]) || "review the document's formatting for parsing risks."}`,
    });
  }

  if (result.achievements.score < 50) {
    items.push({
      impact: "MEDIUM",
      text: "Add measurable outcomes (numbers, percentages, scale) to your project and experience bullet points.",
    });
  }

  const structureObs = result.structure?.observations?.[0];
  if (result.structure && result.structure.score < 70 && structureObs) {
    items.push({ impact: "MEDIUM", text: structureObs });
  }

  if (result.writingQuality.applicable && result.writingQuality.score < 70) {
    items.push({
      impact: "LOW",
      text: "Review your bullet points for repetitive openings, first-person pronouns, or passive phrasing.",
    });
  }

  if (items.length === 0) {
    return [{ impact: "LOW", text: "Your resume shows solid evidence for the roles listed above — keep building projects that reinforce these skills." }];
  }
  return rankAndCap(items);
}
