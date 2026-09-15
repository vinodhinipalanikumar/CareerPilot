// ModernTwoColumn.jsx
// Modern category, template 3 of 4.
// Genuinely different structure from ModernBlue/ModernClean: a two-column
// layout — a narrow sidebar (contact, skills, education, certifications,
// languages, interests) and a wide main column (summary, experience,
// internships, projects, and remaining sections).
//
// ATS NOTE: this is built with a single flex container using CSS `order`
// to control *visual* placement, while the sidebar's content is placed
// AFTER the main content in DOM/source order. Most modern ATS parsers read
// DOM/text order rather than visual (x,y) position, so putting the
// substantive career content (experience, projects) first in the source
// avoids the classic "two-column resume gets your sidebar skills read
// before your job titles" ATS pitfall. No information exists only in a
// visual position — everything here is plain, selectable text.

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
  genericSectionMappers,
  GENERIC_SECTIONS,
} from "./shared/resumeFormatters";

const SIZE = { name: "21pt", sectionHeading: "10.5pt", body: "9.5pt" };

function SectionHeading({ children, style = {} }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5pt",
        borderBottom: "1pt solid #000",
        paddingBottom: "2pt",
        margin: "10pt 0 5pt",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

function BodyLine({ children, style = {} }) {
  return (
    <p style={{ fontSize: SIZE.body, textAlign: "left", margin: "0 0 2pt", lineHeight: 1.35, ...style }}>
      {children}
    </p>
  );
}

function BulletList({ items, indent = "12pt" }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <ul style={{ margin: "1pt 0 4pt", paddingLeft: indent }}>
      {visible.map((item, i) => (
        <li key={i} style={{ fontSize: SIZE.body, textAlign: "left", lineHeight: 1.35, marginBottom: "1pt" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function EntryHeaderRow({ title, dateText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8pt" }}>
      <span style={{ fontSize: SIZE.body, fontWeight: "bold" }}>{title}</span>
      {dateText && <span style={{ fontSize: "8.5pt", whiteSpace: "nowrap" }}>{dateText}</span>}
    </div>
  );
}

function RoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      <EntryHeaderRow title={role} dateText={dateText} />
      {(company || location) && <BodyLine>{[company, location].filter(Boolean).join(", ")}</BodyLine>}
      <BulletList items={bullets} />
      {technologies && <BodyLine>Technologies: {technologies}</BodyLine>}
    </div>
  );
}

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      <EntryHeaderRow title={entry.title} dateText={formatDuration(entry.duration)} />
      {entry.role && <BodyLine>{entry.role}</BodyLine>}
      <BulletList items={[entry.description, entry.keyFeatures, entry.responsibilities]} />
      {entry.technologies && <BodyLine>Tools: {entry.technologies}</BodyLine>}
      {(entry.githubUrl || entry.demoUrl) && (
        <BodyLine>
          {entry.githubUrl && `GitHub: ${entry.githubUrl}`}
          {entry.githubUrl && entry.demoUrl && "  "}
          {entry.demoUrl && `Live: ${entry.demoUrl}`}
        </BodyLine>
      )}
    </div>
  );
}

function GenericEntry({ heading, subheading, dateText, bullets = [] }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      <EntryHeaderRow title={heading} dateText={dateText} />
      {subheading && <BodyLine>{subheading}</BodyLine>}
      <BulletList items={bullets} />
    </div>
  );
}

// --- Sidebar-specific compact renderers (denser than main column) ---
function SidebarEducationEntry({ entry }) {
  const years = [entry.duration?.startYear, entry.duration?.current ? "Present" : entry.duration?.endYear]
    .filter(Boolean)
    .join("-");
  const gradeInfo = entry.cgpa ? `CGPA ${entry.cgpa}` : entry.percentage ? `${entry.percentage}%` : entry.grade || "";
  return (
    <div style={{ marginBottom: "5pt" }}>
      <BodyLine style={{ fontWeight: "bold" }}>{entry.institution}</BodyLine>
      <BodyLine>{[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}</BodyLine>
      <BodyLine style={{ color: "#444" }}>{[years, gradeInfo].filter(Boolean).join(" · ")}</BodyLine>
    </div>
  );
}

function SidebarCertLine({ entry }) {
  return (
    <BodyLine style={{ marginBottom: "3pt" }}>
      <strong>{entry.name}</strong>
      {entry.organization ? ` — ${entry.organization}` : ""}
    </BodyLine>
  );
}

export default function ModernTwoColumn({ formData, font = "Arial" }) {
  const personalInfo = formData.personalInfo || {};
  const contactLines = getContactLines(personalInfo);
  const skillsByCategory = groupSkillsByCategory(formData.skills);
  const languageSkills = getLanguageSkills(formData.skills);
  const interestNames = getInterestNames(formData.interests);

  const hasSidebarContent =
    contactLines.length > 0 ||
    Object.keys(skillsByCategory).length > 0 ||
    (formData.education || []).length > 0 ||
    (formData.certifications || []).length > 0 ||
    languageSkills.length > 0 ||
    interestNames.length > 0;

  return (
    <div
      id="resume-document"
      style={{
        width: "8.27in",
        minHeight: "11.69in",
        padding: "0.5in",
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      {/* Full-width header spans both columns */}
      <div style={{ marginBottom: "10pt" }}>
        {personalInfo.fullName && (
          <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0 }}>{personalInfo.fullName}</h1>
        )}
        {personalInfo.professionalTitle && (
          <p style={{ fontSize: "11pt", margin: "2pt 0 0", color: "#333" }}>{personalInfo.professionalTitle}</p>
        )}
        <div style={{ borderTop: "1.5pt solid #000", margin: "6pt 0 0" }} />
      </div>

      {/* Flex container: DOM order is main-content-first (for ATS text
          extraction), sidebar second — visual order is reversed via
          `order` so the sidebar appears on the left as expected. */}
      <div style={{ display: "flex", gap: "20pt" }}>
        {/* Main column — appears second in DOM, first visually */}
        <div style={{ flex: "1 1 62%", order: 1 }}>
          {personalInfo.summary && (
            <>
              <SectionHeading>Summary</SectionHeading>
              <BodyLine>{personalInfo.summary}</BodyLine>
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

          {(formData.references || []).length > 0 && (
            <>
              <SectionHeading>References</SectionHeading>
              {genericSectionMappers.references(formData.references).map((entry, i) => (
                <GenericEntry key={i} {...entry} />
              ))}
            </>
          )}
        </div>

        {/* Sidebar — appears first in DOM (semantically "supporting info"),
            second visually via order, positioned on the left */}
        {hasSidebarContent && (
          <div style={{ flex: "1 1 34%", order: 0, borderRight: "1pt solid #ddd", paddingRight: "14pt" }}>
            {contactLines.length > 0 && (
              <>
                <SectionHeading>Contact</SectionHeading>
                {contactLines.map((line, i) => (
                  <BodyLine key={i}>{line}</BodyLine>
                ))}
              </>
            )}

            {Object.keys(skillsByCategory).length > 0 && (
              <>
                <SectionHeading>Skills</SectionHeading>
                {Object.entries(skillsByCategory).map(([category, names]) => (
                  <div key={category} style={{ marginBottom: "4pt" }}>
                    <BodyLine style={{ fontWeight: "bold" }}>{category}</BodyLine>
                    <BodyLine style={{ color: "#333" }}>{names.join(", ")}</BodyLine>
                  </div>
                ))}
              </>
            )}

            {(formData.education || []).length > 0 && (
              <>
                <SectionHeading>Education</SectionHeading>
                {formData.education.map((entry) => (
                  <SidebarEducationEntry key={entry.id} entry={entry} />
                ))}
              </>
            )}

            {(formData.certifications || []).length > 0 && (
              <>
                <SectionHeading>Certifications</SectionHeading>
                {formData.certifications.map((entry) => (
                  <SidebarCertLine key={entry.id} entry={entry} />
                ))}
              </>
            )}

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
          </div>
        )}
      </div>
    </div>
  );
}
