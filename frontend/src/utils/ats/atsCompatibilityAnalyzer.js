// src/utils/ats/atsCompatibilityAnalyzer.js
//
// ATS Compatibility is deliberately a SEPARATE concept from both
// structureAnalyzer.js (content organization: sections, summary, contact
// completeness) and keyword matching (jobMatchScorer.js): a resume can have
// perfect keyword coverage and a well-organized skills/experience list while
// still being built in a way that's risky for real-world ATS text
// extraction (tables, multi-column layouts, embedded images/graphics,
// text boxes, unusual symbols). This module scores THAT risk.
//
// A CareerPilot-built resume carries none of this risk by construction — it
// is generated from structured data, not a laid-out document — so it always
// gets a high, but not absolute, compatibility score (we still avoid ever
// claiming a "guaranteed" pass). An uploaded PDF/DOCX is scored from the
// real, detected layout risk signals gathered in fileParsers.js
// (`resume.meta.formatRisk`), never guessed.

const str = (v) => (typeof v === "string" ? v : "");

function evaluateExtractedTextQuality(rawText) {
  const text = str(rawText);
  if (!text.trim()) return { risky: false, note: null };

  // A rough "garbled extraction" signal: PDFs with unusual layouts often
  // extract with very short average line lengths (columns/cells reduced to
  // one or two words per line) or an unusually high ratio of non-alphanumeric
  // characters. This is a heuristic, not a certainty — worded accordingly.
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const avgLineLen = lines.length ? text.length / lines.length : text.length;
  const symbolRatio = (text.match(/[^a-zA-Z0-9\s.,;:()/@%+-]/g) || []).length / Math.max(1, text.length);

  if (avgLineLen < 12 && lines.length > 15) {
    return { risky: true, note: "The extracted text is broken into many very short lines, which can happen with multi-column or table-heavy layouts and may affect ATS parsing." };
  }
  if (symbolRatio > 0.08) {
    return { risky: true, note: "The extracted text contains an unusually high number of special symbols or unusual characters, which some ATS parsers may not handle cleanly." };
  }
  return { risky: false, note: null };
}

export function analyzeAtsCompatibility(resume) {
  const observations = [];

  if (resume.meta?.source === "careerpilot") {
    return {
      score: 96,
      observations: [
        "Built directly through CareerPilot's structured resume builder, so there's no table, column, or image-based parsing risk to estimate.",
      ],
    };
  }

  // Uploaded resume path.
  let score = 100;
  const risk = resume.meta?.formatRisk || null;
  const rawText = resume.meta?.rawText || "";

  if (!rawText.trim()) {
    return {
      score: 30,
      observations: ["Very little extractable text was found in this file, which is a strong ATS-compatibility risk on its own."],
    };
  }

  if (risk) {
    if (risk.hasTables) {
      score -= 15;
      observations.push("Tables were detected in the document. Tables may reduce compatibility with some ATS parsers.");
    }
    if (risk.hasMultiColumn) {
      score -= 15;
      observations.push("A multi-column layout was detected. Multi-column layout may affect parsing in some ATS systems.");
    }
    if (risk.hasImages) {
      score -= 10;
      observations.push(
        `${risk.imageCount > 1 ? `${risk.imageCount} images` : "An image"} ${risk.imageCount > 1 ? "were" : "was"} detected in the document. Images or graphics-based content are typically ignored by ATS text parsers, so any information inside them (e.g. a photo-based skills chart) won't be read.`
      );
    }
  }

  const textQuality = evaluateExtractedTextQuality(rawText);
  if (textQuality.risky) {
    score -= 10;
    observations.push(textQuality.note);
  }

  const p = resume.personalInfo || {};
  if (!str(p.email).trim()) {
    score -= 10;
    observations.push("No email address could be confidently extracted — this is important since most ATS platforms rely on it to file the application.");
  }
  if (!str(p.phone).trim()) {
    score -= 5;
    observations.push("No phone number could be confidently extracted from the document.");
  }

  score = Math.max(15, Math.min(100, score));

  if (observations.length === 0) {
    observations.push("No major ATS-compatibility risk indicators (tables, multi-column layout, embedded images) were detected in this document. This is an estimate, not a guarantee for any specific company's ATS.");
  }

  return { score, observations };
}
