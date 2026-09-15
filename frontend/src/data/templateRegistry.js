// templateRegistry.js
// Single source of truth for every available resume template.
// Adding template #3, #4, ... #20+ later means adding one new component
// file under src/components/resume-templates/ and one new entry here —
// nothing else in the app needs to change.

import ProfessionalClassic from "../components/resume-templates/ProfessionalClassic";
import ProfessionalExecutive from "../components/resume-templates/ProfessionalExecutive";
import ProfessionalCorporate from "../components/resume-templates/ProfessionalCorporate";
import ProfessionalStandard from "../components/resume-templates/ProfessionalStandard";
import ModernClean from "../components/resume-templates/ModernClean";
import ModernBlue from "../components/resume-templates/ModernBlue";
import ModernTwoColumn from "../components/resume-templates/ModernTwoColumn";
import ModernCompact from "../components/resume-templates/ModernCompact";
import MinimalSimple from "../components/resume-templates/MinimalSimple";
import MinimalElegant from "../components/resume-templates/MinimalElegant";
import MinimalMono from "../components/resume-templates/MinimalMono";
import MinimalClassic from "../components/resume-templates/MinimalClassic";
import Launchpad from "../components/resume-templates/Launchpad";
import CampusPro from "../components/resume-templates/CampusPro";
import Rise from "../components/resume-templates/Rise";
import ScholarX from "../components/resume-templates/ScholarX";

export const templateRegistry = [
  {
    id: "professional-classic",
    name: "Professional Classic",
    category: "Professional",
    atsFriendly: true,
    description: "Traditional single-column layout with a two-column header.",
    component: ProfessionalClassic,
  },
  {
    id: "professional-executive",
    name: "Professional Executive",
    category: "Professional",
    atsFriendly: true,
    description: "Centered letterhead-style header framed by a double rule.",
    component: ProfessionalExecutive,
  },
  {
    id: "professional-corporate",
    name: "Professional Corporate",
    category: "Professional",
    atsFriendly: true,
    description: "Solid-bar section headings with a compact corporate layout.",
    component: ProfessionalCorporate,
  },
  {
    id: "professional-standard",
    name: "Professional Standard",
    category: "Professional",
    atsFriendly: true,
    description: "Maximally plain layout with zero visual embellishment.",
    component: ProfessionalStandard,
  },
  {
    id: "modern-clean",
    name: "Modern Clean",
    category: "Modern",
    atsFriendly: true,
    description: "Left-aligned modern layout with bold section rules.",
    component: ModernClean,
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    category: "Modern",
    atsFriendly: true,
    description: "Clean single-column layout with a subtle blue accent.",
    component: ModernBlue,
  },
  {
    id: "modern-two-column",
    name: "Modern Two Column",
    category: "Modern",
    atsFriendly: true,
    description: "Two-column layout: main content left, supporting info sidebar right.",
    component: ModernTwoColumn,
  },
  {
    id: "modern-compact",
    name: "Modern Compact",
    category: "Modern",
    atsFriendly: true,
    description: "Information-dense layout with tighter spacing, ideal for longer resumes.",
    component: ModernCompact,
  },
  {
    id: "minimal-simple",
    name: "Minimal Simple",
    category: "Minimal",
    atsFriendly: true,
    description: "Borderless, whitespace-first centered layout.",
    component: MinimalSimple,
  },
  {
    id: "minimal-elegant",
    name: "Minimal Elegant",
    category: "Minimal",
    atsFriendly: true,
    description: "Light typography with short accent underlines per heading.",
    component: MinimalElegant,
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    category: "Minimal",
    atsFriendly: true,
    description: "Editorial side-label grid layout, strictly grayscale.",
    component: MinimalMono,
  },
  {
    id: "minimal-classic",
    name: "Minimal Classic",
    category: "Minimal",
    atsFriendly: true,
    description: "Conventional single-column layout with inline parenthetical dates.",
    component: MinimalClassic,
  },
  {
    id: "launchpad",
    name: "Launchpad",
    category: "Student/Early Career",
    atsFriendly: true,
    description: "Side-by-side photo header, projects and skills before education.",
    component: Launchpad,
  },
  {
    id: "campuspro",
    name: "CampusPro",
    category: "Student/Early Career",
    atsFriendly: true,
    description: "Genuine sidebar with photo, contact, skills, and interests.",
    component: CampusPro,
  },
  {
    id: "rise",
    name: "Rise",
    category: "Student/Early Career",
    atsFriendly: true,
    description: "Centered hero header with photo; projects-first, education last.",
    component: Rise,
  },
  {
    id: "scholarx",
    name: "ScholarX",
    category: "Student/Early Career",
    atsFriendly: true,
    description: "Academic CV-style layout: education-first, research and publications focus.",
    component: ScholarX,
  },
];

export function getTemplateById(id) {
  return templateRegistry.find((t) => t.id === id) || templateRegistry[0];
}
