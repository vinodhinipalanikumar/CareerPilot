// src/utils/resumeGenerator.js
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
  convertMillimetersToTwip,
} from "docx";

// ---------------------------------------------------------------------------
// Layout constants — mirror ResumeDocument.jsx's SIZE constants exactly.
// ---------------------------------------------------------------------------

const MARGIN = convertInchesToTwip(0.5); // 0.5 inch — matches reference resume
const PAGE_WIDTH = convertMillimetersToTwip(210); // A4
const PAGE_HEIGHT = convertMillimetersToTwip(297);
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const SUPPORTED_FONTS = ["Arial", "Calibri", "Times New Roman"];

// Font sizes in half-points (docx unit), matching ResumeDocument.jsx's pt values:
// 22pt name -> 44, 14pt heading -> 28, 12pt body -> 24
const SIZE = { name: 44, sectionHeading: 28, body: 24 };

// No table border — the reference resume's header table has no visible lines.
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function formatDuration(duration) {
  if (!duration) return "";
  const start = [duration.startMonth, duration.startYear].filter(Boolean).join(" ");
  const end = duration.current
    ? "Present"
    : [duration.endMonth, duration.endYear].filter(Boolean).join(" ");
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}

// Plain, justified body paragraph — the default text treatment used
// almost everywhere in the reference resume. No bold, no italics.
function bodyLine(text, { indent = 0 } = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 40 },
    indent: indent ? { left: convertInchesToTwip(indent) } : undefined,
    children: [new TextRun({ text: text || "", size: SIZE.body })],
  });
}

// A bullet line using a literal "• " character, matching the reference's style.
function bulletLine(text, { indent = 0.22 } = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 40 },
    indent: { left: convertInchesToTwip(indent) },
    children: [new TextRun({ text: `•  ${text}`, size: SIZE.body })],
  });
}

function bulletList(items, opts) {
  return items.filter(Boolean).map((t) => bulletLine(t, opts));
}

// A "left text ... right-aligned date" line via a right tab stop — plain,
// no bold/italics, matching the Internship/Work Experience role+date line.
function roleDateLine(left, dateText) {
  const children = [new TextRun({ text: left || "", size: SIZE.body })];
  if (dateText) {
    children.push(new TextRun({ text: `\t${dateText}`, size: SIZE.body }));
  }
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
    spacing: { after: 20 },
    children,
  });
}

// A numbered project line: "1.\tTitle" using a left tab stop for a small gap.
function numberedLine(index, text) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: convertInchesToTwip(0.3) }],
    spacing: { after: 20 },
    children: [new TextRun({ text: `${index}.\t${text || ""}`, size: SIZE.body })],
  });
}

// Section heading: bold, 14pt, uppercase, no border — spacing does the separating.
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: SIZE.sectionHeading })],
  });
}

// ---------------------------------------------------------------------------
// Header: 2-column borderless table — name+title left, contact block right,
// right-aligned — matching the reference resume's actual table-based header.
// ---------------------------------------------------------------------------

function buildHeaderTable(personalInfo) {
  const leftChildren = [];
  if (personalInfo.fullName) {
    leftChildren.push(
      new Paragraph({
        children: [new TextRun({ text: personalInfo.fullName, bold: true, size: SIZE.name })],
      })
    );
  }
  if (personalInfo.professionalTitle) {
    leftChildren.push(
      new Paragraph({
        spacing: { before: 40 },
        children: [new TextRun({ text: personalInfo.professionalTitle, size: SIZE.body })],
      })
    );
  }

  const contactLines = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio || personalInfo.website,
  ].filter(Boolean);

  const locationLine = [personalInfo.city, personalInfo.state, personalInfo.country]
    .filter(Boolean)
    .join(", ");
  if (locationLine) contactLines.push(locationLine);

  const rightChildren = contactLines.length
    ? contactLines.map(
        (line) =>
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: line, size: SIZE.body })],
          })
      )
    : [new Paragraph({ children: [] })];

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH / 2, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: leftChildren.length ? leftChildren : [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: CONTENT_WIDTH / 2, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Per-section renderers — each mirrors its counterpart component in
// ResumeDocument.jsx exactly.
// ---------------------------------------------------------------------------

function renderEducationEntry(entry) {
  const paragraphs = [];
  const gradeInfo = entry.cgpa
    ? `CGPA: ${entry.cgpa}`
    : entry.percentage
    ? `${entry.percentage}%`
    : entry.grade
    ? entry.grade
    : "";
  const degreeLine =
    [entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ") +
    (gradeInfo ? ` - ${gradeInfo}` : "");

  paragraphs.push(...bulletList([degreeLine]));

  const years = [
    entry.duration?.startYear,
    entry.duration?.current ? "Present" : entry.duration?.endYear,
  ]
    .filter(Boolean)
    .join("-");
  const instLine = `${entry.institution || ""}${years ? ` [${years}]` : ""}`;
  paragraphs.push(bodyLine(instLine, { indent: 0.22 }));

  if (entry.coursework) paragraphs.push(bodyLine(`Relevant Coursework: ${entry.coursework}`, { indent: 0.22 }));
  if (entry.description) paragraphs.push(bodyLine(entry.description, { indent: 0.22 }));

  return paragraphs;
}

function renderRoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  const paragraphs = [];
  paragraphs.push(roleDateLine(role, dateText));
  const companyLine = [company, location].filter(Boolean).join(", ");
  if (companyLine) paragraphs.push(bodyLine(companyLine));
  paragraphs.push(...bulletList(bullets, { indent: 0.28 }));
  if (technologies) paragraphs.push(bodyLine(`Technologies: ${technologies}`));
  return paragraphs;
}

function renderProjectEntry(index, entry) {
  const paragraphs = [];
  paragraphs.push(numberedLine(index, entry.title));
  paragraphs.push(
    ...bulletList([entry.description, entry.keyFeatures, entry.responsibilities], { indent: 0.28 })
  );
  if (entry.technologies) paragraphs.push(bodyLine(`Tools: ${entry.technologies}`, { indent: 0.28 }));
  if (entry.githubUrl) paragraphs.push(bodyLine(`GitHub project: ${entry.githubUrl}`, { indent: 0.28 }));
  if (entry.demoUrl || entry.githubUrl) {
    const parts = [];
    if (entry.demoUrl) parts.push(`Live: ${entry.demoUrl}`);
    if (entry.githubUrl) parts.push(`Code: ${entry.githubUrl}`);
    paragraphs.push(bodyLine(parts.join("    "), { indent: 0.28 }));
  }
  return paragraphs;
}

function renderCertificationLine(entry) {
  const parts = [entry.name, entry.organization].filter(Boolean).join(" - ");
  const dateText = formatDuration(entry.duration);
  return [bodyLine(`${[parts, dateText].filter(Boolean).join(", ")}.`)];
}

// Generic fallback for sections with no reference precedent — plain,
// non-bold, matching the reference's overall convention.
function renderGenericEntry({ heading, subheading, dateText, bullets = [] }) {
  const paragraphs = [];
  if (heading || dateText) paragraphs.push(roleDateLine(heading, dateText));
  if (subheading) paragraphs.push(bodyLine(subheading));
  paragraphs.push(...bulletList(bullets, { indent: 0.28 }));
  return paragraphs;
}

const genericMappers = {
  achievements: (list = []) =>
    list.map((e) => ({ heading: e.title, subheading: e.organization, dateText: e.date, bullets: [e.description] })),
  awards: (list = []) =>
    list.map((e) => ({ heading: e.name, subheading: e.organization, dateText: e.date, bullets: [e.description] })),
  publications: (list = []) =>
    list.map((e) => ({
      heading: e.title,
      subheading: [e.publisher, e.authors].filter(Boolean).join(" · "),
      dateText: e.date,
      bullets: [e.doi && `DOI: ${e.doi}`, e.url && `URL: ${e.url}`, e.description],
    })),
  research: (list = []) =>
    list.map((e) => ({
      heading: e.title,
      subheading: [e.organization, e.supervisor && `Supervisor: ${e.supervisor}`].filter(Boolean).join(" · "),
      dateText: formatDuration(e.duration),
      bullets: [e.description, e.url && `URL: ${e.url}`],
    })),
  volunteerWork: (list = []) =>
    list.map((e) => ({
      heading: e.organization,
      subheading: e.role,
      dateText: formatDuration(e.duration),
      bullets: [e.description],
    })),
  workshops: (list = []) =>
    list.map((e) => ({
      heading: e.name,
      subheading: e.organizer,
      dateText: e.date,
      bullets: [e.certificateReceived && "Certificate Received", e.description],
    })),
  conferences: (list = []) =>
    list.map((e) => ({
      heading: e.name,
      subheading: e.organizer,
      dateText: e.date,
      bullets: [e.paperPresented && `Paper Presented${e.paperTitle ? `: ${e.paperTitle}` : ""}`, e.description],
    })),
  references: (list = []) =>
    list.map((e) => ({
      heading: e.fullName,
      subheading: [e.designation, e.company].filter(Boolean).join(", "),
      bullets: [e.email, e.phone],
    })),
};

const GENERIC_SECTIONS = [
  ["achievements", "Achievements"],
  ["awards", "Awards"],
  ["publications", "Publications"],
  ["research", "Research"],
  ["volunteerWork", "Volunteer Work"],
  ["workshops", "Workshops"],
  ["conferences", "Conferences"],
];

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generates a .docx resume that visually matches ResumeDocument.jsx's preview
 * exactly, both derived from the same reference-resume design spec.
 * @param {object} formData
 * @param {object} [options]
 * @param {"Arial"|"Calibri"|"Times New Roman"} [options.font="Arial"]
 * @returns {Promise<Blob>}
 */
export async function generateResumeDoc(formData, options = {}) {
  const font = SUPPORTED_FONTS.includes(options.font) ? options.font : "Arial";
  const personalInfo = formData.personalInfo || {};

  const body = [];

  body.push(buildHeaderTable(personalInfo));

  if (personalInfo.summary) {
    body.push(sectionHeading("Professional Summary"));
    body.push(bodyLine(personalInfo.summary));
  }

  if ((formData.education || []).length > 0) {
    body.push(sectionHeading("Education"));
    formData.education.forEach((entry) => body.push(...renderEducationEntry(entry)));
  }

  const skillsByCategory = {};
  (formData.skills || []).forEach((s) => {
    if (!s.skillName) return;
    const cat = s.category || "Other Skills";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s.proficiency ? `${s.skillName} (${s.proficiency})` : s.skillName);
  });
  if (Object.keys(skillsByCategory).length > 0) {
    body.push(sectionHeading("Skills"));
    Object.entries(skillsByCategory).forEach(([category, names]) => {
      body.push(bodyLine(`${category}: ${names.join(", ")}`));
    });
  }

  if ((formData.workExperience || []).length > 0) {
    body.push(sectionHeading("Work Experience"));
    formData.workExperience.forEach((e) => {
      body.push(
        ...renderRoleEntry({
          role: [e.jobTitle, e.employmentType].filter(Boolean).join(" · "),
          company: e.company,
          location: [e.city, e.country].filter(Boolean).join(", "),
          dateText: formatDuration(e.duration),
          bullets: [e.responsibilities],
          technologies: e.technologies,
        })
      );
    });
  }

  if ((formData.internships || []).length > 0) {
    body.push(sectionHeading("Internship"));
    formData.internships.forEach((e) => {
      body.push(
        ...renderRoleEntry({
          role: e.position,
          company: e.company,
          dateText: formatDuration(e.duration),
          bullets: [e.responsibilities],
          technologies: e.technologies,
        })
      );
    });
  }

  if ((formData.projects || []).length > 0) {
    body.push(sectionHeading("Projects"));
    formData.projects.forEach((entry, i) => body.push(...renderProjectEntry(i + 1, entry)));
  }

  if ((formData.certifications || []).length > 0) {
    body.push(sectionHeading("Certifications"));
    formData.certifications.forEach((entry) => body.push(...renderCertificationLine(entry)));
  }

  GENERIC_SECTIONS.forEach(([key, title]) => {
    const rawList = formData[key];
    if (!rawList || rawList.length === 0) return;
    const mapped = genericMappers[key](rawList);
    if (!mapped.length) return;
    body.push(sectionHeading(title));
    mapped.forEach((entry) => body.push(...renderGenericEntry(entry)));
  });

  const explicitLanguages = formData.languages || [];
  const languageSkills = (formData.skills || [])
    .filter((s) => s.category === "Languages Known")
    .map((s) => (s.proficiency ? `${s.skillName} (${s.proficiency})` : s.skillName));
  const languageEntries = explicitLanguages.length
    ? explicitLanguages.map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
    : languageSkills;
  if (languageEntries.length > 0) {
    body.push(sectionHeading("Languages"));
    body.push(bodyLine(languageEntries.filter(Boolean).join(", ")));
  }

  const interestNames = (formData.interests || []).map((i) => i.interestName).filter(Boolean);
  if (interestNames.length > 0) {
    body.push(sectionHeading("Interests"));
    body.push(bodyLine(interestNames.join(", ")));
  }

  if ((formData.references || []).length > 0) {
    body.push(sectionHeading("References"));
    genericMappers.references(formData.references).forEach((entry) => body.push(...renderGenericEntry(entry)));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: SIZE.body, color: "000000" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: body.length
          ? body
          : [new Paragraph({ children: [new TextRun("No resume data provided.")] })],
      },
    ],
  });

  return Packer.toBlob(doc);
}