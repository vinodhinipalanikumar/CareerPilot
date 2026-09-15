// src/data/ats/skills.js
//
// Canonical technical-skill catalog for the ATS engine. Every entry here is
// a lowercase "canonical" spelling. Alternate spellings/casings/aliases
// (e.g. "ReactJS", "Node JS") are NOT listed here — they live in
// synonyms.js's SKILL_NORMALIZATION map and are resolved down to one of
// these canonical strings by skillNormalizer.js. Keeping the two concerns
// separate is what lets the rest of the engine treat "a known skill" as one
// simple, deduplicated vocabulary.

export const KNOWN_SKILLS = [
  // Programming languages
  "javascript", "typescript", "python", "java", "c", "c++", "c#", "go",
  "rust", "kotlin", "swift", "ruby", "php", "scala", "r", "matlab", "perl",
  "dart", "objective-c", "shell scripting", "bash", "powershell",

  // Front-end
  "html", "css", "sass", "less", "tailwind css", "bootstrap", "react",
  "next.js", "vue", "nuxt.js", "angular", "svelte", "jquery", "redux",
  "webpack", "vite",

  // Back-end / frameworks
  "node.js", "express.js", "django", "flask", "fastapi", "spring boot",
  "spring", "asp.net", ".net", "laravel", "ruby on rails", "nestjs",
  "graphql", "rest api", "api development", "microservices",

  // Mobile
  "android", "ios", "react native", "flutter", "xamarin",

  // Databases
  "sql", "mysql", "postgresql", "sql server", "sqlite", "mongodb",
  "dynamodb", "redis", "cassandra", "firebase", "oracle database",
  "elasticsearch",

  // Cloud / DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
  "jenkins", "ci/cd", "github actions", "gitlab ci", "linux", "nginx",
  "serverless",

  // Data / AI / ML
  "machine learning", "deep learning", "nlp", "computer vision",
  "tensorflow", "pytorch", "keras", "scikit-learn", "opencv", "pandas",
  "numpy", "data analysis", "data visualization", "power bi", "tableau",
  "data structures and algorithms", "big data", "hadoop", "spark",
  "artificial intelligence", "generative ai", "llm", "statistics", "excel",

  // Tools / practices
  "git", "github", "gitlab", "bitbucket", "jira", "confluence", "vs code",
  "postman", "figma", "agile", "scrum", "object-oriented programming",
  "unit testing", "test automation", "selenium", "junit", "ui/ux design",

  // Soft/professional (kept deliberately small — most soft skills are
  // filtered out via SOFT_SKILL_STOPWORDS rather than tracked as "skills")
  "project management", "leadership", "communication",
];

// Phrases stripped out of JD text before frequency-based domain-keyword
// extraction (jdParser.js), so common soft-skill boilerplate doesn't get
// mistaken for a distinguishing "domain keyword" of the role.
export const SOFT_SKILL_STOPWORDS = [
  "team player", "communication skills", "problem solving",
  "problem-solving", "attention to detail", "time management",
  "work independently", "fast-paced environment", "fast paced environment",
  "self motivated", "self-motivated", "interpersonal skills",
  "critical thinking", "team environment", "collaborative environment",
  "strong communication", "verbal and written", "written communication",
  "analytical skills", "organizational skills", "multitasking",
  "detail oriented", "detail-oriented", "positive attitude",
  "work ethic", "team collaboration", "cross-functional teams",
  "cross functional teams", "adaptability", "growth mindset",
];

// Ordered from lowest to highest so DEGREE_LEVELS.forEach(...) in
// jdParser.js can take the max matched level when a JD mentions more than
// one (e.g. "Bachelor's or Master's degree").
export const DEGREE_LEVELS = [
  { level: 1, terms: ["diploma", "associate degree", "associate's degree"] },
  { level: 2, terms: ["bachelor", "b.tech", "btech", "b.e.", "bsc", "b.sc", "undergraduate degree"] },
  { level: 3, terms: ["master", "m.tech", "mtech", "msc", "m.sc", "mba", "postgraduate degree"] },
  { level: 4, terms: ["phd", "ph.d", "doctorate", "doctoral"] },
];

export const TECH_EDUCATION_FIELDS = [
  "computer science", "information technology", "software engineering",
  "computer engineering", "electronics and communication",
  "electrical engineering", "data science", "artificial intelligence",
  "information systems", "mathematics", "statistics", "cybersecurity",
];
