// src/utils/ats/projectAnalyzer.js
//
// A resume with 5 projects where only 1 is relevant to the target role
// should still score reasonably well ON THAT PROJECT'S STRENGTH — averaging
// all projects equally would unfairly bury a strong, relevant project under
// several unrelated ones. So we average only the top-matching projects
// (up to 3) rather than the full list.

import { textMentionsSkill } from "./skillNormalizer.js";

const arr = (v) => (Array.isArray(v) ? v : []);

export function analyzeProjects(resume, jd) {
  const projects = arr(resume.projects);

  if (projects.length === 0) {
    return {
      score: 0,
      reasons: ["No projects were found on the resume."],
      perProject: [],
    };
  }

  const jdSkills = jd ? [...jd.requiredSkills, ...jd.preferredSkills] : [];

  const perProject = projects.map((p) => {
    const text = `${p.title || ""} ${p.technologies || ""} ${p.description || ""} ${p.keyFeatures || ""} ${p.responsibilities || ""}`.toLowerCase();
    let relevance;
    if (jdSkills.length === 0) {
      const hasTech = (p.technologies || "").trim().length > 0;
      const hasDesc = (p.description || "").trim().length > 30;
      relevance = (hasTech ? 50 : 0) + (hasDesc ? 50 : 0);
    } else {
      const hits = jdSkills.filter((s) => textMentionsSkill(text, s));
      relevance = Math.min(100, Math.round((hits.length / jdSkills.length) * 130));
    }
    return { title: p.title || "Untitled Project", relevance };
  });

  const sorted = [...perProject].sort((a, b) => b.relevance - a.relevance);
  const top = sorted.slice(0, Math.min(3, sorted.length));
  const score = Math.round(top.reduce((sum, p) => sum + p.relevance, 0) / top.length);

  const hasTech = projects.some((p) => (p.technologies || "").trim().length > 0);
  const hasDesc = projects.some((p) => (p.description || "").trim().length > 30);
  const hasMeasurableOutcome = projects.some((p) => /\d/.test(p.description || ""));

  const reasons = [`✓ ${projects.length} project${projects.length === 1 ? "" : "s"} detected`];
  reasons.push(hasTech ? "✓ Project technologies detected" : "△ No technologies listed for your projects — consider adding them.");
  reasons.push(hasDesc ? "✓ Project descriptions detected" : "△ Project descriptions are very short — add a sentence on what you built and how.");
  if (!hasMeasurableOutcome) reasons.push("△ Add measurable outcomes (numbers, %, scale) to improve impact.");

  const strongOnes = sorted.filter((p) => p.relevance >= 60).map((p) => p.title);
  if (jdSkills.length > 0) {
    reasons.push(
      strongOnes.length > 0
        ? `✓ ${strongOnes.slice(0, 2).join(" and ")} show${strongOnes.length === 1 ? "s" : ""} strong alignment with the target skills.`
        : "△ No project showed strong overlap with the target job's skills."
    );
  }

  return { score, reasons, perProject: sorted };
}