// backend/data/skillVocabulary.js
//
// Purpose: ONLY for the Job Recommendations module's transparent skill
// matching (utils/jobMatcher.js) and search-query generation
// (utils/queryBuilder.js). Not a duplicate of the frontend ATS engine.
//
// Each entry is a lowercase canonical skill string. Job postings and resume
// skill lists are scanned for these as whole-word (or whole-phrase)
// case-insensitive matches.

const SKILL_VOCABULARY = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
  "kotlin", "swift", "ruby", "php", "scala", "dart", "r",

  // Frontend
  "html", "css", "sass", "tailwind css", "bootstrap", "react", "next.js",
  "vue", "angular", "svelte", "redux", "jquery",

  // Backend / frameworks
  "node.js", "express.js", "django", "flask", "fastapi", "spring boot",
  "spring", "asp.net", ".net", "laravel", "ruby on rails", "nestjs",
  "graphql", "rest api", "microservices",

  // Mobile
  "android", "ios", "react native", "flutter", "xamarin",

  // Databases
  "sql", "mysql", "postgresql", "sql server", "sqlite", "mongodb",
  "dynamodb", "redis", "firebase", "oracle",

  // Cloud / DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
  "jenkins", "ci/cd", "linux", "nginx",

  // Data / AI / ML
  "machine learning", "deep learning", "nlp", "computer vision",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "data analysis", "data visualization", "power bi", "tableau", "excel",
  "data structures and algorithms", "big data", "spark", "artificial intelligence",

  // Tools / practices
  "git", "github", "gitlab", "jira", "figma", "agile", "scrum",
  "unit testing", "selenium", "junit", "ui/ux design", "postman",

  // QA / testing / security
  "manual testing", "automation testing", "cypress", "penetration testing",
  "cybersecurity", "network security",

  // Business / soft
  "project management", "business analysis", "communication", "leadership",
];

function wholeWordPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#./])${escaped}($|[^a-z0-9+#./])`, "i");
}

/** Every vocabulary skill that appears (as a whole word/phrase) in `text`. */
function scanTextForSkills(text) {
  if (!text) return [];
  const lower = ` ${String(text).toLowerCase()} `;
  const found = [];
  for (const skill of SKILL_VOCABULARY) {
    if (wholeWordPattern(skill).test(lower)) found.push(skill);
  }
  return found;
}

module.exports = { SKILL_VOCABULARY, scanTextForSkills, wholeWordPattern };
