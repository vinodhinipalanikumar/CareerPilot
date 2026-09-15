// src/utils/ats/keywordMatcher.js
//
// Shared "does the resume show evidence of this canonical skill?" primitive,
// used by both careerFitScorer.js (Mode B) and jobMatchScorer.js (Mode A) so
// the two scoring paths judge evidence the same way.
//
// A skill merely NAMED in the Skills section (or summary) is weaker evidence
// than a skill actually put to use in a project or work/internship bullet —
// so this assigns different confidence to each, rather than treating every
// mention of a skill as equally strong proof of it.

import { displaySkill, textMentionsSkill } from "./skillNormalizer.js";

/**
 * Classify how strongly a resume evidences a single canonical skill term.
 *
 *  - "demonstrated": the skill appears in project/experience text — i.e. the
 *    candidate describes actually having used it. Strongest evidence.
 *  - "listed":       the skill is in the resume's canonical set (explicit
 *    Skills entry, or mentioned in the summary/education text) but not
 *    found in any project/experience text. Real, but weaker, evidence.
 *  - "contextual":   no confident match, but a loose, non-word-boundary
 *    substring mention exists. Very weak, non-authoritative signal.
 *  - "missing":      no evidence at all.
 *
 * `resumeSkillSet` / `demonstratedSet` are the Sets produced by
 * resumeNormalizer.extractSkillSet(). `fullText` is that resume's lowercase
 * full-text blob (used only for the "contextual" fallback tier).
 */
export function matchTerm(term, resumeSkillSet, fullText, demonstratedSet) {
  const displayName = displaySkill(term);

  if (demonstratedSet?.has(term)) {
    return { term, displayName, type: "demonstrated", confidence: 1 };
  }

  if (resumeSkillSet.has(term)) {
    return { term, displayName, type: "listed", confidence: 0.75 };
  }

  // Loose, non-word-boundary substring check as a weak fallback signal —
  // e.g. a resume mentioning "reactive programming" shouldn't count as
  // strong evidence of "react", but it's not zero evidence either.
  const loose = (fullText || "").includes(term.replace(/[^a-z0-9+#. ]/gi, ""));
  if (loose && !textMentionsSkill(fullText, term)) {
    return { term, displayName, type: "contextual", confidence: 0.35 };
  }

  return { term, displayName, type: "missing", confidence: 0 };
}

/** True for any tier that counts as a real (non-weak, non-absent) match —
 *  "demonstrated" or "listed", but not "contextual" or "missing". */
export function isRealMatch(matchResult) {
  return matchResult.type === "demonstrated" || matchResult.type === "listed";
}
