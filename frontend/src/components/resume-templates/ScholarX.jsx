// ScholarX.jsx
// Student/Early-Career category, template 4 of 4.
// Structural signature: academic-CV composition. Education-FIRST (before
// even the summary), followed by Research, Publications, Conferences,
// Workshops — sections most templates treat as minor, here treated as
// primary. Photo is a small SQUARE (not circular) frame top-right — a
// formal "CV headshot" convention, distinct from Launchpad's circular
// corner photo, CampusPro's sidebar photo, and Rise's centered circular photo.
// Publications are formatted as academic citations rather than the
// heading+date pattern used everywhere else.

import {
  formatDuration,
  getContactLines,
  groupSkillsByCategory,
  getLanguageSkills,
  getInterestNames,
  genericSectionMappers,
} from "./shared/resumeFormatters";

const SIZE = { name: "20pt", sectionHeading: "11.5pt", body: "10.5pt" };

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: SIZE.sectionHeading,
        fontWeight: "bold",
        fontVariant: "small-caps",
        letterSpacing: "1pt",
        borderBottom: "1pt solid #000",
        paddingBottom: "2pt",
        margin: "13pt 0 6pt",
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

function BulletList({ items, indent = "15pt" }) {
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
      {entry.coursework && <BodyLine>Relevant Coursework: {entry.coursework}</BodyLine>}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
    </div>
  );
}

// Academic citation style: "Title. Publisher, Authors. Date." — a distinct
// text treatment reinforcing the "CV, not corporate resume" feel.
function PublicationCitation({ entry }) {
  const parts = [entry.title, entry.publisher, entry.authors].filter(Boolean).join(". ");
  const dateText = entry.date ? ` (${entry.date})` : "";
  return (
    <div style={{ marginBottom: "5pt" }}>
      <BodyLine>
        {parts}
        {dateText}.
      </BodyLine>
      {(entry.doi || entry.url) && (
        <BodyLine style={{ color: "#555" }}>
          {entry.doi && `DOI: ${entry.doi}`}
          {entry.doi && entry.url && "   "}
          {entry.url && entry.url}
        </BodyLine>
      )}
      {entry.description && <BodyLine>{entry.description}</BodyLine>}
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

function ProjectEntry({ entry }) {
  return (
    <div style={{ marginBottom: "7pt" }}>
      <EntryHeaderRow title={entry.title} dateText={formatDuration(entry.duration)} />
      {entry.role && <BodyLine>{entry.role}</BodyLine>}
      <BulletList items={[entry.description, entry.keyFeatures, entry.responsibilities]} />
      {entry.technologies && <BodyLine>Tools: {entry.technologies}</BodyLine>}
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

export default function ScholarX({ formData, font = "Arial" }) {
  const personalInfo = formData.personalInfo || {};
  const contactLines = getContactLines(personalInfo);
  const skillsByCategory = groupSkillsByCategory(formData.skills);
  const languageSkills = getLanguageSkills(formData.skills);
  const interestNames = getInterestNames(formData.interests);

  const researchEntries = genericSectionMappers.research(formData.research || []);
  const conferenceEntries = genericSectionMappers.conferences(formData.conferences || []);
  const workshopEntries = genericSectionMappers.workshops(formData.workshops || []);
  const achievementEntries = genericSectionMappers.achievements(formData.achievements || []);

  return (
    <div
      id="resume-document"
      style={{
        width: "8.27in",
        minHeight: "11.69in",
        padding: "0.65in",
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: font,
        boxSizing: "border-box",
      }}
    >
      {/* Formal header: name+title+contact left, small square "CV photo" top-right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14pt" }}>
        <div>
          {personalInfo.fullName && (
            <h1 style={{ fontSize: SIZE.name, fontWeight: "bold", margin: 0 }}>{personalInfo.fullName}</h1>
          )}
          {personalInfo.professionalTitle && (
            <p style={{ fontSize: "11pt", margin: "3pt 0 0", fontStyle: "italic", color: "#333" }}>
              {personalInfo.professionalTitle}
            </p>
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
              width: "0.95in",
              height: "1.15in", // portrait aspect ratio — formal ID-photo proportions, not a circle
              objectFit: "cover",
              border: "1pt solid #000",
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <div style={{ borderBottom: "1.5pt solid #000", margin: "8pt 0 4pt" }} />

      {/* Education comes FIRST — before even the summary — per academic CV convention */}
      {(formData.education || []).length > 0 && (
        <>
          <SectionHeading>Education</SectionHeading>
          {formData.education.map((entry) => (
            <EducationEntry key={entry.id} entry={entry} />
          ))}
        </>
      )}

      {personalInfo.summary && (
        <>
          <SectionHeading>Research Interests</SectionHeading>
          <BodyLine>{personalInfo.summary}</BodyLine>
        </>
      )}

      {researchEntries.length > 0 && (
        <>
          <SectionHeading>Research Experience</SectionHeading>
          {researchEntries.map((entry, i) => (
            <GenericEntry key={i} {...entry} />
          ))}
        </>
      )}

      {(formData.publications || []).length > 0 && (
        <>
          <SectionHeading>Publications</SectionHeading>
          {formData.publications.map((entry, i) => (
            <PublicationCitation key={i} entry={entry} />
          ))}
        </>
      )}

      {conferenceEntries.length > 0 && (
        <>
          <SectionHeading>Conferences</SectionHeading>
          {conferenceEntries.map((entry, i) => (
            <GenericEntry key={i} {...entry} />
          ))}
        </>
      )}

      {workshopEntries.length > 0 && (
        <>
          <SectionHeading>Workshops</SectionHeading>
          {workshopEntries.map((entry, i) => (
            <GenericEntry key={i} {...entry} />
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

      {achievementEntries.length > 0 && (
        <>
          <SectionHeading>Achievements</SectionHeading>
          {achievementEntries.map((entry, i) => (
            <GenericEntry key={i} {...entry} />
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
