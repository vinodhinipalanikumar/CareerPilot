// sampleResumeData.js
// Fixed placeholder data used ONLY to render miniature template previews
// (see TemplateThumbnail.jsx) so a user can see a template's actual layout
// before selecting it. Never touches or is mixed with the user's real
// formData — the full-size preview on the right always uses the real data.

// Small inline SVG avatar (no network request, no external asset) so
// photo-enabled templates show where the photo will sit.
const SAMPLE_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
      <rect width='120' height='120' fill='#cbd5e1'/>
      <circle cx='60' cy='46' r='24' fill='#94a3b8'/>
      <rect x='20' y='78' width='80' height='42' rx='20' fill='#94a3b8'/>
    </svg>`
  );

export const SAMPLE_RESUME_DATA = {
  personalInfo: {
    fullName: "Alex Morgan",
    professionalTitle: "Software Engineer",
    email: "alex.morgan@email.com",
    phone: "+1 555 123 4567",
    city: "Austin",
    state: "TX",
    country: "USA",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "github.com/alexmorgan",
    summary:
      "Results-driven software engineer with a track record of shipping reliable, user-focused products.",
    profilePhoto: SAMPLE_PHOTO,
  },
  education: [
    {
      id: "s-edu-1",
      institution: "State University",
      degree: "B.S. Computer Science",
      duration: { startMonth: "Aug", startYear: "2018", endMonth: "May", endYear: "2022" },
      cgpa: "3.8",
    },
  ],
  skills: [
    { id: "s-sk-1", category: "Technical Skills", skillName: "JavaScript", proficiency: "Advanced" },
    { id: "s-sk-2", category: "Technical Skills", skillName: "React", proficiency: "Advanced" },
    { id: "s-sk-3", category: "Technical Skills", skillName: "Node.js", proficiency: "Intermediate" },
    { id: "s-sk-4", category: "Languages Known", skillName: "English", proficiency: "Fluent" },
  ],
  projects: [
    {
      id: "s-pr-1",
      title: "Personal Finance Tracker",
      technologies: "React, Node.js, MongoDB",
      duration: { startMonth: "Jan", startYear: "2023", current: true },
      description: "A web app for tracking budgets and spending trends.",
    },
  ],
  workExperience: [
    {
      id: "s-we-1",
      company: "Tech Solutions Inc.",
      jobTitle: "Software Engineer",
      duration: { startMonth: "Jun", startYear: "2022", current: true },
      responsibilities: "Built and maintained customer-facing web features.",
    },
  ],
  internships: [],
  certifications: [
    {
      id: "s-ce-1",
      name: "AWS Certified Developer",
      organization: "Amazon Web Services",
      duration: { startMonth: "Mar", startYear: "2023" },
    },
  ],
  achievements: [
    { id: "s-ac-1", title: "Hackathon Winner", organization: "State University", date: "2021-11-01" },
  ],
  awards: [],
  publications: [],
  research: [],
  volunteerWork: [],
  workshops: [],
  conferences: [],
  interests: [{ id: "s-in-1", interestName: "Open Source" }, { id: "s-in-2", interestName: "Chess" }],
  references: [],
};
