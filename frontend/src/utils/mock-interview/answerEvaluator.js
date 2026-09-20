// src/utils/mock-interview/answerEvaluator.js
//
// CareerPilot has no external AI API configured, so per the Mock Interview
// spec this is a transparent, rule-based evaluator — NOT an AI grader.
// It scores an answer on three simple, explainable signals:
//   1. relevance   — how many of the question's resume-derived keywords
//                     actually show up in the answer
//   2. completeness — answer length, as a rough proxy for depth
//   3. communication — presence of explanation ("because", "which"...) and
//                       concrete-example language ("for example", "I built"...)
// These combine into a single 0-100 score and a good/needs-improvement/
// missing verdict. Nothing here is a black box: every number traces back
// to a rule above.

const EXPLANATION_MARKERS = [
  "because", "so that", "which allowed", "this helped", "in order to",
  "as a result", "which meant", "the reason", "due to",
];

const EXAMPLE_MARKERS = [
  "for example", "for instance", "e.g.", "specifically", "in particular",
  "i built", "i implemented", "i used", "i created", "i designed",
  "i wrote", "i developed", "i handled", "i worked on",
];

function wordCount(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

function includesAny(lowerText, markers) {
  return markers.some((m) => lowerText.includes(m));
}

function relevanceScore(answerLower, keywords) {
  if (!keywords || keywords.length === 0) return null; // no signal available
  const cleaned = keywords.filter(Boolean).map((k) => String(k).toLowerCase());
  if (cleaned.length === 0) return null;
  const matched = cleaned.filter((k) => answerLower.includes(k));
  return Math.round((matched.length / cleaned.length) * 100);
}

function completenessScore(words) {
  if (words < 8) return 15;
  if (words < 20) return 45;
  if (words < 40) return 70;
  if (words < 80) return 90;
  return 100;
}

function communicationScore(answerLower) {
  let score = 40;
  if (includesAny(answerLower, EXPLANATION_MARKERS)) score += 30;
  if (includesAny(answerLower, EXAMPLE_MARKERS)) score += 30;
  return Math.min(score, 100);
}

function categoryFeedback(category, verdict, unmatchedKeyword) {
  const topic = unmatchedKeyword || "the technology or project you mentioned";
  if (verdict === "good") {
    return "Your answer explains the main idea clearly.";
  }
  if (verdict === "needs-improvement") {
    if (category === "project") {
      return `You mentioned ${topic}, but explain how you actually used it in your project.`;
    }
    if (category === "skill") {
      return `You named ${topic}, but go deeper into how you've actually applied it in practice.`;
    }
    if (category === "experience") {
      return "You described the role, but explain your specific, personal contribution in more detail.";
    }
    if (category === "cross-section") {
      return "You've touched on the connection, but explain more clearly how the two experiences relate.";
    }
    return "Your answer covers the basics — add a specific example to strengthen it.";
  }
  // missing
  return "Your answer does not explain your specific contribution. Try describing what you personally implemented.";
}

/**
 * @param {object} question - { category, keywords, text }
 * @param {string} answerText
 * @returns {{ score:number, verdict:"good"|"needs-improvement"|"missing", feedback:string, breakdown:object }}
 */
export function evaluateAnswer(question, answerText) {
  const text = (answerText || "").trim();
  const words = wordCount(text);

  if (words === 0) {
    return {
      score: 0,
      verdict: "missing",
      feedback: "Your answer is missing. Try describing what you specifically did, using details from your resume.",
      breakdown: { relevance: 0, completeness: 0, communication: 0 },
    };
  }

  const answerLower = text.toLowerCase();
  const relevance = relevanceScore(answerLower, question.keywords);
  const completeness = completenessScore(words);
  const communication = communicationScore(answerLower);

  // Weighted average — relevance carries the most weight when we have a
  // real signal for it; otherwise completeness + communication share it.
  let score;
  if (relevance === null) {
    score = Math.round(completeness * 0.5 + communication * 0.5);
  } else {
    score = Math.round(relevance * 0.4 + completeness * 0.3 + communication * 0.3);
  }

  let verdict = "missing";
  if (score >= 75) verdict = "good";
  else if (score >= 45) verdict = "needs-improvement";

  const unmatchedKeyword = (question.keywords || []).find(
    (k) => k && !answerLower.includes(String(k).toLowerCase())
  );

  return {
    score,
    verdict,
    feedback: categoryFeedback(question.category, verdict, unmatchedKeyword),
    breakdown: { relevance: relevance === null ? completeness : relevance, completeness, communication },
  };
}
