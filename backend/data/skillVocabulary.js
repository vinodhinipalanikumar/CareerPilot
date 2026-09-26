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

// --- Alias/synonym normalization -------------------------------------------
//
// ROOT CAUSE of Job Recommendations' "MongoDB resume vs. Mongo job" (and
// similar) false-mismatches: this vocabulary previously only recognized the
// ONE canonical spelling of each skill, on BOTH sides of the match — a job
// posting that says "Mongo", "Node", "React.js", "JS", or "Postgres" simply
// never matched a resume that (correctly) said "MongoDB", "Node.js",
// "React", "JavaScript", or "PostgreSQL", and vice versa. Explicit resume
// skills (typed into the Skills section) were also never canonicalized
// before being compared — two different spellings of the exact same skill
// counted as two different, unrelated skills.
// This mirrors the alias approach already used by the frontend ATS module
// (src/utils/ats/skillNormalizer.js + data/ats/synonyms.js) — kept as its
// own small map here (not a shared import) because this backend runs as a
// separate Node service from the Vite frontend bundle.
const SKILL_ALIASES = {
  "mongo": "mongodb",
  "js": "javascript",
  "ts": "typescript",
  "node": "node.js",
  "nodejs": "node.js",
  "express": "express.js",
  "expressjs": "express.js",
  "reactjs": "react",
  "react.js": "react",
  "vuejs": "vue",
  "vue.js": "vue",
  "nextjs": "next.js",
  "postgres": "postgresql",
  "psql": "postgresql",
  "py": "python",
  "golang": "go",
  "k8s": "kubernetes",
  "aws lambda": "aws",
  "ml": "machine learning",
  "dl": "deep learning",
  "cv": "computer vision",
  "nlp": "nlp",
  "restful api": "rest api",
  "rest apis": "rest api",
  "spring": "spring boot",
  "asp .net": "asp.net",
  "dotnet": ".net",
  ".net core": ".net",
  "sql server": "sql server",
  "mssql": "sql server",
  "html5": "html",
  "css3": "css",
  "tailwind": "tailwind css",
  "ci cd": "ci/cd",
  "cicd": "ci/cd",
  "ui ux": "ui/ux design",
  "ux/ui design": "ui/ux design",
  "power-bi": "power bi",
  "data structures & algorithms": "data structures and algorithms",
  "dsa": "data structures and algorithms",
};

// Canonical skill -> every alias that resolves to it (built once).
const CANONICAL_TO_ALIASES = new Map();
SKILL_VOCABULARY.forEach((s) => CANONICAL_TO_ALIASES.set(s, [s]));
Object.entries(SKILL_ALIASES).forEach(([alias, canonical]) => {
  if (!CANONICAL_TO_ALIASES.has(canonical)) return; // only alias known vocabulary
  CANONICAL_TO_ALIASES.get(canonical).push(alias);
});

function wholeWordPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#./])${escaped}($|[^a-z0-9+#./])`, "i");
}

/** Resolve a raw skill string (as typed by a candidate, e.g. "React.js",
 *  "Mongo", "Node") to ONE canonical vocabulary spelling, if recognized.
 *  Returns the canonical string, or the cleaned-but-unrecognized input
 *  unchanged (never invents a skill that isn't in the vocabulary or its
 *  aliases — an unrecognized raw skill is still kept, just not aliased). */
function canonicalizeSkill(raw) {
  const cleaned = String(raw || "").trim().toLowerCase();
  if (!cleaned) return "";
  if (SKILL_VOCABULARY.includes(cleaned)) return cleaned;
  if (SKILL_ALIASES[cleaned]) return SKILL_ALIASES[cleaned];
  return cleaned;
}

/** Every vocabulary skill that appears (as a whole word/phrase) in `text` —
 *  checking BOTH the canonical spelling and every known alias of it, so
 *  "Mongo" in a job description still registers as the same skill as
 *  "MongoDB" on a resume. Always returns canonical (deduped) skill names. */
function scanTextForSkills(text) {
  if (!text) return [];
  const lower = ` ${String(text).toLowerCase()} `;
  const found = new Set();
  for (const skill of SKILL_VOCABULARY) {
    const variants = CANONICAL_TO_ALIASES.get(skill) || [skill];
    if (variants.some((v) => wholeWordPattern(v).test(lower))) found.add(skill);
  }
  return Array.from(found);
}

module.exports = { SKILL_VOCABULARY, SKILL_ALIASES, canonicalizeSkill, scanTextForSkills, wholeWordPattern };
