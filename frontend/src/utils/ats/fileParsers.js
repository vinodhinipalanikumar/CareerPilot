// src/utils/ats/fileParsers.js
//
// Extracts raw text from an uploaded PDF or DOCX File object, entirely in
// the browser (no backend). This is the FIRST step of the Upload Resume
// path only — it never scores anything; it just turns a file into plain
// text for resumeParser.js to structure.
//
// Failure modes are surfaced as thrown Errors with a user-facing message so
// ATSAnalysis.jsx can show a real error instead of ever faking a score for
// a file that couldn't actually be read.

import * as pdfjsLib from "pdfjs-dist";
// Vite `?url` import resolves to the built worker asset's final URL, which
// is what pdfjs-dist needs to spin up its text-extraction worker.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MIN_EXTRACTED_TEXT_LENGTH = 40;

async function extractPdfText(file) {
  let pdf;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch {
    throw new Error("This PDF could not be opened. It may be corrupted, password-protected, or not a valid PDF file.");
  }

  let text = "";
  const linkUrls = new Set();
  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      text += `${reconstructLines(content.items)}\n`;

      // A clickable hyperlink's visible TEXT (e.g. a "GitHub" icon/word, or
      // display text that differs from the URL) never contains the actual
      // URL — that only lives in the PDF's link annotation. getTextContent()
      // above only ever sees the rendered glyphs, so without this, a resume
      // whose GitHub/LinkedIn link is styled as an icon or as text like
      // "My GitHub Profile" would have that URL silently lost, and every
      // downstream "is there a GitHub link?" check would wrongly say no
      // even though the resume genuinely has one.
      try {
        const annotations = await page.getAnnotations();
        annotations.forEach((a) => {
          if (a?.subtype === "Link" && typeof a.url === "string" && a.url) {
            linkUrls.add(a.url);
          }
        });
      } catch {
        // Best-effort — a page with unreadable annotations just contributes
        // no extra links; visible-text extraction above is unaffected.
      }
    }
  } catch {
    throw new Error("This PDF's content could not be read. It may be corrupted.");
  }

  // Append every hyperlink target found in annotations as its own line so
  // resumeParser.js's link-detection regexes (which scan plain text) pick
  // these up exactly the same way as a URL that was already visible as
  // text on the page.
  if (linkUrls.size > 0) {
    text += `\n${Array.from(linkUrls).join("\n")}\n`;
  }

  if (text.trim().length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error(
      "No readable text was found in this PDF. It may be a scanned image rather than a text-based PDF — please upload a text-based PDF or DOCX file instead."
    );
  }

  return text;
}

/** pdf.js's getTextContent() returns a flat list of text fragments with
 *  their position on the page — it does NOT tell you where line breaks are.
 *  Naively joining every fragment with a space collapses an entire page
 *  into one giant line, which breaks any downstream logic that looks for a
 *  heading ("PROJECTS", "INTERNSHIP", etc.) sitting alone on its own line.
 *  This reconstructs real line breaks by watching each fragment's Y
 *  position: a meaningful vertical jump means a new line. */
function reconstructLines(items) {
  let result = "";
  let prevY = null;
  let prevEndX = null;

  items.forEach((item) => {
    const str = "str" in item ? item.str : "";
    const y = item.transform?.[5];
    const x = item.transform?.[4];

    if (prevY !== null && typeof y === "number" && Math.abs(y - prevY) > 2) {
      result += "\n";
    } else if (
      result &&
      !result.endsWith("\n") &&
      !result.endsWith(" ") &&
      typeof x === "number" &&
      typeof prevEndX === "number" &&
      x - prevEndX > 1
    ) {
      // Same line, but a visible gap between fragments (e.g. separate
      // table-like columns of text) — keep them from running together.
      result += " ";
    }

    result += str;
    if (typeof y === "number") prevY = y;
    if (typeof x === "number" && item.width) prevEndX = x + item.width;
  });

  return result;
}

async function extractDocxText(file) {
  let mammoth;
  try {
    mammoth = (await import("mammoth")).default;
  } catch {
    throw new Error("The DOCX reader could not be loaded. Please try again.");
  }

  let result;
  try {
    const arrayBuffer = await file.arrayBuffer();
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch {
    throw new Error("This DOCX file could not be opened. It may be corrupted or not a valid Word document.");
  }

  let text = result?.value || "";
  if (text.trim().length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error("No readable text was found in this DOCX file. Please check the file and try again.");
  }

  // `extractRawText` returns plain text only — it drops every hyperlink's
  // actual target, keeping just the visible display text. A GitHub/LinkedIn
  // link whose display text is a name, an icon, or "Click here" would
  // otherwise vanish entirely. `convertToHtml` (same file, no re-parse of
  // disk) preserves <a href> targets, so pull those out and append them as
  // plain-text lines for resumeParser.js's link regexes to find.
  try {
    const arrayBuffer2 = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer2 });
    const hrefs = new Set();
    const hrefPattern = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefPattern.exec(html)) !== null) {
      if (match[1] && !match[1].startsWith("#")) hrefs.add(match[1]);
    }
    if (hrefs.size > 0) {
      text += `\n${Array.from(hrefs).join("\n")}\n`;
    }
  } catch {
    // Best-effort — if this fails, we still return the raw text extracted
    // above rather than failing the whole upload.
  }

  return text;
}

/** Extract raw text from an uploaded resume File (PDF or DOCX). Throws with
 *  a user-facing message on any failure — callers must not fall back to a
 *  fake/zero analysis result when this rejects. */
export async function extractResumeText(file) {
  if (!file) throw new Error("No file was provided.");

  const name = (file.name || "").toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isPdf) return extractPdfText(file);
  if (isDocx) return extractDocxText(file);

  throw new Error("Unsupported file type. Please upload a .pdf or .docx file.");
}

// --- Layout/format-risk detection ------------------------------------------
//
// Real, best-effort signals about things that are known to sometimes trip up
// ATS text parsers — tables, multi-column layouts, embedded images. This is
// intentionally NOT a certainty: results feed atsCompatibilityAnalyzer.js,
// which is careful to phrase everything as "may reduce compatibility" rather
// than a definitive pass/fail. If detection itself fails for any reason,
// this returns null so the caller treats the risk as simply "unknown"
// instead of guessing.

async function detectPdfFormatRisk(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let hasImages = false;
    let imageCount = 0;
    let multiColumnPageCount = 0;
    const pagesToSample = Math.min(pdf.numPages, 5); // sample for performance on long resumes

    for (let pageNum = 1; pageNum <= pagesToSample; pageNum++) {
      const page = await pdf.getPage(pageNum);

      try {
        const opList = await page.getOperatorList();
        const imageOpCount = opList.fnArray.filter(
          (fn) => fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject
        ).length;
        if (imageOpCount > 0) {
          hasImages = true;
          imageCount += imageOpCount;
        }
      } catch {
        // Per-page image detection failing shouldn't abort the whole check.
      }

      try {
        const content = await page.getTextContent();
        const xPositions = content.items.map((it) => it.transform?.[4]).filter((x) => typeof x === "number");
        if (xPositions.length > 12) {
          const min = Math.min(...xPositions);
          const max = Math.max(...xPositions);
          const span = max - min;
          if (span > 0) {
            const mid = (min + max) / 2;
            const margin = span * 0.15;
            const leftCount = xPositions.filter((x) => x < mid - margin).length;
            const rightCount = xPositions.filter((x) => x > mid + margin).length;
            // A genuine two-column layout puts a meaningful share of text
            // start-positions clearly left AND clearly right of center.
            if (leftCount / xPositions.length > 0.25 && rightCount / xPositions.length > 0.25) {
              multiColumnPageCount++;
            }
          }
        }
      } catch {
        // Per-page column detection failing shouldn't abort the whole check.
      }
    }

    return {
      hasTables: false, // not reliably detectable from a PDF text layer without full layout analysis
      hasMultiColumn: multiColumnPageCount > 0,
      hasImages,
      imageCount,
    };
  } catch {
    return null;
  }
}

async function detectDocxFormatRisk(file) {
  try {
    const mammoth = (await import("mammoth")).default;
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    const hasTables = /<table[\s>]/i.test(html);
    const imageMatches = html.match(/<img[\s>]/gi) || [];

    return {
      hasTables,
      hasMultiColumn: false, // section/column layout isn't reliably exposed via mammoth's HTML output
      hasImages: imageMatches.length > 0,
      imageCount: imageMatches.length,
    };
  } catch {
    return null;
  }
}

/** Best-effort layout/format-risk detection for an uploaded resume file.
 *  Returns null (never throws) if detection isn't possible — callers should
 *  treat that as "unknown risk", not "no risk" or "high risk". */
export async function detectFormatRisk(file) {
  if (!file) return null;
  const name = (file.name || "").toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isPdf) return detectPdfFormatRisk(file);
  if (isDocx) return detectDocxFormatRisk(file);
  return null;
}
