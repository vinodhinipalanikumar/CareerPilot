// MinimalMono.jsx
// Minimal category, template 3 of 4.
// Structural signature: an editorial "side-label" grid. Every section uses a
// two-column CSS grid where the section LABEL sits in a narrow left margin
// and the CONTENT sits in a wider right column — repeated per section. This
// is structurally distinct from ModernTwoColumn (one global sidebar holding
// different sections) because here every single section, including the
// header, uses this label/content pairing consistently down the page.
// Strictly grayscale — no colored accents anywhere, per the brief.

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
  name: "20pt",
  sectionHeading: "9.5pt",
  body: "10.5pt",
};

const LABEL_COLUMN = "1.15in";

// The core structural motif: label on the left, content on the right,
// in a CSS grid row. Used for every section in this template.
function GridSection({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${LABEL_COLUMN} 1fr`, gap: "12pt", margin: "13pt 0" }}>
      <div
        style={{
          fontSize: SIZE.sectionHeading,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5pt",
          color: "#333",
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function BodyLine({ children, style = {} }) {
  return (
    <p style={{ fontSize: SIZE.body, textAlign: "left", margin: "0 0 3pt", lineHeight: 1.45, color: "#000", ...style }}>
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
        <li key={i} style={{ fontSize: SIZE.body, textAlign: "left", lineHeight: 1.45, marginBottom: "1pt", color: "#000" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function EntryHeaderRow({ title, dateText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10pt" }}>
      <span style={{ fontSize: SIZE.body, fontWeight: 700, color: "#000" }}>{title}</span>
      {dateText && <span style={{ fontSize: "9pt", color: "#666", whiteSpace: "nowrap" }}>{dateText}</span>}
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
    <div style={{ marginBottom: "7pt" }}>
      <EntryHeaderRow title={entry.institution} dateText={years} />
      <BodyLine>{[degreeLine, gradeInfo].filter(Boolean).join(" — ")}</BodyLine>
      {entry.coursework && <BodyLine>Relevant Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
    </div>
  );
}

function RoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "7pt" }}>
      <EntryHeaderRow title={role} dateText={dateText} />
      {(company || location) && <BodyLine>{[company, location].filter(Boolean).join(", ")}</BodyLine>}
      <BulletList items={bullets} />
      {technologies && <BodyLine>Technologies: {technologies}</BodyLine>}
    </div>
  );
}

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "7pt" }}>
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
    <div style={{ marginBottom: "7pt" }}>
      <EntryHeaderRow title={heading} dateText={dateText} />
      {subheading && <BodyLine>{subheading}</BodyLine>}
      <BulletList items={bullets} />
    </div>
  );
}

export default function MinimalMono({ formData, font = "Arial" }) {
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
      {/* Thin single-line header: name left, contact right, strictly grayscale */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1.5pt solid #000",
          paddingBottom: "8pt",
          marginBottom: "4pt",
        }}
      >
        <div>
          {personalInfo.fullName && (
            <h1 style={{ fontSize: SIZE.name, fontWeight: 800, margin: 0, letterSpacing: "0.5pt" }}>
              {personalInfo.fullName}
            </h1>
          )}
          {personalInfo.professionalTitle && (
            <p style={{ fontSize: "10.5pt", margin: "2pt 0 0", color: "#444" }}>
              {personalInfo.professionalTitle}
            </p>
          )}
        </div>
        {contactLines.length > 0 && (
          <div style={{ textAlign: "right", fontSize: "9pt", color: "#444" }}>
            {contactLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {personalInfo.summary && <GridSection label="Summary"><BodyLine>{personalInfo.summary}</BodyLine></GridSection>}

      {(formData.education || []).length > 0 && (
        <GridSection label="Education">
          {formData.education.map((entry) => (
            <EducationEntry key={entry.id} entry={entry} />
          ))}
        </GridSection>
      )}

      {Object.keys(skillsByCategory).length > 0 && (
        <GridSection label="Skills">
          {Object.entries(skillsByCategory).map(([category, names]) => (
            <BodyLine key={category}>
              <strong>{category}:</strong> {names.join(", ")}
            </BodyLine>
          ))}
        </GridSection>
      )}

      {(formData.workExperience || []).length > 0 && (
        <GridSection label="Experience">
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
        </GridSection>
      )}

      {(formData.internships || []).length > 0 && (
        <GridSection label="Internship">
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
        </GridSection>
      )}

      {(formData.projects || []).length > 0 && (
        <GridSection label="Projects">
          {formData.projects.map((entry) => (
            <ProjectEntry key={entry.id} entry={entry} />
          ))}
        </GridSection>
      )}

      {(formData.certifications || []).length > 0 && (
        <GridSection label="Certifications">
          {formData.certifications.map((entry) => (
            <CertificationLine key={entry.id} entry={entry} />
          ))}
        </GridSection>
      )}

      {GENERIC_SECTIONS.map(([key, title]) => {
        const rawList = formData[key];
        if (!rawList || rawList.length === 0) return null;
        const mapped = genericSectionMappers[key](rawList);
        if (!mapped.length) return null;
        return (
          <GridSection key={key} label={title}>
            {mapped.map((entry, i) => (
              <GenericEntry key={i} {...entry} />
            ))}
          </GridSection>
        );
      })}

      {languageSkills.length > 0 && (
        <GridSection label="Languages">
          <BodyLine>{languageSkills.join(", ")}</BodyLine>
        </GridSection>
      )}

      {interestNames.length > 0 && (
        <GridSection label="Interests">
          <BodyLine>{interestNames.join(", ")}</BodyLine>
        </GridSection>
      )}

      {(formData.references || []).length > 0 && (
        <GridSection label="References">
          {genericSectionMappers.references(formData.references).map((entry, i) => (
            <GenericEntry key={i} {...entry} />
          ))}
        </GridSection>
      )}
    </div>
  );
}
