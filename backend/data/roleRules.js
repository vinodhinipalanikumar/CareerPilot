// backend/data/roleRules.js
//
// Used by utils/queryBuilder.js (turn resume skills into search queries)
// and utils/jobMatcher.js (role/title relevance scoring). Each rule's
// `skills` are matched case-insensitively against the candidate's resume
// skill list; `minMatches` is how many of those skills must be present
// before the role title is considered a relevant search query for this
// resume.

const ROLE_RULES = [
  { title: "Java Developer", skills: ["java", "spring boot", "spring"], minMatches: 1 },
  { title: "React Developer", skills: ["react", "next.js", "redux"], minMatches: 1 },
  { title: "Frontend Developer", skills: ["html", "css", "javascript", "react", "vue", "angular"], minMatches: 2 },
  { title: "Backend Developer", skills: ["node.js", "express.js", "java", "spring boot", "django", "flask", "sql", "mongodb"], minMatches: 2 },
  { title: "Full Stack Developer", skills: ["react", "node.js", "javascript", "mongodb", "sql", "java", "express.js"], minMatches: 3 },
  { title: "Python Developer", skills: ["python", "django", "flask", "fastapi"], minMatches: 1 },
  { title: "Software Developer", skills: ["java", "python", "javascript", "c++", "c#", ".net"], minMatches: 1 },
  { title: "Mobile App Developer", skills: ["flutter", "dart", "react native", "android", "ios"], minMatches: 1 },
  { title: "Flutter Developer", skills: ["flutter", "dart"], minMatches: 1 },
  { title: "Android Developer", skills: ["android", "kotlin", "java"], minMatches: 1 },
  { title: "iOS Developer", skills: ["ios", "swift"], minMatches: 1 },
  { title: "Data Analyst", skills: ["sql", "excel", "power bi", "tableau", "data analysis"], minMatches: 2 },
  { title: "Data Scientist", skills: ["python", "machine learning", "pandas", "numpy", "scikit-learn"], minMatches: 2 },
  { title: "Machine Learning Engineer", skills: ["machine learning", "tensorflow", "pytorch", "deep learning"], minMatches: 1 },
  { title: "DevOps Engineer", skills: ["docker", "kubernetes", "ci/cd", "jenkins", "terraform", "aws"], minMatches: 2 },
  { title: "Cloud Engineer", skills: ["aws", "azure", "gcp"], minMatches: 1 },
  { title: "QA Engineer", skills: ["selenium", "manual testing", "automation testing", "junit", "cypress"], minMatches: 1 },
  { title: "UI/UX Designer", skills: ["figma", "ui/ux design"], minMatches: 1 },
  { title: "Database Administrator", skills: ["mysql", "postgresql", "sql server", "oracle", "mongodb"], minMatches: 1 },
  { title: "Cybersecurity Analyst", skills: ["cybersecurity", "network security", "penetration testing"], minMatches: 1 },
  { title: "Business Analyst", skills: ["business analysis", "excel", "sql"], minMatches: 2 },
];

module.exports = { ROLE_RULES };
