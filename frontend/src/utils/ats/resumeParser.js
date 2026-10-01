// src/utils/ats/resumeParser.js
//
// Turns raw extracted resume text (from fileParsers.js) into the same
// canonical shape formDataAdapter.js produces for CareerPilot resumes, so
// resumeAnalyzer.js only ever has to understand ONE resume representation.
//
// Pipeline: normalize (fix PDF ligature-corruption artifacts) -> split into
// lines -> detect section headings (with aliases) -> split each section into
// one or more entries (numbered lists / date-range boundaries) -> extract
// fields per entry. Section-splitting on a real-world resume is inherently
// best-effort — headings and layouts vary — so this module ALWAYS keeps the
// full (normalized) text in `meta.rawText`; resumeNormalizer folds that into
// every downstream text scan, so skills/keywords mentioned anywhere in the
// document are still detected even if they weren't captured under a
// recognized section heading.

import { scanTextForKnownSkills, displaySkill } from "./skillNormalizer.js";
import { normalizeResumeText } from "./normalizeResumeText.js";

// Heading aliases: each key maps to every common real-world variant of that
// heading, so a resume isn't penalized just because it used a synonym.
//
// These are written WITHOUT a trailing `$` anchor on purpose. pdf.js does not
// emit line breaks; reconstructLines() infers them from Y positions, and with
// tight line spacing (or a horizontal rule under a heading) a heading very
// often ends up glued to the first line of its own content — e.g.
// "INTERNSHIP App Development Intern". Requiring the heading to sit alone on
// its line made every such section silently invisible, which is exactly how a
// resume that clearly HAS internships/projects got reported as having none.
// detectHeading() below therefore matches a heading at the START of a line and
// hands back whatever trailing text remains so it can be kept as content.
const HEADING_PATTERNS = {
  summary: /^(summary|professional summary|career objective|objective|profile|about me)\b\s*:?/i,
  education: /^(education|educational qualifications?|academic (background|qualifications?|details))\b\s*:?/i,
  skills: /^(technical skills|core competencies|key skills|technical proficiencies|skills( (and|&) (abilities|competencies))?|technologies)\b\s*:?/i,
  projects: /^(academic projects|personal projects|college projects|final year projects|key projects|projects)\b\s*:?/i,
  experience: /^(work experience|professional experience|employment( history)?|experience)\b\s*:?/i,
  internships: /^(internship experience|internships?|industrial training|training)\b\s*:?/i,
  certifications: /^(licenses? (and|&) certifications?|certifications?|certificates?)\b\s*:?/i,
  achievements: /^(achievements|accomplishments|awards|honou?rs)\b\s*:?/i,
  languages: /^languages\b\s*:?/i,
  interests: /^interests\b\s*:?/i,
  volunteerWork: /^volunteer( work| experience)?\b\s*:?/i,
};

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{8,}\d)/;

// --- Professional link extraction (GitHub / LinkedIn / portfolio) ---------
//
// ROOT CAUSE of the "GitHub reported as missing when the resume clearly has
// one" bug: this function previously didn't attempt to find these links AT
// ALL — extractPersonalInfo() only ever returned fullName/email/phone/
// summary, so personalInfo.github/linkedin/portfolio were always empty for
// every uploaded resume, regardless of what the document actually contains.
// (structureAnalyzer.js's "no professional link found" check was correct —
// it just never had a github/linkedin/portfolio value to check in the
// first place.)
//
// Real-world resumes write these many different ways, so this handles:
//   - Full URLs, with or without protocol/www: "https://github.com/user",
//     "github.com/user", "www.github.com/user"
//   - A labeled line with just a handle: "GitHub: username", "GitHub -
//     username", "LinkedIn – jane-doe"
//   - A labeled line with a full URL: "GitHub: https://github.com/user"
//   - Links whose visible hyperlink TEXT differs from the URL (e.g. a
//     "GitHub" icon linking to the real address) — fileParsers.js now
//     appends every PDF annotation / DOCX <a href> target as its own plain
//     line specifically so this scan can still find them.
const GITHUB_URL_PATTERN = /(https?:\/\/)?(www\.)?github\.com\/([a-z0-9][a-z0-9-]{0,38})(?:\/[^\s,;)"']*)?/i;
const LINKEDIN_URL_PATTERN = /(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/([a-z0-9\-_%]+)(?:\/[^\s,;)"']*)?/i;
// Negative lookbehind for "@" so the domain half of an email address
// (e.g. "jane@example.com") is never mistaken for a standalone portfolio
// URL. Deliberately NOT also using a trailing `(?!@)` lookahead to guard
// against an email's LOCAL part (e.g. "priya.sharma" in
// "priya.sharma@example.com", which otherwise matches the domain-shape
// pattern perfectly) — a negative lookahead right after a greedy `+`
// quantifier just makes the regex engine backtrack the match one
// character shorter instead of rejecting it outright (matching
// "priya.sharm", not rejecting "priya.sharma"). That's filtered out
// afterwards instead — see the `nextChar !== "@"` check in
// extractProfessionalLinks() below, which looks at the real character
// following each match in the original text.
const GENERIC_URL_PATTERN = /\b(?<!@)((https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s,;)"'<>]*)?)/gi;
const GITHUB_LABEL_PATTERN = /^(github)\s*[:\-–—]\s*(.+)$/i;
const LINKEDIN_LABEL_PATTERN = /^(linkedin)\s*[:\-–—]\s*(.+)$/i;
const PORTFOLIO_LABEL_PATTERN = /^(portfolio|personal website|website)\s*[:\-–—]\s*(.+)$/i;

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:)\]}>'"]+$/, "");
}

function withProtocol(url) {
  const cleaned = stripTrailingPunctuation(url.trim());
  if (!cleaned) return "";
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

/** A domain we should never mistake for someone's personal portfolio site —
 *  mainly common email/webmail providers that can otherwise show up in a
 *  generic URL scan via a stray "@gmail.com" fragment. */
const NON_PORTFOLIO_HOST_HINTS = ["gmail.", "yahoo.", "outlook.", "hotmail.", "icloud."];

// A resume is full of "word.word"-shaped text that is NOT a URL at all —
// degree abbreviations ("B.Tech", "M.Sc"), Latin abbreviations ("e.g.",
// "i.e."), version numbers, etc. — and the generic domain-shape regex above
// matches all of them just as happily as a real domain. Requiring an
// explicit protocol/"www." OR a real, common TLD is what tells "johndoe.dev"
// (a real personal-site pattern) apart from "B.Tech" (two capitalized
// syllables that merely happen to contain a dot).
const COMMON_TLDS = new Set([
  "com", "dev", "io", "me", "in", "co", "app", "tech", "xyz", "info", "design",
  "site", "page", "work", "studio", "art", "blog", "codes", "org", "net",
  "vercel", "netlify", "github", "gitlab", "cv", "pro", "space", "online",
]);

function hasRecognizedPortfolioShape(url) {
  const stripped = url.replace(/^https?:\/\//i, "");
  if (/^https?:\/\//i.test(url) || /^www\./i.test(stripped)) return true; // explicit signal
  // No explicit protocol/www: this is the branch that can collide with
  // ordinary resume text shaped like "word.word" (degree abbreviations
  // like "B.Tech"/"M.Sc", "e.g.", version numbers...). Real bare domains
  // are essentially always written lowercase in resumes ("johndoe.dev"),
  // while those abbreviations are capitalized — so require the match to be
  // all-lowercase as actually written, on top of a recognized TLD.
  if (url !== url.toLowerCase()) return false;
  const hostOnly = stripped.split("/")[0];
  const labels = hostOnly.split(".");
  const tld = labels[labels.length - 1]?.toLowerCase();
  return COMMON_TLDS.has(tld);
}

function looksLikePortfolioUrl(url) {
  const lower = url.toLowerCase();
  if (lower.includes("github.com") || lower.includes("linkedin.com")) return false;
  if (NON_PORTFOLIO_HOST_HINTS.some((h) => lower.includes(h))) return false;
  return hasRecognizedPortfolioShape(url);
}

/** Scan the full resume text (all lines + the whole blob, so it works
 *  whether the link sits on its own line, inline with other contact info,
 *  or was appended by fileParsers.js from a PDF/DOCX hyperlink target) for
 *  GitHub / LinkedIn / portfolio links. Never invents a link that isn't
 *  actually present in the text. */
function extractProfessionalLinks(lines, fullText) {
  let github = "";
  let linkedin = "";
  let portfolio = "";

  // Pass 1 — explicit labeled lines are the highest-confidence signal.
  for (const line of lines) {
    if (!github) {
      const m = line.match(GITHUB_LABEL_PATTERN);
      if (m) {
        const value = m[2].trim();
        github = /github\.com/i.test(value) ? withProtocol(value) : `https://github.com/${value.replace(/^@/, "")}`;
      }
    }
    if (!linkedin) {
      const m = line.match(LINKEDIN_LABEL_PATTERN);
      if (m) {
        const value = m[2].trim();
        linkedin = /linkedin\.com/i.test(value) ? withProtocol(value) : `https://www.linkedin.com/in/${value.replace(/^@/, "")}`;
      }
    }
    if (!portfolio) {
      const m = line.match(PORTFOLIO_LABEL_PATTERN);
      if (m) portfolio = withProtocol(m[2].trim());
    }
  }

  // Pass 2 — a bare URL anywhere in the document (own line, inline in the
  // header, or appended from a hyperlink annotation whose visible text
  // didn't contain the URL at all).
  if (!github) {
    const m = fullText.match(GITHUB_URL_PATTERN);
    if (m) github = withProtocol(m[0]);
  }
  if (!linkedin) {
    const m = fullText.match(LINKEDIN_URL_PATTERN);
    if (m) linkedin = withProtocol(m[0]);
  }
  if (!portfolio) {
    const matches = Array.from(fullText.matchAll(GENERIC_URL_PATTERN))
      .filter((m) => fullText[m.index + m[0].length] !== "@") // see comment on GENERIC_URL_PATTERN
      .map((m) => m[0]);
    const candidate = matches.find(looksLikePortfolioUrl);
    if (candidate) portfolio = withProtocol(candidate);
  }

  return { github, linkedin, portfolio };
}
const DATE_RANGE_PATTERN =
  /\b((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(-|–|—|to)\s*(present|current|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/i;
const NUMBERED_LINE_PATTERN = /^\d+[.)]\s*/;
const TECH_LINE_PATTERN = /^(technologies|tech stack|stack|tools)\s*:\s*/i;

function splitIntoLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Detect whether a line STARTS a new section. Returns
 *  `{ key, remainder }` when it does — `remainder` being any content that was
 *  glued onto the same extracted line after the heading word, which the
 *  caller keeps as the section's first content line so nothing is lost.
 *  Returns null when the line isn't a heading.
 *
 *  Guard: a heading word must be followed either by nothing, or by content on
 *  a SHORT line. A long line beginning with e.g. "Experience with React..."
 *  is prose, not a heading, so we don't want to treat it as a section break.
 *  Standalone headings (the common case) always win. */
function detectHeading(line) {
  const cleaned = line.replace(/[:\-–—]+$/, "").trim();

  // "Technologies: Flutter, Dart, Git" is an entry's own tech list (inside a
  // project/internship block), NOT a new Skills section. Only a bare
  // "Technologies" heading with no inline list counts as a section break.
  if (TECH_LINE_PATTERN.test(line)) return null;

  for (const [key, pattern] of Object.entries(HEADING_PATTERNS)) {
    const match = cleaned.match(pattern);
    if (!match) continue;

    const remainder = cleaned.slice(match[0].length).trim();

    // Standalone heading on its own line — unambiguous.
    if (remainder.length === 0) {
      if (cleaned.length > 45) return null;
      return { key, remainder: "" };
    }

    // Heading glued to content. This is only safe to accept on strong
    // evidence that the leading word really was a heading, because ordinary
    // prose can legitimately begin with "Experience with React..." or
    // "Projects included...". Two signals qualify:
    //   a) the heading was typed in ALL CAPS ("INTERNSHIP App Dev Intern") —
    //      how section headings are overwhelmingly written; or
    //   b) the heading is immediately followed by a colon ("Skills: Java, C++").
    // Anything else is treated as prose and left in the current section.
    const headingText = match[0].replace(/[\s:]+$/, "");
    const isAllCaps = headingText === headingText.toUpperCase() && /[A-Z]/.test(headingText);
    const hasColon = /^\s*:/.test(cleaned.slice(headingText.length));
    if ((isAllCaps || hasColon) && remainder.length <= 120) {
      return { key, remainder };
    }
    return null;
  }
  return null;
}

/** Split the resume into named sections based on detected headings.
 *  Everything before the first recognized heading is treated as the header
 *  block (name/contact/summary area). */
function splitSections(lines) {
  const sections = { header: [] };
  let current = "header";

  lines.forEach((line) => {
    const heading = detectHeading(line);
    if (heading) {
      current = heading.key;
      if (!sections[current]) sections[current] = [];
      // Content that pdf.js glued onto the heading line is real section
      // content — keep it rather than discarding it with the heading.
      if (heading.remainder) sections[current].push(heading.remainder);
      return;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  });

  return sections;
}

function guessFullName(headerLines) {
  const candidate = headerLines.find((line) => {
    if (line.length < 2 || line.length > 60) return false;
    if (EMAIL_PATTERN.test(line) || PHONE_PATTERN.test(line)) return false;
    // A plausible name: mostly letters/spaces/periods, 1-5 words.
    const words = line.split(/\s+/);
    if (words.length > 5) return false;
    return /^[A-Za-z.'\- ]+$/.test(line);
  });
  return candidate || "";
}

function extractPersonalInfo(headerLines, fullText, allLines) {
  const emailMatch = fullText.match(EMAIL_PATTERN);
  const phoneMatch = fullText.match(PHONE_PATTERN);
  const { github, linkedin, portfolio } = extractProfessionalLinks(allLines, fullText);
  return {
    fullName: guessFullName(headerLines),
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
    github,
    linkedin,
    portfolio,
    summary: "",
  };
}

/** Split a section's lines into one or more entries. Real resumes vary
 *  wildly here, so this tries two general (not resume-specific) signals, in
 *  order, and always falls back to treating the whole section as a single
 *  entry rather than guessing wrong:
 *   1. Numbered entries ("1. Hack The Lock", "2. Atsify") — an explicit,
 *      unambiguous signal when present.
 *   2. Date-range lines ("Apr 2026 - May 2026") — a new date range appearing
 *      after content has already been collected for the current entry
 *      usually marks the start of the next job/internship/project block. */
function splitSectionIntoEntryGroups(lines) {
  if (!lines || lines.length === 0) return [];

  const numberedIndexes = lines
    .map((l, i) => (NUMBERED_LINE_PATTERN.test(l) ? i : -1))
    .filter((i) => i !== -1);

  // BUG FIX (reproduced): this previously required 2+ numbered lines before
  // stripping the "1." prefix at all, so a section with exactly ONE numbered
  // entry ("1. Career Management System") fell through to the fallback
  // `return [lines]` below with the leading "1. " left glued onto the
  // project/entry title verbatim. A single numbered entry is just as
  // unambiguous a signal as two, so this now triggers on >= 1.
  if (numberedIndexes.length >= 1) {
    const groups = [];
    numberedIndexes.forEach((startIdx, i) => {
      const endIdx = i + 1 < numberedIndexes.length ? numberedIndexes[i + 1] : lines.length;
      const group = lines.slice(startIdx, endIdx);
      group[0] = group[0].replace(NUMBERED_LINE_PATTERN, "");
      groups.push(group);
    });
    return groups;
  }

  const dateLineIndexes = lines.map((l, i) => (DATE_RANGE_PATTERN.test(l) ? i : -1)).filter((i) => i !== -1);
  if (dateLineIndexes.length > 1) {
    // Each entry runs from just after the previous date line through the
    // next date line (the date line is usually the tail of that entry's
    // header, e.g. "Company Name | Apr 2026 - May 2026").
    const groups = [];
    let from = 0;
    dateLineIndexes.forEach((dateIdx, i) => {
      const to = i === dateLineIndexes.length - 1 ? lines.length : dateIdx + 1;
      groups.push(lines.slice(from, to));
      from = to;
    });
    return groups.filter((g) => g.length > 0);
  }

  return [lines];
}

function extractTechnologies(lines) {
  const techLine = lines.find((l) => TECH_LINE_PATTERN.test(l));
  return techLine ? techLine.replace(TECH_LINE_PATTERN, "").trim() : "";
}

function extractDateRange(lines) {
  for (const line of lines) {
    const match = line.match(DATE_RANGE_PATTERN);
    if (match) return match[0];
  }
  return "";
}

function buildProjectEntry(group) {
  const nonTechLines = group.filter((l) => !TECH_LINE_PATTERN.test(l));
  return {
    title: nonTechLines[0] || "Project (from uploaded resume)",
    description: nonTechLines.slice(1).join(" "),
    technologies: extractTechnologies(group),
  };
}

function buildExperienceEntry(group, fallbackTitle) {
  const nonTechLines = group.filter((l) => !TECH_LINE_PATTERN.test(l));
  const dateRange = extractDateRange(group);
  // First line is usually the role/title; the next non-date line (if short)
  // is usually the company/organization name.
  const title = nonTechLines[0] || fallbackTitle;
  const possibleCompany = nonTechLines[1];
  const company = possibleCompany && possibleCompany.length < 60 && !DATE_RANGE_PATTERN.test(possibleCompany)
    ? possibleCompany
    : "";
  const descriptionLines = nonTechLines
    .slice(company ? 2 : 1)
    // BUG FIX (reproduced): the date-range line (e.g. "Jun 2024 - Aug 2024")
    // was left inside descriptionLines AND separately extracted into
    // `dateRange` above, then both were joined together — producing
    // responsibilities text with the date range duplicated verbatim
    // ("Jun 2024 - Aug 2024 — Jun 2024 - Aug 2024 Worked on..."). Strip any
    // line that IS a date range from the description, since it's already
    // represented by `dateRange`.
    .filter((l) => !DATE_RANGE_PATTERN.test(l));
  return {
    title,
    company,
    dateRange,
    description: descriptionLines.join(" "),
    technologies: extractTechnologies(group),
  };
}

export function parseResumeText(rawText, formatRisk = null) {
  const original = (rawText || "").trim();
  const { text, corrections } = normalizeResumeText(original);
  const lines = splitIntoLines(text);
  const sections = splitSections(lines);
  const parseWarnings = [];

  const personalInfo = extractPersonalInfo(sections.header || [], text, lines);
  if (sections.summary?.length) {
    personalInfo.summary = sections.summary.join(" ");
  }
  if (!personalInfo.fullName) parseWarnings.push("Could not confidently detect a name in the document header.");
  if (!personalInfo.email) parseWarnings.push("No email address was detected.");
  if (corrections.length > 0) {
    parseWarnings.push(
      `${corrections.length} word${corrections.length === 1 ? " was" : "s were"} auto-corrected for likely PDF text-extraction corruption (e.g. font/ligature issues) — not a resume writing mistake.`
    );
  }

  // BUG FIX (reproduced): scanTextForKnownSkills(text) scans the WHOLE
  // document, including the contact-info lines that just gave us
  // personalInfo.github/linkedin above (e.g. "GitHub: github.com/johndoe").
  // Since "github" is (correctly) a recognized tool skill for resumes that
  // genuinely list "Git, GitHub" under Skills, that same word in a plain
  // contact link was being counted as a detected SKILL too — inflating
  // skill counts with something that was never claimed as a skill at all.
  // Strip the lines that produced the contact links before scanning for
  // skills, so a profile link is never double-counted as a technical skill.
  const skillScanText = lines
    .filter(
      (l) =>
        !GITHUB_LABEL_PATTERN.test(l) &&
        !LINKEDIN_LABEL_PATTERN.test(l) &&
        !PORTFOLIO_LABEL_PATTERN.test(l) &&
        !GITHUB_URL_PATTERN.test(l) &&
        !LINKEDIN_URL_PATTERN.test(l)
    )
    .join("\n");

  const detectedSkills = scanTextForKnownSkills(skillScanText).map((canonical) => ({
    category: "Detected",
    skillName: displaySkill(canonical),
    proficiency: "",
  }));

  const education = splitSectionIntoEntryGroups(sections.education).map((group) => ({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    description: group.join(" "),
  }));

  const projects = splitSectionIntoEntryGroups(sections.projects).map((group) => {
    const entry = buildProjectEntry(group);
    return { title: entry.title, description: entry.description, technologies: entry.technologies };
  });

  const workExperience = splitSectionIntoEntryGroups(sections.experience).map((group) => {
    const entry = buildExperienceEntry(group, "Experience (from uploaded resume)");
    return {
      company: entry.company,
      jobTitle: entry.title,
      responsibilities: [entry.dateRange, entry.description].filter(Boolean).join(" — "),
      technologies: entry.technologies,
    };
  });

  const internships = splitSectionIntoEntryGroups(sections.internships).map((group) => {
    const entry = buildExperienceEntry(group, "Internship (from uploaded resume)");
    return {
      company: entry.company,
      position: entry.title,
      responsibilities: [entry.dateRange, entry.description].filter(Boolean).join(" — "),
      technologies: entry.technologies,
    };
  });

  const certifications = (sections.certifications || [])
    .filter(Boolean)
    .map((line) => ({ name: line, organization: "" }));

  const achievements = (sections.achievements || [])
    .filter(Boolean)
    .map((line) => ({ title: line, description: "" }));

  return {
    personalInfo,
    education,
    skills: detectedSkills,
    projects,
    workExperience,
    internships,
    certifications,
    achievements,
    awards: [],
    publications: [],
    research: [],
    volunteerWork: (sections.volunteerWork || []).filter(Boolean).map((line) => ({ title: line, description: "" })),
    meta: {
      source: "upload",
      rawText: text,
      rawTextOriginal: original,
      corrections,
      parseWarnings: parseWarnings.filter(Boolean),
      formatRisk,
    },
  };
}
