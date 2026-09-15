// src/utils/ats/achievementAnalyzer.js
//
// Checks how many project/experience bullet points contain a measurable,
// quantified outcome (a number, percentage, or scale word) versus a plain,
// unquantified description. This is a well-known ATS/recruiter heuristic:
// "Improved load time by 40%" is stronger evidence than "Improved load time".

const NUMBER_PATTERN = /\d/;
const SCALE_WORDS = /\b(multiple|several|dozens|hundreds|thousands|millions|first|top|leading)\b/i;
const STRONG_ACTION_VERBS = /^(built|led|designed|developed|implemented|created|improved|optimized|reduced|increased|automated|launched|architected|deployed|managed|delivered|streamlined|migrated|scaled|spearheaded|engineered)\b/i;

export function analyzeAchievements(bullets) {
  if (!bullets || bullets.length === 0) {
    return {
      score: 0,
      reasons: ["No project or experience bullet points were found to evaluate for measurable impact."],
    };
  }

  let quantified = 0;
  let strongVerbStart = 0;

  bullets.forEach((b) => {
    const text = (b.text || "").trim();
    if (NUMBER_PATTERN.test(text) || SCALE_WORDS.test(text)) quantified++;
    if (STRONG_ACTION_VERBS.test(text)) strongVerbStart++;
  });

  const quantifiedRatio = quantified / bullets.length;
  const verbRatio = strongVerbStart / bullets.length;

  // Quantification carries most of the weight; a strong-action-verb opener
  // is a secondary, smaller signal.
  const score = Math.round(Math.min(100, quantifiedRatio * 80 + verbRatio * 20));

  const reasons = [
    `${quantified} of ${bullets.length} bullet point${bullets.length === 1 ? "" : "s"} include a measurable number, percentage, or scale.`,
  ];
  if (verbRatio < 0.4) {
    reasons.push("Consider starting more bullet points with a strong action verb (e.g. \"Built\", \"Led\", \"Optimized\").");
  }

  return { score, reasons };
}
