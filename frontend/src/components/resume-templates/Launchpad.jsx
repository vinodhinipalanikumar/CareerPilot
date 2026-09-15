// Launchpad.jsx
// Student/Early-Career category, template 1 of 4.
// Structural signature: side-by-side header (large name+title left, circular
// photo top-right), and a deliberately non-standard section order that puts
// Projects and Technical Skills BEFORE Education — the opposite of every
// other template so far — since a first-job resume should lead with
// demonstrated ability, not just academic credentials.

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
  genericSectionMappers,
} from "./shared/resumeFormatters";

const SIZE = {
  name: "26pt",
  sectionHeading: "12pt",
  body: "11pt",
};

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1pt",
        borderBottom: "1.5pt solid #000",
        paddingBottom: "2pt",
        margin: "14pt 0 7pt",
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

function BulletList({ items, indent = "16pt" }) {
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12pt" }}>
      <span style={{ fontSize: SIZE.body, fontWeight: "bold" }}>{title}</span>
      {dateText && <span style={{ fontSize: "10pt", color: "#555", whiteSpace: "nowrap" }}>{dateText}</span>}
    </div>
  );
}

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "9pt" }}>
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
      <BodyLine>{[degreeLine, gradeInfo].filter(Boolean).join(" — ")}</BodyLine>
      {entry.coursework && <BodyLine>Relevant Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
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

export default function Launchpad({ formData, font = "Arial" }) {
  const personalInfo = formData.personalInfo || {};
  const contactLines = getContactLines(personalInfo);
  const skillsByCategory = groupSkillsByCategory(formData.skills);
  const languageSkills = getLanguageSkills(formData.skills);
  const interestNames = getInterestNames(formData.interests);
  const achievementEntries = genericSectionMappers.achievements(formData.achievements || []);

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
      {/* Side-by-side header: large name+title left, circular photo right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16pt" }}>
        <div>
          {personalInfo.fullName && (
            <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0 }}>{personalInfo.fullName}</h1>
          )}
          {personalInfo.professionalTitle && (
            <p style={{ fontSize: "13pt", margin: "3pt 0 0", color: "#333" }}>{personalInfo.professionalTitle}</p>
          )}
          {contactLines.length > 0 && (
            <p style={{ fontSize: "9.5pt", margin: "5pt 0 0" }}>{contactLines.join("   |   ")}</p>
          )}
        </div>
        {personalInfo.profilePhoto && (
          <img
            src={personalInfo.profilePhoto}
            alt=""
            style={{
              width: "1.1in",
              height: "1.1in",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <div style={{ borderBottom: "2pt solid #000", margin: "8pt 0 4pt" }} />

      {personalInfo.summary && (
        <>
          <SectionHeading>Profile</SectionHeading>
          <BodyLine>{personalInfo.summary}</BodyLine>
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

      {Object.keys(skillsByCategory).length > 0 && (
        <>
          <SectionHeading>Technical Skills</SectionHeading>
          {Object.entries(skillsByCategory).map(([category, names]) => (
            <BodyLine key={category}>
              <strong>{category}:</strong> {names.join(", ")}
            </BodyLine>
          ))}
        </>
      )}

      {(formData.internships || []).length > 0 && (
        <>
          <SectionHeading>Internships</SectionHeading>
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

      {(formData.education || []).length > 0 && (
        <>
          <SectionHeading>Education</SectionHeading>
          {formData.education.map((entry) => (
            <EducationEntry key={entry.id} entry={entry} />
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

      {achievementEntries.length > 0 && (
        <>
          <SectionHeading>Achievements</SectionHeading>
          {achievementEntries.map((entry, i) => (
            <GenericEntry key={i} {...entry} />
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
  );
}
