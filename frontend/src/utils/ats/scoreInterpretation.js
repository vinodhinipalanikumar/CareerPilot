// src/utils/ats/scoreInterpretation.js
//
// Turns a raw 0-100 overall score into a human-readable band label and a
// one-sentence plain-language summary, so the result page never just shows
// a bare number. Shared by both job-match and career-fit modes so the same
// score always means the same thing regardless of which path produced it.

const BANDS = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Strong" },
  { min: 60, label: "Good, but needs improvement" },
  { min: 40, label: "Needs improvement" },
  { min: 0, label: "Weak" },
];

export function scoreBandLabel(score) {
  return BANDS.find((b) => score >= b.min)?.label || "Weak";
}

/** Build a single plain-language sentence summarizing the score, referencing
 *  the resume's strongest and weakest breakdown categories so the sentence
 *  is grounded in the actual analysis rather than being generic filler. */
export function buildScoreSummary(score, breakdown, { jobSpecific } = {}) {
  const label = scoreBandLabel(score);
  const scored = breakdown.filter((b) => typeof b.score === "number");
  const strongest = [...scored].sort((a, b) => b.score - a.score)[0];
  const weakest = [...scored].sort((a, b) => a.score - b.score)[0];

  const subject = jobSpecific ? "match with this job" : "resume";

  if (!strongest || !weakest || strongest.key === weakest.key) {
    return `Your ${subject} is rated "${label.toLowerCase()}" overall.`;
  }

  return `Your ${subject} is rated "${label.toLowerCase()}" overall — ${strongest.label.toLowerCase()} is a strong point, while ${weakest.label.toLowerCase()} could use the most attention.`;
}
