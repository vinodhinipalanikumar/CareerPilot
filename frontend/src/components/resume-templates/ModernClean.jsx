// ModernClean.jsx
// Second template in the registry. Genuinely different visual language from
// ProfessionalClassic (left-aligned instead of justified text, bold accent
// underline under the name, tracked-uppercase headings with a thin rule,
// single contact line instead of a stacked block) while staying strictly
// ATS-safe: single column, no tables, no images, all text selectable,
// A4-friendly fixed page size.

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
  genericSectionMappers,
  GENERIC_SECTIONS,
} from "./shared/resumeFormatters";

const SIZE = {
  name: "24pt",
  sectionHeading: "11pt",
  body: "11pt",
};

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1.5pt",
        borderBottom: "1pt solid #000",
        paddingBottom: "3pt",
        margin: "16pt 0 8pt",
      }}
    >
      {children}
    </h2>
  );
}

function BodyLine({ children, style = {} }) {
  return (
    <p style={{ fontSize: SIZE.body, textAlign: "left", margin: "0 0 3pt", lineHeight: 1.4, ...style }}>
      {children}
    </p>
  );
}

function BulletList({ items, indent = "14pt" }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <ul style={{ margin: "2pt 0 5pt", paddingLeft: indent }}>
      {visible.map((item, i) => (
        <li key={i} style={{ fontSize: SIZE.body, textAlign: "left", lineHeight: 1.4, marginBottom: "1pt" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Reusable "title ... right-aligned date" row, bold title — used for
// Education, Internship/Work, and generic entries alike in this template.
function EntryHeaderRow({ title, dateText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12pt" }}>
      <span style={{ fontSize: SIZE.body, fontWeight: "bold" }}>{title}</span>
      {dateText && (
        <span style={{ fontSize: "10pt", color: "#000", whiteSpace: "nowrap" }}>{dateText}</span>
      )}
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
    <div style={{ marginBottom: "8pt" }}>
      <EntryHeaderRow title={entry.institution} dateText={years} />
      <BodyLine style={{ fontStyle: "normal" }}>
        {[degreeLine, gradeInfo].filter(Boolean).join(" — ")}
      </BodyLine>
      {entry.coursework && <BodyLine>Relevant Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
    </div>
  );
}

function RoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "8pt" }}>
      <EntryHeaderRow title={role} dateText={dateText} />
      {(company || location) && <BodyLine>{[company, location].filter(Boolean).join(", ")}</BodyLine>}
      <BulletList items={bullets} />
      {technologies && <BodyLine>Technologies: {technologies}</BodyLine>}
    </div>
  );
}

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "8pt" }}>
      <EntryHeaderRow title={entry.title} dateText={formatDuration(entry.duration)} />
      {entry.role && <BodyLine>{entry.role}</BodyLine>}
      <BulletList items={[entry.description, entry.keyFeatures, entry.responsibilities]} />
      {entry.technologies && <BodyLine>Tools: {entry.technologies}</BodyLine>}
      {(entry.githubUrl || entry.demoUrl) && (
        <BodyLine>
          {entry.githubUrl && `GitHub: ${entry.githubUrl}`}
          {entry.githubUrl && entry.demoUrl && "    "}
          {entry.demoUrl && `Live: ${entry.demoUrl}`}
        </BodyLine>
      )}
    </div>
  );
}

function CertificationLine({ entry }) {
  const dateText = formatDuration(entry.duration);
  return (
    <div style={{ marginBottom: "4pt" }}>
      <EntryHeaderRow title={entry.name} dateText={dateText} />
      {entry.organization && <BodyLine>{entry.organization}</BodyLine>}
    </div>
  );
}

function GenericEntry({ heading, subheading, dateText, bullets = [] }) {
  return (
    <div style={{ marginBottom: "8pt" }}>
      <EntryHeaderRow title={heading} dateText={dateText} />
      {subheading && <BodyLine>{subheading}</BodyLine>}
      <BulletList items={bullets} />
    </div>
  );
}

export default function ModernClean({ formData, font = "Arial" }) {
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
        padding: "0.6in",
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      {/* Header: name + title left-aligned, bold accent rule underneath,
          single contact line below the rule — a distinctly different
          header treatment from ProfessionalClassic's 2-column layout. */}
      <div>
        {personalInfo.fullName && (
          <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0, letterSpacing: "0.5pt" }}>
            {personalInfo.fullName}
          </h1>
        )}
        {personalInfo.professionalTitle && (
          <p style={{ fontSize: "12pt", margin: "3pt 0 0", color: "#333" }}>
            {personalInfo.professionalTitle}
          </p>
        )}
        <div style={{ borderBottom: "2pt solid #000", margin: "8pt 0 6pt" }} />
        {contactLines.length > 0 && (
          <p style={{ fontSize: "10pt", margin: 0 }}>{contactLines.join("   |   ")}</p>
        )}
      </div>

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
