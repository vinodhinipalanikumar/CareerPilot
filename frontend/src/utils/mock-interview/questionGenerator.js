// src/utils/mock-interview/questionGenerator.js
//
// Turns a resume's `extractProfile()` output (see
// src/utils/career-guidance/profileExtractor.js — reused as-is, no second
// resume parser) into a dynamic, resume-specific set of mock interview
// questions. Every question is built from the actual contents of the
// selected resume: a different resume produces different questions,
// because the data plugged into the templates below is different.
//
// Question shape: { id, category, text, keywords }
// - category: "project" | "skill" | "experience" | "education" |
//             "certification" | "cross-section"
// - keywords: terms the rule-based evaluator (answerEvaluator.js) looks
//   for in the user's answer — not shown to the user.

const CATEGORY_WEIGHTS = {
  project: 2,
  skill: 2,
  experience: 2,
  education: 1,
  certification: 1,
  "cross-section": 2,
};

const CATEGORY_LABELS = {
  project: "Project",
  skill: "Technical Skill",
  experience: "Internship/Experience",
  education: "Education",
  certification: "Certification/Achievement",
  "cross-section": "Cross-Section",
};

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `q${Date.now().toString(36)}${idCounter}`;
}

function pickCycled(list, index) {
  if (!list || list.length === 0) return null;
  return list[index % list.length];
}

function combinedExperience(profile) {
  // Work experience and internships are treated as one "Experience" pool
  // for question purposes, since the resume form and the spec both group
  // them together as "Internship/Experience".
  const work = profile.workExperience.map((w) => ({
    kind: "work",
    company: w.company,
    role: w.jobTitle,
    technologies: w.technologies,
    raw: w.raw,
  }));
  const internships = profile.internships.map((i) => ({
    kind: "internship",
    company: i.company,
    role: i.position,
    technologies: i.technologies,
    raw: i.raw,
  }));
  return [...work, ...internships].filter((e) => e.company || e.role);
}

function difficultySuffix(category, difficulty) {
  if (difficulty === "advanced") {
    if (category === "project") return " Discuss the trade-offs of your design decisions and how you would scale or optimize it.";
    if (category === "skill") return " Compare it to an alternative technology and explain when you'd choose one over the other.";
    if (category === "experience") return " Discuss a decision you'd make differently with what you know now.";
    if (category === "cross-section") return " Go into the technical trade-offs involved.";
    return " Go into as much technical depth as you can.";
  }
  if (difficulty === "intermediate") {
    return " Give a concrete example from your own experience.";
  }
  // beginner: keep it simple, no suffix
  return "";
}

// ---------- Per-category question builders ----------

function buildProjectQuestions(profile, count, difficulty) {
  const projects = profile.projects;
  if (projects.length === 0 || count === 0) return [];

  const templates = [
    (p) => `Explain your "${p.title}" project — what problem does it solve?`,
    (p) => `What was your specific role and contribution to "${p.title}"?`,
    (p) =>
      p.rawTechnologies
        ? `Why did you choose ${p.rawTechnologies.split(",")[0].trim()} for "${p.title}"?`
        : `Walk me through the technology choices you made for "${p.title}".`,
    (p) => `Explain the architecture of "${p.title}". How do the major pieces fit together?`,
    (p) => `What was the most difficult challenge you faced while building "${p.title}", and how did you solve it?`,
    (p) => `Looking back, what would you improve about "${p.title}" if you revisited it today?`,
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const project = pickCycled(projects, i);
    const template = templates[i % templates.length];
    const text = template(project) + difficultySuffix("project", difficulty);
    questions.push({
      id: nextId(),
      category: "project",
      text,
      keywords: [project.title, ...project.technologies],
    });
  }
  return questions;
}

function buildSkillQuestions(profile, count, difficulty) {
  const skills = profile.explicitSkills.length > 0
    ? profile.explicitSkills.map((s) => s.raw)
    : Array.from(profile.skillSet);
  if (skills.length === 0 || count === 0) return [];

  const templates = [
    (s) => `You've listed ${s} as a skill. Can you explain a core concept in ${s} and how you've applied it?`,
    (s) => `Describe a situation where you used ${s} to solve a real problem.`,
    (s) => `What do you find most challenging about working with ${s}, and how do you deal with it?`,
    (s) => `How would you explain ${s} to someone who has never used it?`,
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const skill = pickCycled(skills, i);
    const template = templates[i % templates.length];
    const text = template(skill) + difficultySuffix("skill", difficulty);
    questions.push({
      id: nextId(),
      category: "skill",
      text,
      keywords: [skill],
    });
  }
  return questions;
}

function buildExperienceQuestions(profile, count, difficulty) {
  const experiences = combinedExperience(profile);
  if (experiences.length === 0 || count === 0) return [];

  const templates = [
    (e) => `What were your main responsibilities as ${e.role || "a team member"} at ${e.company || "your internship"}?`,
    (e) =>
      e.technologies.length > 0
        ? `You used ${e.technologies[0]} at ${e.company || "your internship"} — how did you use it day to day?`
        : `What technologies or tools did you work with at ${e.company || "your internship"}, and how?`,
    (e) => `Describe a challenge you faced during your time at ${e.company || "that role"} and how you handled it.`,
    (e) => `How did you collaborate with your team at ${e.company || "that role"}?`,
    (e) => `What is the single most important thing you learned from your time at ${e.company || "that experience"}?`,
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const exp = pickCycled(experiences, i);
    const template = templates[i % templates.length];
    const text = template(exp) + difficultySuffix("experience", difficulty);
    questions.push({
      id: nextId(),
      category: "experience",
      text,
      keywords: [exp.company, exp.role, ...exp.technologies].filter(Boolean),
    });
  }
  return questions;
}

function buildEducationQuestions(profile, count, difficulty) {
  const education = profile.education;
  if (education.length === 0 || count === 0) return [];

  const templates = [
    (e) =>
      e.coursework
        ? `Tell me about your ${e.degree || "studies"} at ${e.institution || "your institution"}. Which coursework has been most relevant to your career goals?`
        : `Tell me about your ${e.degree || "studies"} at ${e.institution || "your institution"}. What stood out to you?`,
    (e) => `How has your education in ${e.fieldOfStudy || e.degree || "your field"} prepared you for a role in this industry?`,
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const edu = pickCycled(education, i);
    const template = templates[i % templates.length];
    const text = template(edu) + difficultySuffix("education", difficulty);
    questions.push({
      id: nextId(),
      category: "education",
      text,
      keywords: [edu.degree, edu.fieldOfStudy, edu.institution].filter(Boolean),
    });
  }
  return questions;
}

function buildCertificationQuestions(profile, count, difficulty) {
  const certifications = profile.certifications;
  if (certifications.length === 0 || count === 0) return [];

  const templates = [
    (c) => `You mentioned a ${c.name} certification${c.organization ? ` from ${c.organization}` : ""}. What concepts did you learn, and how have you applied them?`,
    (c) => `What motivated you to pursue the ${c.name} certification, and how has it helped you in practice?`,
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const cert = pickCycled(certifications, i);
    const template = templates[i % templates.length];
    const text = template(cert) + difficultySuffix("certification", difficulty);
    questions.push({
      id: nextId(),
      category: "certification",
      text,
      keywords: [cert.name, cert.organization, ...cert.technologies].filter(Boolean),
    });
  }
  return questions;
}

// Cross-section questions connect two different parts of the SAME resume —
// e.g. a skill that also shows up in a project, or a technology mentioned
// during an internship. This is what makes the interview feel like the
// interviewer actually read the candidate's resume.
function buildCrossSectionQuestions(profile, count, difficulty) {
  if (count === 0) return [];

  const explicitSkillCanonicals = new Set(profile.explicitSkills.map((s) => s.canonical));
  const skillDisplay = new Map(profile.explicitSkills.map((s) => [s.canonical, s.raw]));

  const pairs = [];

  // Skill <-> Project overlap
  profile.projects.forEach((project) => {
    project.technologies.forEach((tech) => {
      if (explicitSkillCanonicals.has(tech)) {
        pairs.push({
          text: `You've listed ${skillDisplay.get(tech) || tech} as a skill and used it in your "${project.title}" project. Explain how you applied ${skillDisplay.get(tech) || tech} there.`,
          keywords: [tech, project.title],
        });
      }
    });
  });

  // Skill <-> Experience overlap
  combinedExperience(profile).forEach((exp) => {
    exp.technologies.forEach((tech) => {
      if (explicitSkillCanonicals.has(tech)) {
        const targetProject = profile.projects[0];
        pairs.push({
          text: `You mentioned ${skillDisplay.get(tech) || tech} during your time at ${exp.company || "your internship"}. ${
            targetProject
              ? `Explain how you've also used it in a project such as "${targetProject.title}".`
              : `Explain how you'd apply it in a project.`
          }`,
          keywords: [tech, exp.company].filter(Boolean),
        });
      }
    });
  });

  // Project <-> Experience overlap (shared technology, different sections)
  profile.projects.forEach((project) => {
    combinedExperience(profile).forEach((exp) => {
      const shared = project.technologies.find((t) => exp.technologies.includes(t));
      if (shared) {
        pairs.push({
          text: `Both your "${project.title}" project and your time at ${exp.company || "your internship"} involved ${shared}. How did the way you used it differ between the two?`,
          keywords: [shared, project.title, exp.company].filter(Boolean),
        });
      }
    });
  });

  // Fallback generic cross-section combos if no direct overlaps were found
  // (e.g. a resume with a project but unrelated skills listed).
  if (pairs.length === 0) {
    if (profile.projects.length > 0 && profile.explicitSkills.length > 0) {
      const skill = profile.explicitSkills[0].raw;
      const project = profile.projects[0];
      pairs.push({
        text: `You've listed ${skill} as a skill. Even if it wasn't the main technology, how did it play a role in "${project.title}"?`,
        keywords: [skill, project.title],
      });
    }
    if (profile.projects.length > 0 && combinedExperience(profile).length > 0) {
      const exp = combinedExperience(profile)[0];
      const project = profile.projects[0];
      pairs.push({
        text: `How did what you learned at ${exp.company || "your internship"} influence the way you approached "${project.title}"?`,
        keywords: [exp.company, project.title].filter(Boolean),
      });
    }
    if (profile.explicitSkills.length > 0) {
      const skills = profile.explicitSkills.slice(0, 2).map((s) => s.raw);
      pairs.push({
        text: skills.length > 1
          ? `You've listed both ${skills[0]} and ${skills[1]}. How do you decide which to use for a given task?`
          : `How does ${skills[0]} fit into the rest of your technical toolkit?`,
        keywords: skills,
      });
    }
  }

  if (pairs.length === 0) return [];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const pair = pickCycled(pairs, i);
    questions.push({
      id: nextId(),
      category: "cross-section",
      text: pair.text + difficultySuffix("cross-section", difficulty),
      keywords: pair.keywords,
    });
  }
  return questions;
}

const BUILDERS = {
  project: buildProjectQuestions,
  skill: buildSkillQuestions,
  experience: buildExperienceQuestions,
  education: buildEducationQuestions,
  certification: buildCertificationQuestions,
  "cross-section": buildCrossSectionQuestions,
};

function categoryHasData(profile, category) {
  if (category === "project") return profile.projects.length > 0;
  if (category === "skill") return profile.explicitSkills.length > 0 || profile.skillSet.size > 0;
  if (category === "experience") return combinedExperience(profile).length > 0;
  if (category === "education") return profile.education.length > 0;
  if (category === "certification") return profile.certifications.length > 0;
  if (category === "cross-section") {
    const available = ["project", "skill", "experience"].filter((c) => categoryHasData(profile, c));
    return available.length >= 2;
  }
  return false;
}

// Distributes `count` questions across categories proportionally to
// CATEGORY_WEIGHTS, then redistributes the quota of any category with no
// resume data into categories that do have data — never generating a
// question from an empty section.
function distributeQuestionCounts(profile, count) {
  const categories = Object.keys(CATEGORY_WEIGHTS);
  const availableCategories = categories.filter((c) => categoryHasData(profile, c));

  if (availableCategories.length === 0) return {};

  const totalWeight = categories.reduce((sum, c) => sum + CATEGORY_WEIGHTS[c], 0);
  const raw = {};
  categories.forEach((c) => {
    raw[c] = (CATEGORY_WEIGHTS[c] / totalWeight) * count;
  });

  // Round down, then hand out the remainder to the largest fractional
  // parts first (largest-remainder method) so the total always == count.
  const floors = {};
  let allocated = 0;
  categories.forEach((c) => {
    floors[c] = Math.floor(raw[c]);
    allocated += floors[c];
  });
  let remainder = count - allocated;
  const byFraction = [...categories].sort((a, b) => (raw[b] - floors[b]) - (raw[a] - floors[a]));
  let idx = 0;
  while (remainder > 0 && byFraction.length > 0) {
    floors[byFraction[idx % byFraction.length]] += 1;
    remainder -= 1;
    idx += 1;
  }

  // Redistribute quota from empty categories into available ones.
  const finalCounts = {};
  availableCategories.forEach((c) => {
    finalCounts[c] = floors[c];
  });

  let overflow = 0;
  categories.forEach((c) => {
    if (!categoryHasData(profile, c)) overflow += floors[c];
  });

  if (overflow > 0 && availableCategories.length > 0) {
    // Prefer sending overflow to project/skill/experience/cross-section
    // (the richest categories) before education/certification.
    const priority = ["project", "skill", "experience", "cross-section", "education", "certification"]
      .filter((c) => availableCategories.includes(c));
    let i = 0;
    while (overflow > 0 && priority.length > 0) {
      const target = priority[i % priority.length];
      finalCounts[target] = (finalCounts[target] || 0) + 1;
      overflow -= 1;
      i += 1;
    }
  }

  return finalCounts;
}

/**
 * @param {object} profile - output of extractProfile(formData)
 * @param {object} options - { difficulty: "beginner"|"intermediate"|"advanced", count: 5|10|15 }
 * @returns {Array} ordered list of question objects, interview-ready
 */
export function generateQuestions(profile, { difficulty, count }) {
  if (!profile || profile.isEmpty) return [];

  const counts = distributeQuestionCounts(profile, count);
  let questions = [];

  Object.entries(counts).forEach(([category, categoryCount]) => {
    if (categoryCount <= 0) return;
    const builder = BUILDERS[category];
    if (!builder) return;
    questions = questions.concat(builder(profile, categoryCount, difficulty));
  });

  // If, after redistribution, we still came up short (e.g. a very sparse
  // resume with only one populated category), trim to what we actually
  // have rather than padding with fabricated questions.
  return questions.slice(0, count);
}

export { CATEGORY_LABELS, categoryHasData };
