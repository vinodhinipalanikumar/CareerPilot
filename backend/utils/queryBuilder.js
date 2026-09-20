// backend/utils/queryBuilder.js
//
// Generates a bounded list of search-query strings for the external job
// providers. See "SEARCH QUERY GENERATION" requirements: never search on
// just one skill, but also never fire off dozens of API calls for one
// search.

const MAX_QUERIES = 4;

/**
 * @param {object} profile - output of resumeProfileExtractor.extractJobProfile
 * @param {string} [keywordOverride] - user-typed keyword from the search
 *   filters UI. When present, the user is explicitly taking control of the
 *   search, so it becomes the query (the user "should be able to modify the
 *   search instead of being forced to use only automatically generated
 *   keywords").
 */
function buildSearchQueries(profile, keywordOverride) {
  const trimmedOverride = (keywordOverride || "").trim();
  if (trimmedOverride) {
    return [trimmedOverride];
  }

  const queries = [];

  // 1. Rule-matched target roles (e.g. "Java Developer", "React Developer")
  (profile.targetRoles || []).forEach((role) => {
    if (queries.length < MAX_QUERIES && !queries.includes(role)) queries.push(role);
  });

  // 2. Actual job titles held (internship/work experience), which are often
  //    more specific than the generic rule-based roles above.
  (profile.jobTitles || []).forEach((title) => {
    if (queries.length < MAX_QUERIES && !queries.some((q) => q.toLowerCase() === title.toLowerCase())) {
      queries.push(title);
    }
  });

  // 3. Fallback: if nothing matched (very sparse resume), search directly on
  //    the top 2-3 listed skills combined, or a generic query as a last resort.
  if (queries.length === 0) {
    const topSkills = (profile.skills || []).slice(0, 3);
    if (topSkills.length > 0) {
      queries.push(topSkills.map((s) => capitalize(s)).join(" "));
    } else {
      queries.push("Entry Level Software Developer");
    }
  }

  return queries.slice(0, MAX_QUERIES);
}

function capitalize(word) {
  return word.replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { buildSearchQueries, MAX_QUERIES };
