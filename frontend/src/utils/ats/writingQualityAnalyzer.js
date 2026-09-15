// src/utils/ats/writingQualityAnalyzer.js
//
// Lightweight, rule-based writing-quality checks on project/experience
// bullet points: first-person pronoun usage (resumes should be written in
// implied first person, without "I"/"my"), repetitive openings across
// bullets, and bullets that are too short (little substance) or too long
// (likely to be skimmed past).

const FIRST_PERSON_PATTERN = /\b(i|i'm|i've|i'd|my|myself)\b/i;

// Passive, low-ownership openers that read as weak on a resume — flagged
// with a suggestion, never auto-rewritten.
const WEAK_PHRASES = [
  "responsible for", "worked on", "helped with", "duties included",
  "in charge of", "tasked with", "assisted with", "involved in",
];
const STRONG_VERB_EXAMPLES = "Developed, Implemented, Designed, Optimized, Integrated, Automated, Led";

function firstWord(text) {
  const match = (text || "").trim().match(/^[A-Za-z']+/);
  return match ? match[0].toLowerCase() : null;
}

export function analyzeWritingQuality(bullets) {
  if (!bullets || bullets.length === 0) {
    return { applicable: false, score: 0, observations: [] };
  }

  const observations = [];
  let deductions = 0;

  // First-person pronoun usage
  const firstPersonCount = bullets.filter((b) => FIRST_PERSON_PATTERN.test(b.text)).length;
  if (firstPersonCount > 0) {
    deductions += Math.min(25, firstPersonCount * 5);
    observations.push(`${firstPersonCount} bullet point${firstPersonCount === 1 ? "" : "s"} use first-person pronouns ("I", "my") — resumes typically drop these.`);
  }

  // Weak, passive phrasing
  const lowerBullets = bullets.map((b) => (b.text || "").toLowerCase());
  const weakCount = lowerBullets.filter((t) => WEAK_PHRASES.some((phrase) => t.includes(phrase))).length;
  if (weakCount > 0) {
    deductions += Math.min(20, weakCount * 6);
    observations.push(
      `${weakCount} bullet point${weakCount === 1 ? "" : "s"} use${weakCount === 1 ? "s" : ""} passive phrasing like "responsible for" or "worked on" — consider stronger action verbs instead (e.g. ${STRONG_VERB_EXAMPLES}).`
    );
  }

  // Repetitive openings
  const openings = bullets.map((b) => firstWord(b.text)).filter(Boolean);
  const openingCounts = new Map();
  openings.forEach((w) => openingCounts.set(w, (openingCounts.get(w) || 0) + 1));
  const mostRepeated = [...openingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (mostRepeated && mostRepeated[1] >= 3 && mostRepeated[1] / bullets.length > 0.4) {
    deductions += 15;
    observations.push(`Several bullet points start with the same word ("${mostRepeated[0]}") — varying the opening verb reads stronger.`);
  }

  // Length distribution
  const tooShort = bullets.filter((b) => (b.text || "").split(/\s+/).filter(Boolean).length < 4).length;
  const tooLong = bullets.filter((b) => (b.text || "").split(/\s+/).filter(Boolean).length > 40).length;
  if (tooShort > 0) {
    deductions += Math.min(15, tooShort * 3);
    observations.push(`${tooShort} bullet point${tooShort === 1 ? "" : "s"} are very short and may lack enough detail.`);
  }
  if (tooLong > 0) {
    deductions += Math.min(15, tooLong * 3);
    observations.push(`${tooLong} bullet point${tooLong === 1 ? "" : "s"} are quite long and may be better split or trimmed.`);
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));
  if (observations.length === 0) {
    observations.push("Bullet points are well varied, written in third-person, and reasonably sized.");
  }

  return { applicable: true, score, observations };
}
