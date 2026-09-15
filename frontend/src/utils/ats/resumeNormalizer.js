// src/utils/ats/resumeNormalizer.js
//
// This module is the seam where "CareerPilot Resume" and "Upload Resume"
// converge. Both paths must eventually produce an object with this same
// shape (mirroring ResumeBuilder's `formData` sections) so every downstream
// analyzer only ever needs to understand ONE resume representation:
//
// {
//   personalInfo: { fullName, email, phone, summary, profilePhoto, ... },
//   education: [ { institution, degree, fieldOfStudy, cgpa, percentage, duration, description } ],
//   skills: [ { category, skillName, proficiency } ],
//   projects: [ { title, description, technologies, keyFeatures, responsibilities, duration } ],
//   workExperience: [ { company, jobTitle, responsibilities, technologies, duration } ],
//   internships: [ { company, position, responsibilities, technologies, duration } ],
//   certifications: [ { name, organization } ],
//   achievements: [ { title, description } ],
//   awards: [ { name, description } ],
//   publications: [ { title, description } ],
//   research: [ { title, description } ],
//   volunteerWork: [ { organization, description } ],
//   meta: { source: "careerpilot" | "upload", rawText?, parseWarnings?: string[] }
// }
//
// `meta.rawText`, when present (always for uploads, optional for
// CareerPilot resumes), is used as an always-available fallback for literal
// keyword scanning — this is what keeps scoring honest even when structured
// section-parsing of an uploaded file is imperfect.

import { cleanText, resolveSkill, scanTextForKnownSkills } from "./skillNormalizer.js";

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v : "");

/** Every free-text field across a resume, concatenated into one lowercase blob. */
export function getFullText(resume) {
  const parts = [];

  const p = resume.personalInfo || {};
  parts.push(str(p.professionalTitle), str(p.summary));

  arr(resume.education).forEach((e) => {
    parts.push(str(e.institution), str(e.degree), str(e.fieldOfStudy), str(e.department), str(e.coursework), str(e.description));
  });

  arr(resume.skills).forEach((s) => {
    parts.push(str(s.skillName), str(s.category));
  });

  arr(resume.projects).forEach((pr) => {
    parts.push(str(pr.title), str(pr.role), str(pr.technologies), str(pr.description), str(pr.keyFeatures), str(pr.responsibilities));
  });

  arr(resume.workExperience).forEach((w) => {
    parts.push(str(w.company), str(w.jobTitle), str(w.technologies), str(w.responsibilities));
  });

  arr(resume.internships).forEach((i) => {
    parts.push(str(i.company), str(i.position), str(i.technologies), str(i.responsibilities));
  });

  arr(resume.certifications).forEach((c) => parts.push(str(c.name), str(c.organization)));
  arr(resume.achievements).forEach((a) => parts.push(str(a.title), str(a.description)));
  arr(resume.awards).forEach((a) => parts.push(str(a.name), str(a.description)));
  arr(resume.publications).forEach((pub) => parts.push(str(pub.title), str(pub.description)));
  arr(resume.research).forEach((r) => parts.push(str(r.title), str(r.description)));
  arr(resume.volunteerWork).forEach((v) => parts.push(str(v.organization), str(v.description)));
  arr(resume.workshops).forEach((w) => parts.push(str(w.name), str(w.description)));
  arr(resume.conferences).forEach((c) => parts.push(str(c.name), str(c.paperTitle), str(c.description)));

  if (resume.meta?.rawText) parts.push(resume.meta.rawText);

  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

/** Free text from ONLY the sections that represent hands-on evidence
 *  (projects + work experience + internships) — as opposed to a skill
 *  merely being named in the Skills list or summary. Used to tell "listed"
 *  skills apart from "demonstrated" ones. */
export function getEvidenceText(resume) {
  const parts = [];
  arr(resume.projects).forEach((pr) => {
    parts.push(str(pr.title), str(pr.technologies), str(pr.description), str(pr.keyFeatures), str(pr.responsibilities));
  });
  arr(resume.workExperience).forEach((w) => parts.push(str(w.company), str(w.jobTitle), str(w.technologies), str(w.responsibilities)));
  arr(resume.internships).forEach((i) => parts.push(str(i.company), str(i.position), str(i.technologies), str(i.responsibilities)));
  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

/**
 * Canonical skill set detected in the resume, combining:
 *  - explicit entries in resume.skills[]
 *  - any KNOWN_SKILLS term (or a spelling/format alias of one, e.g. "NodeJS"
 *    or "ReactJS") mentioned anywhere in the full text — so a project that
 *    used "Java" without it being duplicated in the Skills section still
 *    counts as evidence of Java.
 *
 * Also returns `demonstratedSet`: the subset of skills that show up
 * specifically in project/experience text, i.e. actually put into practice
 * rather than just named. A skill can be "known" (in canonicalSet) without
 * being "demonstrated" — e.g. listed only in the Skills section or summary.
 */
export function extractSkillSet(resume) {
  const fullText = getFullText(resume);
  const evidenceText = getEvidenceText(resume);
  const canonicalSet = new Set();
  const rawUnrecognized = new Set();

  arr(resume.skills).forEach((s) => {
    if (!s.skillName) return;
    const resolved = resolveSkill(s.skillName);
    if (resolved?.isKnown) canonicalSet.add(resolved.canonical);
    else rawUnrecognized.add(cleanText(s.skillName));
  });

  scanTextForKnownSkills(fullText).forEach((skill) => canonicalSet.add(skill));
  const demonstratedSet = new Set(scanTextForKnownSkills(evidenceText));

  return { canonicalSet, rawUnrecognized, fullText, demonstratedSet };
}

/** Every experience-bearing entry (work + internships), tagged for downstream use. */
export function getExperienceEntries(resume) {
  return [
    ...arr(resume.workExperience).map((e) => ({ ...e, kind: "work" })),
    ...arr(resume.internships).map((e) => ({ ...e, kind: "internship" })),
  ];
}

/** Flatten every bullet-style text block (project + experience) for
 *  achievement/quantification and writing-quality analysis. Each item keeps
 *  its source so the UI can point back to where it came from. */
export function getBulletTexts(resume) {
  const bullets = [];

  const splitToLines = (text) =>
    str(text)
      .split(/\r?\n|(?<=[.;])\s+(?=[A-Z])/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

  arr(resume.projects).forEach((pr) => {
    splitToLines(pr.description).forEach((line) => bullets.push({ text: line, source: "project", label: pr.title || "Project" }));
    splitToLines(pr.responsibilities).forEach((line) => bullets.push({ text: line, source: "project", label: pr.title || "Project" }));
    splitToLines(pr.keyFeatures).forEach((line) => bullets.push({ text: line, source: "project", label: pr.title || "Project" }));
  });

  getExperienceEntries(resume).forEach((e) => {
    const label = e.company || (e.kind === "internship" ? "Internship" : "Work Experience");
    splitToLines(e.responsibilities).forEach((line) => bullets.push({ text: line, source: e.kind, label }));
  });

  return bullets;
}

/** True if the resume has at least the minimum data needed to run analysis at all. */
export function hasMinimalContent(resume) {
  const p = resume.personalInfo || {};
  const hasContact = !!(p.fullName || p.email);
  const hasAnySection =
    arr(resume.skills).length > 0 ||
    arr(resume.education).length > 0 ||
    arr(resume.projects).length > 0 ||
    arr(resume.workExperience).length > 0 ||
    arr(resume.internships).length > 0 ||
    !!(resume.meta?.rawText && resume.meta.rawText.trim().length > 40);
  return hasContact || hasAnySection;
}