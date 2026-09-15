// ProfessionalClassic.jsx
// This is the original ResumeDocument.jsx design, moved here as the first
// entry in the template system. Appearance is unchanged from before —
// only the data-derivation helpers were extracted to resumeFormatters.js
// so they can be shared with other templates.

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
  name: "22pt",
  sectionHeading: "14pt",
  body: "12pt",
};

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        textTransform: "uppercase",
        margin: "14pt 0 6pt",
      }}
    >
      {children}
    </h2>
  );
}

function BodyLine({ children, style = {} }) {
  return (
    <p style={{ fontSize: SIZE.body, textAlign: "justify", margin: "0 0 2pt", ...style }}>
      {children}
    </p>
  );
}

function BulletList({ items, indent = "16pt" }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <ul style={{ margin: "0 0 4pt", paddingLeft: indent }}>
      {visible.map((item, i) => (
        <li key={i} style={{ fontSize: SIZE.body, textAlign: "justify", lineHeight: 1.3 }}>
          {item}
        </li>
      ))}
    </ul>
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
  const degreeLine = [entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ") +
    (gradeInfo ? ` - ${gradeInfo}` : "");
  const years = [entry.duration?.startYear, entry.duration?.current ? "Present" : entry.duration?.endYear]
    .filter(Boolean)
    .join("-");
  const instLine = `${entry.institution || ""}${years ? ` [${years}]` : ""}`;

  return (
    <div style={{ marginBottom: "4pt" }}>
      <BulletList items={[degreeLine]} />
      <BodyLine style={{ marginLeft: "16pt" }}>{instLine}</BodyLine>
      {entry.coursework && (
        <BodyLine style={{ marginLeft: "16pt" }}>Relevant Coursework: {entry.coursework}</BodyLine>
      )}
      {entry.description && <BodyLine style={{ marginLeft: "16pt" }}>{entry.description}</BodyLine>}
    </div>
  );
}

function RoleEntry({ role, company, location, dateText, bullets = [], technologies }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12pt" }}>
        <span style={{ fontSize: SIZE.body }}>{role}</span>
        {dateText && <span style={{ fontSize: SIZE.body, whiteSpace: "nowrap" }}>{dateText}</span>}
      </div>
      {(company || location) && (
        <BodyLine>{[company, location].filter(Boolean).join(", ")}</BodyLine>
      )}
      <BulletList items={bullets} indent="20pt" />
      {technologies && <BodyLine>Technologies: {technologies}</BodyLine>}
    </div>
  );
}

function ProjectEntry({ index, entry }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      <div style={{ display: "flex", gap: "6pt" }}>
        <span style={{ fontSize: SIZE.body }}>{index}.</span>
        <span style={{ fontSize: SIZE.body, textAlign: "justify" }}>{entry.title}</span>
      </div>
      <div style={{ marginLeft: "20pt" }}>
        <BulletList
          items={[entry.description, entry.keyFeatures, entry.responsibilities]}
          indent="20pt"
        />
        {entry.technologies && <BodyLine>Tools: {entry.technologies}</BodyLine>}
        {entry.githubUrl && <BodyLine>GitHub project: {entry.githubUrl}</BodyLine>}
        {(entry.demoUrl || entry.githubUrl) && (
          <BodyLine>
            {entry.demoUrl && `Live: ${entry.demoUrl}`}
            {entry.demoUrl && entry.githubUrl && "    "}
            {entry.githubUrl && `Code: ${entry.githubUrl}`}
          </BodyLine>
        )}
      </div>
    </div>
  );
}

function CertificationLine({ entry }) {
  const parts = [entry.name, entry.organization].filter(Boolean).join(" - ");
  const dateText = formatDuration(entry.duration);
  return <BodyLine>{[parts, dateText].filter(Boolean).join(", ")}.</BodyLine>;
}

function GenericEntry({ heading, subheading, dateText, bullets = [] }) {
  return (
    <div style={{ marginBottom: "6pt" }}>
      {(heading || dateText) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12pt" }}>
          <span style={{ fontSize: SIZE.body }}>{heading}</span>
          {dateText && <span style={{ fontSize: SIZE.body, whiteSpace: "nowrap" }}>{dateText}</span>}
        </div>
      )}
      {subheading && <BodyLine>{subheading}</BodyLine>}
      <BulletList items={bullets} indent="20pt" />
    </div>
  );
}

export default function ProfessionalClassic({ formData, font = "Arial" }) {
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
        padding: "0.5in",
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {personalInfo.fullName && (
            <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0, lineHeight: 1.2 }}>
              {personalInfo.fullName}
            </h1>
          )}
          {personalInfo.professionalTitle && (
            <p style={{ fontSize: SIZE.body, margin: "2pt 0 0" }}>{personalInfo.professionalTitle}</p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {contactLines.map((line, i) => (
            <p key={i} style={{ fontSize: SIZE.body, margin: 0 }}>{line}</p>
          ))}
        </div>
      </div>

      {personalInfo.summary && (
        <>
          <SectionHeading>Professional Summary</SectionHeading>
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
              {category}: {names.join(", ")}
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
          {formData.projects.map((entry, i) => (
            <ProjectEntry key={entry.id} index={i + 1} entry={entry} />
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
