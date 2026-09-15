// src/utils/ats/normalizeResumeText.js
//
// A common, well-documented PDF export bug (seen constantly in Canva/Word
// exports with subsetted fonts) silently corrupts specific ligature glyphs
// ("ti", "tt", "ffi"...) into stray characters when the font's character
// map is broken: "Application" extracts as "ApplicaSon", "Flutter" as
// "Flu_er", "multi-screen" as "mulS-screen". This is a PDF EXTRACTION
// problem, not a spelling mistake the candidate made — so it must never be
// reported to the user as a writing error.
//
// This module runs BEFORE section detection so headings like "PROJECTS" or
// "INTERNSHIP" that happen to contain a corrupted ligature are still
// recognized, and so skill names like "Flutter" are matched correctly.
//
// Strategy (deliberately controlled, not a blind find/replace):
//   1. Unicode NFKC normalization (composed forms, full-width punctuation, etc).
//   2. Direct, deterministic ligature-character replacement (safe: these
//      Unicode ligature codepoints always mean the same underlying letters).
//   3. A curated dictionary of common, general (not resume-specific)
//      ligature-corruption corrections.
//   4. A generic, guarded pattern pass: a word containing a single stray
//      capital letter or underscore in a lowercase word is only "fixed" if
//      substituting the classic corrupted ligature ("ti"/"tt"/"ffi") back in
//      produces a real, recognizable word (checked against the app's own
//      technical-skill dictionary plus a short list of common English
//      suffixes) — so this never rewrites things that merely *look* odd.
// Every correction made is recorded (word-level, before → after) so callers
// can show it as a "Parsing issue" instead of a spelling mistake, and so the
// original extracted text is never silently discarded.

import { KNOWN_SKILLS } from "../../data/ats/skills.js";

const LIGATURE_MAP = {
  "\uFB00": "ff", "\uFB01": "fi", "\uFB02": "fl",
  "\uFB03": "ffi", "\uFB04": "ffl", "\uFB05": "st", "\uFB06": "st",
};

// General, resume-agnostic corrections for the exact corruption pattern
// this bug produces (a dropped "ti"/"tt" ligature). Not specific to any one
// candidate's resume — these are common English/tech words that legitimately
// contain "ti" or "tt" and therefore turn up often across resumes.
const KNOWN_CORRECTIONS = {
  applicason: "application", applicasons: "applications",
  informason: "information", funcson: "function", funcsons: "functions",
  posison: "position", soluson: "solution", solusons: "solutions",
  opsmize: "optimize", opsmizason: "optimization",
  animason: "animation", animasons: "animations", muls: "multi",
  situason: "situation",
};

// Suffixes that make a "restore the ligature" guess trustworthy — if
// putting "ti" or "tt" back in produces a word ending in one of these,
// it's very likely a genuine restoration rather than a coincidence.
const TRUSTED_SUFFIXES = ["tion", "tions", "tional", "tial", "tics", "tics", "ttle", "tten", "tter", "tters"];

function isKnownTechTerm(word) {
  return KNOWN_SKILLS.includes(word.toLowerCase());
}

/** Preserve the original word's capitalization style on the corrected word
 *  (e.g. "MulS" corrected to "multi" should render as "Multi", not "multi"). */
function matchCase(original, corrected) {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return corrected.toUpperCase();
  }
  if (original[0] === original[0]?.toUpperCase() && original[0] !== original[0]?.toLowerCase()) {
    return corrected[0].toUpperCase() + corrected.slice(1);
  }
  return corrected;
}

/** Try restoring a single stray capital letter (e.g. the "S" in
 *  "ApplicaSon") back into the "ti"/"tt" ligature it likely replaced.
 *  Returns the corrected word, or null if no confident correction exists. */
function tryRestoreLigature(word) {
  const strayCapMatch = word.match(/^([a-z]+)([A-Z])([a-z]+)$/);
  if (strayCapMatch) {
    const [, before, , after] = strayCapMatch;
    for (const replacement of ["ti", "tt"]) {
      const candidate = `${before}${replacement}${after}`;
      if (isKnownTechTerm(candidate) || TRUSTED_SUFFIXES.some((s) => candidate.toLowerCase().endsWith(s))) {
        return candidate;
      }
    }
  }

  // Underscore mid-word (e.g. "Flu_er" -> "Flutter") — pdfjs sometimes
  // extracts the missing glyph as a literal underscore instead.
  const underscoreMatch = word.match(/^([A-Za-z]+)_([A-Za-z]+)$/);
  if (underscoreMatch) {
    const [, before, after] = underscoreMatch;
    for (const replacement of ["tt", "ti"]) {
      const candidate = `${before}${replacement}${after}`;
      if (isKnownTechTerm(candidate) || TRUSTED_SUFFIXES.some((s) => candidate.toLowerCase().endsWith(s))) {
        return candidate;
      }
    }
  }

  return null;
}

/** Normalize raw extracted resume text before section detection / analysis.
 *  Returns { text, corrections } — `corrections` is a list of
 *  { original, corrected } word-level fixes actually applied, so the UI can
 *  show them as parsing issues rather than spelling mistakes. Never mutates
 *  words it isn't confident about. */
export function normalizeResumeText(rawText) {
  if (!rawText) return { text: "", corrections: [] };

  let text = rawText.normalize("NFKC");

  // Deterministic ligature-character replacement (always correct).
  text = text.replace(/[\uFB00-\uFB06]/g, (ch) => LIGATURE_MAP[ch] || ch);

  // Collapse repeated whitespace within a line (but keep newlines, which
  // fileParsers.js now reconstructs from PDF layout — see that file).
  text = text.replace(/[ \t]+/g, " ");
  // Normalize common bullet glyphs to a single "-" so downstream bullet
  // detection doesn't need to special-case every font's bullet character.
  text = text.replace(/^[ \t]*[•●▪◦‣∙·][ \t]*/gm, "- ");

  const corrections = [];
  const words = text.split(/(\s+)/); // keep whitespace tokens so we can rejoin exactly

  const fixedWords = words.map((token) => {
    if (/^\s+$/.test(token)) return token;

    // Handle hyphenated compounds ("mulS-screen") by correcting each part
    // independently, since the corruption can land on either side.
    if (token.includes("-")) {
      const parts = token.split("-");
      let changed = false;
      const fixedParts = parts.map((part) => {
        const fixed = fixToken(part);
        if (fixed !== part) changed = true;
        return fixed;
      });
      return changed ? fixedParts.join("-") : token;
    }

    return fixToken(token);
  });

  function fixToken(token) {
    const stripped = token.replace(/^[^\w]+|[^\w]+$/g, "");
    if (!stripped) return token;

    const lowerKey = stripped.toLowerCase();
    if (KNOWN_CORRECTIONS[lowerKey]) {
      const corrected = matchCase(stripped, KNOWN_CORRECTIONS[lowerKey]);
      corrections.push({ original: stripped, corrected });
      return token.replace(stripped, corrected);
    }

    const restored = tryRestoreLigature(stripped);
    if (restored) {
      corrections.push({ original: stripped, corrected: restored });
      return token.replace(stripped, restored);
    }

    return token;
  }

  return { text: fixedWords.join(""), corrections };
}
