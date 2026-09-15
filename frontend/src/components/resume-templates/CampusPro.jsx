// CampusPro.jsx
// Student/Early-Career category, template 2 of 4.
// Structural signature: a genuine LEFT sidebar (Modern Two Column's sidebar
// is on the right) that carries the Photo + Contact + Skills + Interests —
// none of which Modern Two Column's sidebar carries (it only holds
// Education/Certifications, with contact staying in the top header). Main
// column holds Education, Projects, Internships, Certifications.
//
// ATS NOTE: like Modern Two Column, this uses CSS flex `order` so the
// substantive main content stays FIRST in DOM/source order even though the
// sidebar displays visually on the left — avoiding the "ATS reads sidebar
// skills before your projects" pitfall.

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
} from "./shared/resumeFormatters";

const SIZE = { name: "22pt", sectionHeading: "11pt", body: "10.5pt" };

function MainHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5pt",
        borderBottom: "1pt solid #000",
        paddingBottom: "2pt",
        margin: "12pt 0 6pt",
      }}
    >
      {children}
    </h2>
  );
}

function SidebarHeading({ children }) {
  return (
    <h3
      style={{
        fontSize: "10pt",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5pt",
        color: "#333",
        margin: "12pt 0 4pt",
      }}
    >
      {children}
    </h3>
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

function EntryHeaderRow({ title, dateText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10pt" }}>
      <span style={{ fontSize: SIZE.body, fontWeight: "bold" }}>{title}</span>
      {dateText && <span style={{ fontSize: "9.5pt", color: "#555", whiteSpace: "nowrap" }}>{dateText}</span>}
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
      {entry.coursework && <BodyLine>Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
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
          {entry.githubUrl && entry.demoUrl && "   "}
          {entry.demoUrl && `Live: ${entry.demoUrl}`}
        </BodyLine>
      )}
    </div>
  );
}

function RoleEntry({ role, company, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "7pt" }}>
      <EntryHeaderRow title={role} dateText={dateText} />
      {company && <BodyLine>{company}</BodyLine>}
      <BulletList items={bullets} />
      {technologies && <BodyLine>Technologies: {technologies}</BodyLine>}
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

export default function CampusPro({ formData, font = "Arial" }) {
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
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      {/* Full-width name/title band across the top */}
      <div style={{ padding: "0.5in 0.5in 0.2in" }}>
        {personalInfo.fullName && (
          <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0 }}>{personalInfo.fullName}</h1>
        )}
        {personalInfo.professionalTitle && (
          <p style={{ fontSize: "12pt", margin: "3pt 0 0", color: "#333" }}>{personalInfo.professionalTitle}</p>
        )}
      </div>

      {/* Two-column body: main content first in DOM (ATS priority), sidebar
          displayed on the LEFT visually via `order` */}
      <div style={{ display: "flex", padding: "0 0.5in 0.5in" }}>
        {/* Main column — appears second in DOM, but `order: 2` keeps it visually right */}
        <div style={{ order: 2, flex: "1 1 auto", paddingLeft: "0.3in" }}>
          {personalInfo.summary && (
            <>
              <MainHeading>Profile</MainHeading>
              <BodyLine>{personalInfo.summary}</BodyLine>
            </>
          )}

          {(formData.education || []).length > 0 && (
            <>
              <MainHeading>Education</MainHeading>
              {formData.education.map((entry) => (
                <EducationEntry key={entry.id} entry={entry} />
              ))}
            </>
          )}

          {(formData.projects || []).length > 0 && (
            <>
              <MainHeading>Projects</MainHeading>
              {formData.projects.map((entry) => (
                <ProjectEntry key={entry.id} entry={entry} />
              ))}
            </>
          )}

          {(formData.internships || []).length > 0 && (
            <>
              <MainHeading>Internships</MainHeading>
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

          {(formData.certifications || []).length > 0 && (
            <>
              <MainHeading>Certifications</MainHeading>
              {formData.certifications.map((entry) => (
                <CertificationLine key={entry.id} entry={entry} />
              ))}
            </>
          )}
        </div>

        {/* Sidebar — appears LAST in DOM (ATS-safe), but `order: 1` displays it first (left) */}
        <div
          style={{
            order: 1,
            flex: "0 0 2.3in",
            borderRight: "1pt solid #ccc",
            paddingRight: "0.25in",
          }}
        >
          {personalInfo.profilePhoto && (
            <img
              src={personalInfo.profilePhoto}
              alt=""
              style={{
                width: "1.4in",
                height: "1.4in",
                borderRadius: "8pt",
                objectFit: "cover",
                marginBottom: "8pt",
                display: "block",
              }}
            />
          )}

          {contactLines.length > 0 && (
            <>
              <SidebarHeading>Contact</SidebarHeading>
              {contactLines.map((line, i) => (
                <p key={i} style={{ fontSize: "9pt", margin: "0 0 2pt", wordBreak: "break-word" }}>
                  {line}
                </p>
              ))}
            </>
          )}

          {Object.keys(skillsByCategory).length > 0 && (
            <>
              <SidebarHeading>Skills</SidebarHeading>
              {Object.entries(skillsByCategory).map(([category, names]) => (
                <p key={category} style={{ fontSize: "9pt", margin: "0 0 3pt" }}>
                  <strong>{category}:</strong> {names.join(", ")}
                </p>
              ))}
            </>
          )}

          {languageSkills.length > 0 && (
            <>
              <SidebarHeading>Languages</SidebarHeading>
              <p style={{ fontSize: "9pt", margin: 0 }}>{languageSkills.join(", ")}</p>
            </>
          )}

          {interestNames.length > 0 && (
            <>
              <SidebarHeading>Interests</SidebarHeading>
              <p style={{ fontSize: "9pt", margin: 0 }}>{interestNames.join(", ")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
