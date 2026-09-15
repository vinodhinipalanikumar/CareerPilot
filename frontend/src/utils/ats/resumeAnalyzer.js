// src/utils/ats/resumeAnalyzer.js
//
// Single entry point the UI (ATSAnalysis.jsx) calls. It does not implement
// any scoring itself — it only decides which existing engine mode to run:
//
//   - No usable resume data at all              -> { mode: "insufficient-data" }
//   - Job description text provided (Mode A)     -> jobMatchScorer.runJobMatchAnalysis
//   - Job description left empty (Mode B)        -> careerFitScorer.runCareerFitAnalysis
//
// This is intentionally the ONLY new "orchestration" logic added — no new
// scoring methodology, no new heuristics. It never fabricates a score: if
// the resume has too little content to analyze responsibly, it says so
// instead of returning a number.

import { hasMinimalContent } from "./resumeNormalizer.js";
import { parseJobDescription } from "./jdParser.js";
import { runJobMatchAnalysis } from "./jobMatchScorer.js";
import { runCareerFitAnalysis } from "./careerFitScorer.js";
import { scoreBandLabel, buildScoreSummary } from "./scoreInterpretation.js";

export function runAtsAnalysis(resume, jobDescriptionText) {
  if (!resume || !hasMinimalContent(resume)) {
    return { mode: "insufficient-data" };
  }

  const trimmedJD = (jobDescriptionText || "").trim();

  const result =
    trimmedJD.length > 0
      ? runJobMatchAnalysis(resume, parseJobDescription(trimmedJD))
      : runCareerFitAnalysis(resume);

  // Plain-language score interpretation, grounded in the actual breakdown —
  // shared logic so a "78" always reads the same way regardless of mode.
  result.scoreLabel = scoreBandLabel(result.overallScore);
  result.scoreSummary = buildScoreSummary(result.overallScore, result.breakdown, {
    jobSpecific: result.mode === "job-match",
  });

  return result;
}
