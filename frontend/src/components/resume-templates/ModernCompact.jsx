// ModernCompact.jsx
// Modern category, template 4 of 4.
// Genuinely different from ModernBlue/ModernClean/ModernTwoColumn by being
// optimized for information density rather than a distinct color/column
// treatment: smaller base font size, tighter line-height, narrower margins,
// single-line entry headers, and inline (not bulleted) skills/tech lines
// wherever the reference allows it — all while staying single-column and
// fully ATS-safe (no font below readable minimums, no shrinking via images
// or overlapping text).

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
  genericSectionMappers,
  GENERIC_SECTIONS,
} from "./shared/resumeFormatters";

// Deliberately smaller than the other Modern templates (11-12pt range there
// vs 9.5-10.5pt here), but still within normal ATS-readable/printable bounds.
const SIZE = {
  name: "18pt",
  sectionHeading: "10pt",
  body: "9.5pt",
};

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5pt",
        borderBottom: "0.75pt solid #000",
        paddingBottom: "1.5pt",
        margin: "8pt 0 3pt",
      }}
    >
      {children}
    </h2>
  );
}

function BodyLine({ children, style = {} }) {
  return (
    <p style={{ fontSize: SIZE.body, textAlign: "left", margin: "0 0 1.5pt", lineHeight: 1.25, ...style }}>
      {children}
    </p>
  );
}

function BulletList({ items, indent = "12pt" }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <ul style={{ margin: "1pt 0 3pt", paddingLeft: indent }}>
      {visible.map((item, i) => (
        <li key={i} style={{ fontSize: SIZE.body, textAlign: "left", lineHeight: 1.25, marginBottom: "0.5pt" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Single line: "Title — Company, Location   Date". Deliberately packs
// role/company/date onto one line (rather than 2 lines like other templates)
// to save vertical space, since compactness is this template's whole point.
function CompactEntryLine({ title, meta, dateText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8pt" }}>
      <span style={{ fontSize: SIZE.body }}>
        <strong>{title}</strong>
        {meta && ` — ${meta}`}
      </span>
      {dateText && <span style={{ fontSize: "8.5pt", whiteSpace: "nowrap" }}>{dateText}</span>}
    </div>
  );
}

function EducationEntry({ entry }) {
  const gradeInfo = entry.cgpa
    ? `CGPA: ${entry.cgpa}`
    : entry.percentage
    ? `${entry.percentage}%`
    : entry.grade
    ? entry.grade
    : "";
  const years = [entry.duration?.startYear, entry.duration?.current ? "Present" : entry.duration?.endYear]
    .filter(Boolean)
    .join(" - ");
  const degreeLine = [entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ");

  return (
    <div style={{ marginBottom: "4pt" }}>
      <CompactEntryLine title={entry.institution} meta={[degreeLine, gradeInfo].filter(Boolean).join(", ")} dateText={years} />
      {entry.coursework && <BodyLine>Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
    </div>
  );
}

function RoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "4pt" }}>
      <CompactEntryLine title={role} meta={[company, location].filter(Boolean).join(", ")} dateText={dateText} />
      <BulletList items={bullets} />
      {technologies && <BodyLine>Tech: {technologies}</BodyLine>}
    </div>
  );
}

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "4pt" }}>
      <CompactEntryLine title={entry.title} meta={entry.role} dateText={formatDuration(entry.duration)} />
      <BulletList items={[entry.description, entry.keyFeatures, entry.responsibilities]} />
      {(entry.technologies || entry.githubUrl || entry.demoUrl) && (
        <BodyLine>
          {entry.technologies && `Tools: ${entry.technologies}`}
          {entry.technologies && (entry.githubUrl || entry.demoUrl) && "   "}
          {entry.githubUrl && `GitHub: ${entry.githubUrl}`}
          {entry.githubUrl && entry.demoUrl && "   "}
          {entry.demoUrl && `Live: ${entry.demoUrl}`}
        </BodyLine>
      )}
    </div>
  );
}

function CertificationLine({ entry }) {
  const dateText = formatDuration(entry.duration);
  return <CompactEntryLine title={entry.name} meta={entry.organization} dateText={dateText} />;
}

function GenericEntry({ heading, subheading, dateText, bullets = [] }) {
  return (
    <div style={{ marginBottom: "4pt" }}>
      <CompactEntryLine title={heading} meta={subheading} dateText={dateText} />
      <BulletList items={bullets} />
    </div>
  );
}

export default function ModernCompact({ formData, font = "Arial" }) {
  const personalInfo = formData.personalInfo || {};
  const contactLines = getContactLines(personalInfo);
  const skillsByCategory = groupSkillsByCategory(formData.skills);
  const languageSkills = getLanguageSkills(formData.skills);
  const interestNames = getInterestNames(formData.interests);

  return (
    <div
      id="resume-document"
      style={{
        width: "8.27in",
        minHeight: "11.69in",
        padding: "0.4in", // narrower margins than other templates (0.5–0.6in) — more usable space
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      {/* Compact header: name + title on one line, contact on the next — no extra spacing */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6pt" }}>
        {personalInfo.fullName && (
          <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0 }}>{personalInfo.fullName}</h1>
        )}
        {personalInfo.professionalTitle && (
          <span style={{ fontSize: "10.5pt", color: "#333" }}>{personalInfo.professionalTitle}</span>
        )}
      </div>
      {contactLines.length > 0 && (
        <p style={{ fontSize: "9pt", margin: "2pt 0 0" }}>{contactLines.join("  |  ")}</p>
      )}
      <div style={{ borderBottom: "1pt solid #000", margin: "4pt 0" }} />

      {personalInfo.summary && (
        <>
          <SectionHeading>Summary</SectionHeading>
          <BodyLine>{personalInfo.summary}</BodyLine>
        </>
      )}

      {(formData.education || []).length > 0 && (
        <>
          <SectionHeading>Education</SectionHeading>
          {formData.education.map((entry) => (
            <EducationEntry key={entry.id} entry={entry} />
          ))}
        </>
      )}

      {Object.keys(skillsByCategory).length > 0 && (
        <>
          <SectionHeading>Skills</SectionHeading>
          {Object.entries(skillsByCategory).map(([category, names]) => (
            <BodyLine key={category}>
              <strong>{category}:</strong> {names.join(", ")}
            </BodyLine>
          ))}
        </>
      )}

      {(formData.workExperience || []).length > 0 && (
        <>
          <SectionHeading>Work Experience</SectionHeading>
          {formData.workExperience.map((e) => (
            <RoleEntry
              key={e.id}
              role={[e.jobTitle, e.employmentType].filter(Boolean).join(" · ")}
              company={e.company}
              location={[e.city, e.country].filter(Boolean).join(", ")}
              dateText={formatDuration(e.duration)}
              bullets={[e.responsibilities]}
              technologies={e.technologies}
            />
          ))}
        </>
      )}

      {(formData.internships || []).length > 0 && (
        <>
          <SectionHeading>Internship</SectionHeading>
          {formData.internships.map((e) => (
            <RoleEntry
              key={e.id}
              role={e.position}
              company={e.company}
              dateText={formatDuration(e.duration)}
              bullets={[e.responsibilities]}
              technologies={e.technologies}
            />
          ))}
        </>
      )}

      {(formData.projects || []).length > 0 && (
        <>
          <SectionHeading>Projects</SectionHeading>
          {formData.projects.map((entry) => (
            <ProjectEntry key={entry.id} entry={entry} />
          ))}
        </>
      )}

      {(formData.certifications || []).length > 0 && (
        <>
          <SectionHeading>Certifications</SectionHeading>
          {formData.certifications.map((entry) => (
            <CertificationLine key={entry.id} entry={entry} />
          ))}
        </>
      )}

      {GENERIC_SECTIONS.map(([key, title]) => {
        const rawList = formData[key];
        if (!rawList || rawList.length === 0) return null;
        const mapped = genericSectionMappers[key](rawList);
        if (!mapped.length) return null;
        return (
          <div key={key}>
            <SectionHeading>{title}</SectionHeading>
            {mapped.map((entry, i) => (
              <GenericEntry key={i} {...entry} />
            ))}
          </div>
        );
      })}

      {languageSkills.length > 0 && (
        <>
          <SectionHeading>Languages</SectionHeading>
          <BodyLine>{languageSkills.join(", ")}</BodyLine>
        </>
      )}

      {interestNames.length > 0 && (
        <>
          <SectionHeading>Interests</SectionHeading>
          <BodyLine>{interestNames.join(", ")}</BodyLine>
        </>
      )}

      {(formData.references || []).length > 0 && (
        <>
          <SectionHeading>References</SectionHeading>
          {genericSectionMappers.references(formData.references).map((entry, i) => (
            <GenericEntry key={i} {...entry} />
          ))}
        </>
      )}
    </div>
  );
}
