// src/utils/ats/skillNormalizer.js
//
// Canonicalization layer: turns any raw skill-like string (from a resume,
// a JD, or the KNOWN_SKILLS list itself) into ONE canonical lowercase form,
// using the SKILL_NORMALIZATION map in synonyms.js. This is what makes
// "React.js", "ReactJS" and "react js" all resolve to the same skill
// ("react") without ever merging genuinely different technologies.

import { KNOWN_SKILLS } from "../../data/ats/skills.js";
import { SKILL_NORMALIZATION } from "../../data/ats/synonyms.js";

const KNOWN_SKILLS_SET = new Set(KNOWN_SKILLS);

// Reverse index: canonical skill -> every alias that normalizes to it (plus
// itself). Built once so `textMentionsSkill` doesn't rescan the whole
// SKILL_NORMALIZATION map on every call.
const CANONICAL_TO_VARIANTS = new Map();
KNOWN_SKILLS.forEach((skill) => CANONICAL_TO_VARIANTS.set(skill, [skill]));
Object.entries(SKILL_NORMALIZATION).forEach(([alias, canonical]) => {
  if (!CANONICAL_TO_VARIANTS.has(canonical)) return;
  CANONICAL_TO_VARIANTS.get(canonical).push(alias);
});

function wholeWordPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#./])${escaped}($|[^a-z0-9+#./])`, "i");
}
// Clean a raw string for comparison: lowercase, collapse punctuation-as-space
// EXCEPT characters that are meaningful inside skill names (., +, #, /), then
// collapse whitespace.
export function cleanText(raw) {
  return raw
    .toLowerCase()
    .replace(/[_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a raw term to a canonical KNOWN_SKILLS entry, if possible.
 * Returns { canonical, isKnown, matchType } where matchType is
 * "exact" (already canonical / literal match) or "normalized"
 * (resolved via the SKILL_NORMALIZATION alias map), or null if the term
 * doesn't resolve to any known skill at all.
 */
export function resolveSkill(rawTerm) {
  const cleaned = cleanText(rawTerm);
  if (!cleaned) return null;

  if (KNOWN_SKILLS_SET.has(cleaned)) {
    return { canonical: cleaned, isKnown: true, matchType: "exact" };
  }

  if (SKILL_NORMALIZATION[cleaned]) {
    const canonical = SKILL_NORMALIZATION[cleaned];
    if (KNOWN_SKILLS_SET.has(canonical)) {
      return { canonical, isKnown: true, matchType: "normalized" };
    }
  }

  // Not a recognized technical skill — still return the cleaned term so
  // callers can decide what to do (e.g. keep an unrecognized user-entered
  // skill as a raw display string without treating it as a catalog skill).
  return { canonical: cleaned, isKnown: false, matchType: "unrecognized" };
}

// Pretty-print a canonical (lowercase) skill name for display in the UI.
// A small explicit map covers acronyms/special casing; anything else falls
// back to a sensible title-case.
const DISPLAY_OVERRIDES = {
  "html": "HTML", "css": "CSS", "sql": "SQL", "aws": "AWS", "gcp": "GCP",
  "api development": "API Development", "rest api": "REST API",
  "ci/cd": "CI/CD", "ui/ux design": "UI/UX Design", "nlp": "NLP",
  "node.js": "Node.js", "next.js": "Next.js", "vs code": "VS Code",
  "c++": "C++", "c#": "C#", ".net": ".NET", "asp.net": "ASP.NET",
  "graphql": "GraphQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
  "mongodb": "MongoDB", "sqlite": "SQLite", "dynamodb": "DynamoDB",
  "javascript": "JavaScript", "typescript": "TypeScript",
  "object-oriented programming": "Object-Oriented Programming",
  "data structures and algorithms": "Data Structures & Algorithms",
  "power bi": "Power BI", "tensorflow": "TensorFlow", "pytorch": "PyTorch",
  "scikit-learn": "Scikit-learn", "opencv": "OpenCV", "ios": "iOS",
  "sql server": "SQL Server", "vue": "Vue.js", "react": "React",
  "angular": "Angular", "spring boot": "Spring Boot", "php": "PHP",
};

export function displaySkill(canonical) {
  if (DISPLAY_OVERRIDES[canonical]) return DISPLAY_OVERRIDES[canonical];
  return canonical.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Scan a block of free text for every KNOWN_SKILLS term it mentions —
 * checking canonical spellings AND every normalization alias (e.g. text
 * that says "ReactJS" or "NodeJS" must still register as "react" /
 * "node.js"). Both the JD parser and the resume normalizer need this exact
 * same alias-aware scan, so it lives here once rather than being
 * reimplemented (and potentially drifting out of sync) in two places.
 *
 * Always returns canonical (deduped) skill names, as an array.
 */
export function scanTextForKnownSkills(text) {
  const lower = ` ${(text || "").toLowerCase()} `;
  const found = new Set();

  const checkTerm = (term, canonicalOutput) => {
    if (wholeWordPattern(term).test(lower)) found.add(canonicalOutput);
  };

  KNOWN_SKILLS.forEach((skill) => checkTerm(skill, skill));
  Object.entries(SKILL_NORMALIZATION).forEach(([alias, canonical]) => {
    if (KNOWN_SKILLS_SET.has(canonical)) checkTerm(alias, canonical);
  });

  return [...found];
}

/**
 * Word-boundary-safe, alias-aware check for whether a block of text
 * mentions ONE specific canonical skill — checking the canonical spelling
 * AND every known alias of it (e.g. checking "node.js" also matches text
 * that says "NodeJS"). This is the building block experience/project/role
 * relevance analyzers should use instead of ad-hoc `text.includes(...)`,
 * which is neither alias-aware nor safe against partial-word false
 * positives (e.g. plain `.includes("java")` wrongly matching inside
 * "javascript").
 */
export function textMentionsSkill(text, canonicalSkill) {
  const lower = ` ${(text || "").toLowerCase()} `;
  const variants = CANONICAL_TO_VARIANTS.get(canonicalSkill) || [canonicalSkill];
  return variants.some((variant) => wholeWordPattern(variant).test(lower));
}