// src/utils/mock-interview/reportBuilder.js
//
// Turns a completed interview's { question, answerText, evaluation } items
// into the final report shown to the user. Every figure here is derived
// directly from that specific interview's own answers — nothing generic.

import { CATEGORY_LABELS } from "./questionGenerator";

function average(numbers) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, n) => sum + n, 0) / valid.length);
}

function categoryAverage(items, category) {
  return average(
    items
      .filter((it) => it.question.category === category && it.evaluation)
      .map((it) => it.evaluation.score)
  );
}

const AREA_LABELS = {
  projectUnderstanding: "Project Understanding",
  technicalSkills: "Technical Skills",
  experience: "Internship/Experience",
  communication: "Communication",
  resumeKnowledge: "Resume Knowledge",
};

export function buildReport(items) {
  const evaluatedItems = items.filter((it) => it.evaluation);

  const overallScore = average(evaluatedItems.map((it) => it.evaluation.score)) ?? 0;

  const areaScores = {
    projectUnderstanding: categoryAverage(items, "project"),
    technicalSkills: categoryAverage(items, "skill"),
    experience: categoryAverage(items, "experience"),
    communication: average(evaluatedItems.map((it) => it.evaluation.breakdown?.communication)),
    resumeKnowledge: average(evaluatedItems.map((it) => it.evaluation.breakdown?.relevance)),
  };

  const strongAreas = [];
  const areasToImprove = [];
  Object.entries(areaScores).forEach(([key, value]) => {
    if (value === null) return;
    if (value >= 75) strongAreas.push(AREA_LABELS[key]);
    else if (value < 60) areasToImprove.push(AREA_LABELS[key]);
  });

  const questionsToPracticeAgain = evaluatedItems
    .filter((it) => it.evaluation.verdict !== "good")
    .map((it) => ({
      id: it.question.id,
      category: it.question.category,
      categoryLabel: CATEGORY_LABELS[it.question.category] || it.question.category,
      text: it.question.text,
      feedback: it.evaluation.feedback,
    }));

  // Resume-based, not generic: build a suggestion from the actual weak
  // question's own keywords (the skill/project/company it referenced).
  const preparationSuggestions = [];
  evaluatedItems
    .filter((it) => it.evaluation.verdict !== "good")
    .slice(0, 5)
    .forEach((it) => {
      const topic = (it.question.keywords || [])[0];
      if (!topic) return;
      const label = CATEGORY_LABELS[it.question.category] || "this topic";
      preparationSuggestions.push(
        `Revisit ${topic} — your resume references it under ${label.toLowerCase()}, and your answer there needs more detail.`
      );
    });
  if (preparationSuggestions.length === 0 && questionsToPracticeAgain.length === 0) {
    preparationSuggestions.push(
      "Strong interview overall — keep practicing to stay sharp on the details of your resume."
    );
  }

  return {
    finalScore: overallScore,
    areaScores,
    strongAreas,
    areasToImprove,
    questionsToPracticeAgain,
    preparationSuggestions,
  };
}
