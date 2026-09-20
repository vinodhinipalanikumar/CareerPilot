// backend/utils/jobMatcher.js
//
// Two responsibilities, both required to be transparent (not "AI-scored"
// unless an actual AI call is made — it isn't here, this is plain rule-based
// arithmetic):
//   1. dedupeJobs   - collapse the same vacancy appearing from >1 provider
//   2. scoreJob     - compute { matchScore, matchedSkills, missingSkills, reasons }

const { scanTextForSkills } = require("../data/skillVocabulary");
const { ROLE_RULES } = require("../data/roleRules");

function normalizeForKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Collapse duplicate postings (same job surfaced by multiple providers).
 *  Key = normalized title + company + location, OR the provider's external
 *  id when title/company alone would be ambiguous. Keeps the first-seen
 *  copy and records every source it appeared under. */
function dedupeJobs(jobs) {
  const seen = new Map();
  const order = [];

  jobs.forEach((job) => {
    const key = job.url
      ? `url:${job.url.split("?")[0]}`
      : `sig:${normalizeForKey(job.title)}|${normalizeForKey(job.company)}|${normalizeForKey(job.location)}`;

    if (seen.has(key)) {
      const existing = seen.get(key);
      if (!existing.sources.includes(job.source)) existing.sources.push(job.source);
    } else {
      seen.set(key, { ...job, sources: [job.source] });
      order.push(key);
    }
  });

  return order.map((key) => seen.get(key));
}

function findMatchingRole(jobTitle) {
  const lowerTitle = (jobTitle || "").toLowerCase();
  return ROLE_RULES.find((rule) => lowerTitle.includes(rule.title.toLowerCase())) || null;
}

const JUNIOR_HINTS = ["fresher", "junior", "entry level", "entry-level", "graduate", "intern", "trainee"];
const SENIOR_HINTS = ["senior", "lead", "principal", "architect", "5+ years", "7+ years", "10+ years"];
const REMOTE_HINTS = ["remote", "work from home", "wfh"];

/**
 * @param {object} job - normalized job object
 * @param {object} profile - resumeProfileExtractor output
 * @param {object} searchContext - { location, remote }
 */
function scoreJob(job, profile, searchContext = {}) {
  const jobText = `${job.title || ""} ${job.description || ""}`.toLowerCase();
  const jobSkills = new Set(scanTextForSkills(jobText));
  const profileSkills = new Set((profile.skills || []).map((s) => s.toLowerCase()));

  const matchedSkills = Array.from(jobSkills).filter((s) => profileSkills.has(s));
  const missingSkills = Array.from(jobSkills).filter((s) => !profileSkills.has(s)).slice(0, 6);

  const reasons = [];

  // --- Skill match: up to 50 points ---
  const skillDenominator = Math.max(jobSkills.size, 1);
  const skillRatio = matchedSkills.length / skillDenominator;
  const skillPoints = jobSkills.size === 0 ? 25 : Math.round(skillRatio * 50);
  if (matchedSkills.length > 0) {
    reasons.push(`Matched ${matchedSkills.length} skill${matchedSkills.length === 1 ? "" : "s"} from your resume: ${matchedSkills.slice(0, 4).join(", ")}.`);
  }

  // --- Role/title match: up to 20 points ---
  let rolePoints = 0;
  const titleLower = (job.title || "").toLowerCase();
  const hasTitleOverlap =
    (profile.targetRoles || []).some((role) => titleLower.includes(role.toLowerCase())) ||
    (profile.jobTitles || []).some((title) => title && titleLower.includes(title.toLowerCase()));
  if (hasTitleOverlap) {
    rolePoints = 20;
    reasons.push("Job title closely matches your resume's role/experience.");
  } else {
    const matchingRole = findMatchingRole(job.title);
    if (matchingRole && (profile.targetRoles || []).includes(matchingRole.title)) {
      rolePoints = 12;
      reasons.push(`Job title aligns with a role your skills support (${matchingRole.title}).`);
    }
  }

  // --- Project/experience relevance: up to 15 points ---
  let experiencePoints = 0;
  const projectHit = (profile.projectTitles || []).some((t) => t && jobText.includes(t.toLowerCase()));
  if (projectHit) {
    experiencePoints += 8;
    reasons.push("Relevant project experience found on your resume.");
  }
  const isJuniorPosting = JUNIOR_HINTS.some((h) => jobText.includes(h));
  const isSeniorPosting = SENIOR_HINTS.some((h) => jobText.includes(h));
  if (profile.experienceLevel !== "experienced" && isJuniorPosting) {
    experiencePoints += 7;
    reasons.push("Listing looks suitable for fresher/entry-level candidates.");
  } else if (profile.experienceLevel !== "experienced" && isSeniorPosting) {
    experiencePoints -= 5;
    reasons.push("Listing appears to target senior candidates.");
  } else if (profile.experienceLevel === "experienced") {
    experiencePoints += 4;
  }
  experiencePoints = Math.max(0, Math.min(15, experiencePoints));

  // --- Location: up to 10 points ---
  let locationPoints = 5; // neutral default when we can't tell either way
  const wantsRemote = Boolean(searchContext.remote);
  const jobIsRemote = REMOTE_HINTS.some((h) => jobText.includes(h) || (job.location || "").toLowerCase().includes(h));
  const targetLocation = (searchContext.location || profile.location || "").toLowerCase();
  if (wantsRemote || jobIsRemote) {
    if (wantsRemote && jobIsRemote) {
      locationPoints = 10;
      reasons.push("Remote position, matching your preference.");
    } else if (jobIsRemote) {
      locationPoints = 8;
    }
  } else if (targetLocation && (job.location || "").toLowerCase().includes(targetLocation)) {
    locationPoints = 10;
    reasons.push(`Located in ${job.location}, matching your selected location.`);
  } else if (targetLocation) {
    locationPoints = 3;
  }

  // --- Education: up to 5 points (only ever a bonus, never a hard penalty
  //     — most postings don't state degree requirements at all) ---
  let educationPoints = 2;
  if (profile.educationText) {
    const degreeWords = profile.educationText.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    if (degreeWords.some((w) => jobText.includes(w))) {
      educationPoints = 5;
      reasons.push("Your educational background matches this listing.");
    }
  }

  const matchScore = Math.max(0, Math.min(100, skillPoints + rolePoints + experiencePoints + locationPoints + educationPoints));

  if (reasons.length === 0) {
    reasons.push("General relevance based on your overall resume profile.");
  }

  return { matchScore, matchedSkills, missingSkills, reasons };
}

module.exports = { dedupeJobs, scoreJob };
