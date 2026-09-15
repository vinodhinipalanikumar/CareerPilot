// src/utils/ats/jdParser.js
//
// Deterministic, rule-based Job Description parser. No AI, no randomness —
// every field is derived from explicit regex/keyword rules so results are
// reproducible and explainable.
//
// This intentionally does NOT treat every capitalized phrase as a skill.
// Only terms that resolve to KNOWN_SKILLS (directly or via normalization)
// are ever classified as a "skill" — soft-skill phrases like
// "team environment" are explicitly filtered out (see SOFT_SKILL_STOPWORDS).

import { SOFT_SKILL_STOPWORDS, DEGREE_LEVELS, TECH_EDUCATION_FIELDS } from "../../data/ats/skills.js";
import { cleanText, scanTextForKnownSkills } from "./skillNormalizer.js";

const HEADING_PATTERNS = {
  preferred: /\b(preferred|nice[\s-]?to[\s-]?have|good[\s-]?to[\s-]?have|bonus|plus)\b/i,  required: /\b(required|requirements?|must[\s-]?have|qualifications?|what you.?ll need|minimum qualifications?)\b/i,
  responsibilities: /\b(responsibilit(y|ies)|what you.?ll do|role\s*overview|duties|key\s*tasks)\b/i,
  education: /\b(education|academic)\b/i,
  skills: /\b(skills?|tech(nical)? stack|technolog(y|ies))\b/i,
};

const GENERIC_STOPWORDS = new Set([
  "the","and","for","with","this","that","from","have","will","your","you","our",
  "are","not","all","can","who","job","role","work","team","about","into","such",
  "using","across","strong","excellent","ability","looking","candidate","candidates",
  "experience","years","year","knowledge","understanding","including","other","best",
  "opportunity","company","required","preferred","responsibilities","requirements",
  "environment","description","overview","apply","position","join","help","also",
  "more","than","very","some","most","their","what","when","where","which","should",
  "must","need","needs","ensure","various","hands","strong","good","great",
]);

const CERTIFICATION_KEYWORDS = [
  "aws certified", "microsoft certified", "google certified", "oracle certified",
  "pmp", "scrum master", "csm", "comptia", "ccna", "cissp", "azure fundamentals",
];

function splitIntoLines(text) {
  return text.split(/\r?\n/).map((l) => l.trim());
}

function detectHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return null;
  const isHeadingish = /:$/.test(trimmed) || trimmed === trimmed.toUpperCase();
  for (const [key, pattern] of Object.entries(HEADING_PATTERNS)) {
    if (pattern.test(trimmed) && (isHeadingish || trimmed.split(/\s+/).length <= 6)) {
      return key;
    }
  }
  return null;
}

/** Split JD text into named sections based on detected headings. Anything
 *  before the first heading is treated as "general" (job summary/intro). */
function splitSections(text) {
  const lines = splitIntoLines(text);
  const sections = { general: [] };
  let current = "general";

  lines.forEach((line) => {
    const heading = detectHeading(line);
    if (heading) {
      current = heading;
      if (!sections[current]) sections[current] = [];
      return; // heading line itself isn't content
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  });

  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join(" ")])
  );
}

function findKnownSkillsInText(text) {
  return scanTextForKnownSkills(text);
}

function detectJobTitle(text) {
  const explicit = text.match(/(?:job title|position|role)\s*[:-]\s*(.+)/i);
  if (explicit && explicit[1]) return explicit[1].trim().split(/\r?\n/)[0].slice(0, 80);

  const firstLine = splitIntoLines(text).find((l) => l.length > 0);
  if (firstLine && firstLine.length <= 80 && !/[.]$/.test(firstLine)) {
    return firstLine;
  }
  return null;
}

function detectExperienceYears(text) {
  const match = text.match(/(\d+)\s*\+?\s*(?:to\s*\d+\s*)?years?/i);
  return match ? parseInt(match[1], 10) : null;
}

const SOFT_PREFERENCE_MARKERS = /\b(is a plus|a plus|nice[\s-]?to[\s-]?have|good[\s-]?to[\s-]?have|is a bonus|as a bonus|bonus but|not required|not mandatory|not essential|would be (a|an)?\s*(plus|bonus|advantage))\b/i;

function splitIntoSentences(text) {
  return text
    .replace(/\r?\n/g, ". ")
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Skills mentioned in a sentence that carries an inline soft-preference
 *  marker (e.g. "Familiarity with Docker is a plus, not required") should be
 *  treated as preferred even when the JD has no dedicated "Preferred:"
 *  section — this is the confidence-based fallback the product spec calls
 *  for, instead of defaulting every unlabeled skill straight to "required". */
function findInlineSoftPreferenceSkills(text) {
  const found = new Set();
  splitIntoSentences(text).forEach((sentence) => {
    if (SOFT_PREFERENCE_MARKERS.test(sentence)) {
      findKnownSkillsInText(sentence).forEach((s) => found.add(s));
    }
  });
  return found;
}

function detectEducation(text) {
  const lower = text.toLowerCase();
  let level = null;
  DEGREE_LEVELS.forEach((entry) => {
    entry.terms.forEach((term) => {
      if (lower.includes(term)) level = level === null ? entry.level : Math.max(level, entry.level);
    });
  });
  const fields = TECH_EDUCATION_FIELDS.filter((field) => lower.includes(field));
  return { level, fields };
}

function detectCertifications(text) {
  const lower = text.toLowerCase();
  return CERTIFICATION_KEYWORDS.filter((cert) => lower.includes(cert));
}

/** Frequency-based extraction of non-skill "domain keywords" — words that
 *  matter to the posting but aren't in the technical skill catalog (e.g.
 *  "scalable", "distributed", "microservices" if not already caught above). */
function extractDomainKeywords(text, alreadyFoundSkills) {
  const skillWordSet = new Set(
    alreadyFoundSkills.flatMap((s) => cleanText(s).split(" "))
  );

  let cleaned = text.toLowerCase();
  SOFT_SKILL_STOPWORDS.forEach((phrase) => {
    cleaned = cleaned.replaceAll(phrase, " ");
  });

  const words = cleaned.match(/[a-z][a-z0-9-]{3,}/g) || [];
  const freq = new Map();
  words.forEach((w) => {
    if (GENERIC_STOPWORDS.has(w) || skillWordSet.has(w)) return;
    freq.set(w, (freq.get(w) || 0) + 1);
  });

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}

/**
 * Parse raw Job Description text into a structured requirements object.
 */
export function parseJobDescription(rawText) {
  const text = (rawText || "").trim();
  if (!text) return null;

  const sections = splitSections(text);
  const jobTitle = detectJobTitle(text);

  const preferredText = sections.preferred || "";
  const preferredSkills = new Set(findKnownSkillsInText(preferredText));

  // Confidence-based fallback: even without a dedicated "Preferred:" section,
  // a skill mentioned alongside soft-preference wording anywhere in the JD
  // (e.g. "Docker is a plus") is treated as preferred, not required.
  findInlineSoftPreferenceSkills(text).forEach((s) => preferredSkills.add(s));

  // Everything else recognized anywhere in the JD, minus whatever was
  // already classified as preferred, counts as required — this matches the
  // instruction to distinguish required vs preferred only where the JD
  // gives enough evidence, defaulting to "required" otherwise.
  const allSkills = findKnownSkillsInText(text);
  const requiredSkills = allSkills.filter((s) => !preferredSkills.has(s));

  const education = detectEducation(text);
  const experienceYears = detectExperienceYears(text);
  const certifications = detectCertifications(text);
  const domainKeywords = extractDomainKeywords(text, allSkills);

  return {
    jobTitle,
    requiredSkills,
    preferredSkills: [...preferredSkills],
    education,
    experienceYears,
    certifications,
    domainKeywords,
    responsibilitiesText: sections.responsibilities || "",
    rawText: text,
  };
}