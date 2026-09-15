// src/utils/career-guidance/profileExtractor.js
//
// Turns the Resume Builder's raw `formData` (see src/data/resumeFormConfig.js
// for the exact section/field shapes) into a flat profile object that the
// career matcher and roadmap generator can work with. Every accessor here is
// defensive: missing sections, missing fields, and non-array values must
// never throw.

import { normalizeSkill, scanTextForSkills } from "./skillTaxonomy.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function textOf(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * @param {object|null|undefined} formData - Resume Builder formData
 * @returns profile object, or an empty/isEmpty profile if formData is absent
 */
export function extractProfile(formData) {
  const personalInfo = formData?.personalInfo || {};
  const educationEntries = asArray(formData?.education);
  const skillEntries = asArray(formData?.skills);
  const projectEntries = asArray(formData?.projects);
  const workExperienceEntries = asArray(formData?.workExperience);
  const internshipEntries = asArray(formData?.internships);
  const certificationEntries = asArray(formData?.certifications);
  const achievementEntries = asArray(formData?.achievements);
  const workshopEntries = asArray(formData?.workshops);
  const interestEntries = asArray(formData?.interests);

  // --- Skills explicitly listed by the user ---
  const explicitSkillSet = new Set();
  const explicitSkillsDisplay = [];
  skillEntries.forEach((entry) => {
    const normalized = normalizeSkill(entry?.skillName);
    if (!normalized) return;
    explicitSkillSet.add(normalized.canonical);
    explicitSkillsDisplay.push({
      raw: entry.skillName,
      canonical: normalized.canonical,
      isKnown: normalized.isKnown,
      category: entry.category || "",
      proficiency: entry.proficiency || "",
    });
  });

  // --- Projects, with technologies scanned from both the dedicated field
  //     and the free-text description/features/responsibilities ---
  const projects = projectEntries
    .filter((p) => p && (p.title || p.description || p.technologies))
    .map((p) => {
      const scannedText = textOf(p.technologies, p.description, p.keyFeatures, p.responsibilities);
      const technologies = scanTextForSkills(scannedText);
      return {
        title: p.title || "Untitled Project",
        technologies,
        rawTechnologies: p.technologies || "",
        description: p.description || "",
        current: !!p.duration?.current,
      };
    });

  const workExperience = workExperienceEntries
    .filter((w) => w && (w.company || w.jobTitle))
    .map((w) => {
      const scannedText = textOf(w.jobTitle, w.technologies, w.responsibilities);
      return {
        company: w.company || "",
        jobTitle: w.jobTitle || "",
        technologies: scanTextForSkills(scannedText),
        raw: scannedText,
      };
    });

  const internships = internshipEntries
    .filter((i) => i && (i.company || i.position))
    .map((i) => {
      const scannedText = textOf(i.position, i.technologies, i.responsibilities);
      return {
        company: i.company || "",
        position: i.position || "",
        technologies: scanTextForSkills(scannedText),
        raw: scannedText,
      };
    });

  const certifications = certificationEntries
    .filter((c) => c && c.name)
    .map((c) => ({
      name: c.name,
      organization: c.organization || "",
      technologies: scanTextForSkills(textOf(c.name, c.organization)),
    }));

  const achievements = achievementEntries.filter((a) => a && (a.title || a.description));

  const interests = interestEntries
    .map((i) => i?.interestName)
    .filter(Boolean);

  const educationText = educationEntries
    .map((e) => textOf(e.degree, e.department, e.fieldOfStudy, e.coursework, e.description))
    .join(" ");

  // --- Union of every skill signal we can find, for matching purposes ---
  const derivedSkillSet = new Set(explicitSkillSet);
  projects.forEach((p) => p.technologies.forEach((t) => derivedSkillSet.add(t)));
  workExperience.forEach((w) => w.technologies.forEach((t) => derivedSkillSet.add(t)));
  internships.forEach((i) => i.technologies.forEach((t) => derivedSkillSet.add(t)));
  certifications.forEach((c) => c.technologies.forEach((t) => derivedSkillSet.add(t)));
  scanTextForSkills(educationText).forEach((t) => derivedSkillSet.add(t));

  const highestEducation = educationEntries[0] || null;

  const hasAnyData =
    !!personalInfo.fullName ||
    explicitSkillsDisplay.length > 0 ||
    projects.length > 0 ||
    workExperience.length > 0 ||
    internships.length > 0 ||
    certifications.length > 0 ||
    educationEntries.length > 0;

  return {
    isEmpty: !hasAnyData,
    personalInfo,
    education: educationEntries,
    highestEducation,
    educationText,
    explicitSkills: explicitSkillsDisplay,
    skillSet: derivedSkillSet, // Set<canonical skill string> — used for matching
    projects,
    workExperience,
    internships,
    certifications,
    achievements,
    workshops: workshopEntries,
    interests,
    counts: {
      projects: projects.length,
      internships: internships.length,
      workExperience: workExperience.length,
      certifications: certifications.length,
      skills: explicitSkillsDisplay.length,
    },
  };
}
