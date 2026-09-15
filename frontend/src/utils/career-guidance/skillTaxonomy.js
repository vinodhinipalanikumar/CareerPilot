// src/utils/career-guidance/skillTaxonomy.js
//
// Career Guidance keeps its own small, self-contained skill taxonomy and
// normalizer. It intentionally does NOT import anything from src/utils/ats
// or src/data/ats — those modules currently have unrelated missing
// dependencies, and more importantly, Career Guidance is a separate feature
// from the ATS Analyzer and should not become coupled to it.

// Canonical (lowercase) skill vocabulary this module understands. Anything
// not in this list is still kept as a normalized string (so a user's own
// wording is never silently dropped), it's just not matched against role
// requirements.
export const KNOWN_SKILLS = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "c", "php",
  "kotlin", "swift", "dart", "go", "ruby", "r", "sql", "html", "css",
  // Frontend
  "react", "angular", "vue.js", "next.js", "redux", "tailwind css",
  "bootstrap", "jquery",
  // Backend
  "node.js", "express.js", "spring boot", "django", "flask", "asp.net",
  "rest api", "graphql", "microservices",
  // Mobile
  "flutter", "react native", "android", "ios", "firebase",
  // Data
  "mysql", "postgresql", "mongodb", "oracle", "sql server", "sqlite",
  "dynamodb", "pandas", "numpy", "power bi", "tableau", "excel",
  "data structures and algorithms", "machine learning", "deep learning",
  "tensorflow", "pytorch", "scikit-learn", "statistics", "data visualization",
  "nlp", "data cleaning", "big data",
  // Cloud / DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "ci/cd",
  "jenkins", "terraform", "ansible", "linux", "devops", "cloud computing",
  // Design
  "figma", "adobe xd", "photoshop", "ui/ux design", "wireframing",
  "prototyping", "user research", "design systems",
  // QA / Security / DB admin
  "manual testing", "automation testing", "selenium", "junit", "testng",
  "api testing", "postman", "cybersecurity", "network security",
  "penetration testing", "wireshark", "nmap", "database administration",
  "database design", "backup and recovery", "performance tuning",
  // General / soft & foundational
  "oop", "object-oriented programming", "agile", "scrum", "communication",
  "problem solving", "teamwork", "unit testing", "system design",
];

// alias (any casing/spacing) -> canonical KNOWN_SKILLS entry
const RAW_ALIASES = {
  "js": "javascript",
  "es6": "javascript",
  "ts": "typescript",
  "reactjs": "react",
  "react.js": "react",
  "react js": "react",
  "vue": "vue.js",
  "vuejs": "vue.js",
  "nextjs": "next.js",
  "next js": "next.js",
  "nodejs": "node.js",
  "node": "node.js",
  "node js": "node.js",
  "expressjs": "express.js",
  "express": "express.js",
  "spring": "spring boot",
  "springboot": "spring boot",
  ".net": "asp.net",
  "dotnet": "asp.net",
  "asp .net": "asp.net",
  "restful api": "rest api",
  "restful apis": "rest api",
  "rest apis": "rest api",
  "api development": "rest api",
  "flutter development": "flutter",
  "java programming": "java",
  "python programming": "python",
  "c plus plus": "c++",
  "cpp": "c++",
  "csharp": "c#",
  "c sharp": "c#",
  "golang": "go",
  "postgres": "postgresql",
  "mongo": "mongodb",
  "ms sql server": "sql server",
  "mssql": "sql server",
  "tailwind": "tailwind css",
  "bootstrap css": "bootstrap",
  "amazon web services": "aws",
  "google cloud": "gcp",
  "google cloud platform": "gcp",
  "microsoft azure": "azure",
  "k8s": "kubernetes",
  "ci cd": "ci/cd",
  "cicd": "ci/cd",
  "continuous integration": "ci/cd",
  "version control": "git",
  "github actions": "ci/cd",
  "ml": "machine learning",
  "dl": "deep learning",
  "data structures & algorithms": "data structures and algorithms",
  "dsa": "data structures and algorithms",
  "data structure and algorithm": "data structures and algorithms",
  "algorithms": "data structures and algorithms",
  "scikit learn": "scikit-learn",
  "sklearn": "scikit-learn",
  "natural language processing": "nlp",
  "ui ux design": "ui/ux design",
  "ui/ux": "ui/ux design",
  "ux design": "ui/ux design",
  "ui design": "ui/ux design",
  "user experience design": "ui/ux design",
  "adobe photoshop": "photoshop",
  "wireframes": "wireframing",
  "prototype design": "prototyping",
  "android development": "android",
  "android studio": "android",
  "ios development": "ios",
  "react native development": "react native",
  "oops": "oop",
  "object oriented programming": "object-oriented programming",
  "postman api testing": "postman",
  "automated testing": "automation testing",
  "manual qa": "manual testing",
  "software testing": "manual testing",
  "network security fundamentals": "network security",
  "ethical hacking": "penetration testing",
  "pen testing": "penetration testing",
  "dba": "database administration",
  "database management": "database administration",
  "dbms": "database administration",
};

// Build reverse index: canonical -> [canonical, ...aliases]
const CANONICAL_TO_VARIANTS = new Map();
KNOWN_SKILLS.forEach((s) => CANONICAL_TO_VARIANTS.set(s, [s]));
Object.entries(RAW_ALIASES).forEach(([alias, canonical]) => {
  if (!CANONICAL_TO_VARIANTS.has(canonical)) return;
  CANONICAL_TO_VARIANTS.get(canonical).push(alias);
});

export function cleanText(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a single raw skill string (e.g. from the resume Skills section)
 * to a canonical form. Returns { canonical, isKnown }.
 */
export function normalizeSkill(rawSkill) {
  const cleaned = cleanText(rawSkill);
  if (!cleaned) return null;
  if (RAW_ALIASES[cleaned]) return { canonical: RAW_ALIASES[cleaned], isKnown: true };
  if (KNOWN_SKILLS.includes(cleaned)) return { canonical: cleaned, isKnown: true };
  return { canonical: cleaned, isKnown: false };
}

const KNOWN_SKILLS_SET = new Set(KNOWN_SKILLS);

function wholeWordPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#./])${escaped}($|[^a-z0-9+#./])`, "i");
}

/**
 * Scan a block of free text (project description, "technologies used",
 * responsibilities, etc.) for every known skill it mentions, alias-aware.
 * Returns deduped canonical skill names.
 */
export function scanTextForSkills(text) {
  const lower = ` ${cleanText(text)} `;
  if (!lower.trim()) return [];
  const found = new Set();
  CANONICAL_TO_VARIANTS.forEach((variants, canonical) => {
    if (variants.some((v) => wholeWordPattern(v).test(lower))) found.add(canonical);
  });
  return [...found];
}

const DISPLAY_OVERRIDES = {
  "html": "HTML", "css": "CSS", "sql": "SQL", "aws": "AWS", "gcp": "GCP",
  "rest api": "REST API", "ci/cd": "CI/CD", "ui/ux design": "UI/UX Design",
  "nlp": "NLP", "node.js": "Node.js", "next.js": "Next.js", "c++": "C++",
  "c#": "C#", "asp.net": "ASP.NET", "graphql": "GraphQL", "mysql": "MySQL",
  "postgresql": "PostgreSQL", "mongodb": "MongoDB", "sqlite": "SQLite",
  "dynamodb": "DynamoDB", "javascript": "JavaScript", "typescript": "TypeScript",
  "object-oriented programming": "Object-Oriented Programming",
  "data structures and algorithms": "Data Structures & Algorithms",
  "power bi": "Power BI", "tensorflow": "TensorFlow", "pytorch": "PyTorch",
  "scikit-learn": "Scikit-learn", "ios": "iOS", "sql server": "SQL Server",
  "vue.js": "Vue.js", "react": "React", "react native": "React Native",
  "angular": "Angular", "spring boot": "Spring Boot", "php": "PHP",
  "express.js": "Express.js", "oop": "OOP", "adobe xd": "Adobe XD",
  "figma": "Figma", "github": "GitHub", "git": "Git",
};

export function displaySkill(canonical) {
  if (DISPLAY_OVERRIDES[canonical]) return DISPLAY_OVERRIDES[canonical];
  return canonical.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isKnownSkill(canonical) {
  return KNOWN_SKILLS_SET.has(canonical);
}
