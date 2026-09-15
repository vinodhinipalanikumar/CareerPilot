// src/data/ats/roles.js
//
// Candidate roles for Career Fit analysis (Mode B — no job description
// provided). Each role lists its skills in three evidence tiers; every
// skill string MUST be a canonical KNOWN_SKILLS entry (see skills.js) so
// keywordMatcher/skillNormalizer can match it against a resume.
//
//  - requiredSkills:   core skills a candidate needs strong evidence of
//  - importantSkills:  skills that meaningfully strengthen the fit
//  - supportingSkills: nice-to-have / adjacent skills

export const ROLES = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    requiredSkills: ["html", "css", "javascript", "react"],
    importantSkills: ["typescript", "tailwind css", "redux", "next.js", "git"],
    supportingSkills: ["sass", "webpack", "vite", "figma", "ui/ux design"],
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    requiredSkills: ["node.js", "sql", "rest api"],
    importantSkills: ["express.js", "mongodb", "postgresql", "api development", "git"],
    supportingSkills: ["docker", "redis", "microservices", "graphql", "aws"],
  },
  {
    id: "full-stack-developer",
    title: "Full Stack Developer",
    requiredSkills: ["javascript", "react", "node.js", "sql"],
    importantSkills: ["typescript", "mongodb", "rest api", "git", "express.js"],
    supportingSkills: ["docker", "aws", "next.js", "graphql", "tailwind css"],
  },
  {
    id: "python-backend-developer",
    title: "Python Backend Developer",
    requiredSkills: ["python", "sql", "django"],
    importantSkills: ["flask", "fastapi", "rest api", "postgresql", "git"],
    supportingSkills: ["docker", "aws", "redis", "microservices"],
  },
  {
    id: "java-developer",
    title: "Java Developer",
    requiredSkills: ["java", "spring boot", "sql"],
    importantSkills: ["spring", "rest api", "mysql", "git"],
    supportingSkills: ["docker", "microservices", "aws", "junit"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    requiredSkills: ["sql", "data analysis", "excel"],
    importantSkills: ["python", "power bi", "tableau", "data visualization"],
    supportingSkills: ["pandas", "numpy", "statistics"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    requiredSkills: ["python", "machine learning", "data analysis"],
    importantSkills: ["pandas", "numpy", "scikit-learn", "statistics", "sql"],
    supportingSkills: ["tensorflow", "pytorch", "deep learning", "data visualization"],
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    requiredSkills: ["python", "machine learning", "tensorflow"],
    importantSkills: ["pytorch", "deep learning", "scikit-learn", "sql"],
    supportingSkills: ["nlp", "computer vision", "docker", "aws"],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    requiredSkills: ["docker", "kubernetes", "ci/cd"],
    importantSkills: ["aws", "linux", "terraform", "jenkins"],
    supportingSkills: ["ansible", "azure", "gcp", "bash"],
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    requiredSkills: ["aws", "linux"],
    importantSkills: ["docker", "terraform", "kubernetes", "ci/cd"],
    supportingSkills: ["azure", "gcp", "python", "bash"],
  },
  {
    id: "android-developer",
    title: "Android Developer",
    requiredSkills: ["android", "kotlin"],
    importantSkills: ["java", "rest api", "git"],
    supportingSkills: ["firebase", "sql"],
  },
  {
    id: "mobile-app-developer",
    title: "Mobile App Developer (Cross-Platform)",
    requiredSkills: ["react native", "javascript"],
    importantSkills: ["flutter", "dart", "rest api", "git"],
    supportingSkills: ["firebase", "typescript"],
  },
  {
    id: "qa-test-engineer",
    title: "QA / Test Engineer",
    requiredSkills: ["test automation", "selenium"],
    importantSkills: ["java", "python", "unit testing", "jira"],
    supportingSkills: ["junit", "agile", "git"],
  },
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    requiredSkills: ["ui/ux design", "figma"],
    importantSkills: ["html", "css", "data visualization"],
    supportingSkills: ["react", "bootstrap"],
  },
];
