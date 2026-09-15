// src/data/ats/synonyms.js
//
// Maps a raw, as-typed skill spelling/alias (always compared in cleaned —
// lowercase, whitespace-collapsed — form) to the single canonical entry it
// should resolve to in KNOWN_SKILLS. Only aliases for genuinely known
// skills belong here; unrecognized terms are left alone by skillNormalizer.

export const SKILL_NORMALIZATION = {
  // JavaScript / TypeScript
  "js": "javascript", "es6": "javascript", "ecmascript": "javascript",
  "ts": "typescript",

  // Node / React / Vue / Angular ecosystem
  "nodejs": "node.js", "node js": "node.js", "node": "node.js",
  "reactjs": "react", "react.js": "react",
  "nextjs": "next.js",
  "vuejs": "vue", "vue.js": "vue",
  "nuxtjs": "nuxt.js",
  "angularjs": "angular",
  "expressjs": "express.js", "express": "express.js",
  "nestjs": "nestjs", "nest.js": "nestjs",

  // C family
  "c sharp": "c#", "csharp": "c#",
  "cpp": "c++",
  "dot net": ".net", "dotnet": ".net", ".net core": ".net", "asp.net core": "asp.net",

  // Python
  "py": "python",

  // Databases
  "postgres": "postgresql", "postgre sql": "postgresql",
  "mongo": "mongodb",
  "ms sql server": "sql server", "mssql": "sql server",
  "dynamo db": "dynamodb",

  // Cloud
  "amazon web services": "aws", "aws cloud": "aws",
  "google cloud": "gcp", "google cloud platform": "gcp",
  "microsoft azure": "azure",
  "ci cd": "ci/cd", "ci-cd": "ci/cd", "continuous integration": "ci/cd",
  "continuous deployment": "ci/cd", "continuous delivery": "ci/cd",

  // APIs
  "restful api": "rest api", "restful apis": "rest api", "rest apis": "rest api",
  "restful services": "rest api", "api design": "api development",

  // ML / Data
  "ml": "machine learning", "sklearn": "scikit-learn",
  "scikit learn": "scikit-learn",
  "cv": "computer vision",
  "dl": "deep learning",
  "natural language processing": "nlp",
  "artificial intelligence (ai)": "artificial intelligence", "ai": "artificial intelligence",
  "large language model": "llm", "large language models": "llm",
  "generative artificial intelligence": "generative ai", "genai": "generative ai",
  "data structures & algorithms": "data structures and algorithms",
  "dsa": "data structures and algorithms",
  "power-bi": "power bi", "powerbi": "power bi",

  // Web basics
  "html5": "html", "css3": "css",
  "tailwindcss": "tailwind css", "tailwind": "tailwind css",

  // Mobile
  "react-native": "react native",

  // OOP / testing
  "oop": "object-oriented programming",
  "oops": "object-oriented programming",
  "ui ux design": "ui/ux design", "ui/ux": "ui/ux design", "uiux design": "ui/ux design",

  // Tools
  "vscode": "vs code", "visual studio code": "vs code",
  "git hub": "github", "git lab": "gitlab",

  // Shell
  "shell script": "shell scripting", "bash scripting": "bash",
};
