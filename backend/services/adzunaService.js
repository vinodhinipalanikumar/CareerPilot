// backend/services/adzunaService.js
//
// Provider: Adzuna (https://developer.adzuna.com/).
// Free app_id/app_key: register at developer.adzuna.com, then set
// ADZUNA_APP_ID / ADZUNA_APP_KEY in backend/.env.
// Endpoint: GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
//
// Adzuna is country-scoped. Defaults to "in" (India) since CareerPilot's
// sample locations (Chennai/Coimbatore/Bangalore/Hyderabad) are Indian
// cities; override with ADZUNA_COUNTRY in backend/.env for other regions.

const PROVIDER_NAME = "Adzuna";
const REQUEST_TIMEOUT_MS = 8000;

function normalizeAdzunaJob(raw) {
  if (!raw) return null;
  const salaryMin = raw.salary_min;
  const salaryMax = raw.salary_max;
  let salary = null;
  if (salaryMin && salaryMax) salary = `${Math.round(salaryMin)} - ${Math.round(salaryMax)}`;
  else if (salaryMin) salary = `From ${Math.round(salaryMin)}`;

  return {
    id: raw.id ? String(raw.id) : null,
    source: PROVIDER_NAME,
    title: raw.title || "",
    company: raw.company?.display_name || "",
    location: raw.location?.display_name || "",
    description: raw.description || "",
    salary,
    employmentType: raw.contract_time || raw.contract_type || null,
    postedDate: raw.created || null,
    url: raw.redirect_url || null,
  };
}

/**
 * @param {string} query - search keywords
 * @param {object} options - { location, resultsPerPage }
 * @returns {Promise<{jobs: object[], error: string|null}>}
 */
async function searchAdzuna(query, { location, resultsPerPage = 15 } = {}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return { jobs: [], error: "Adzuna API credentials are not configured." };
  }
  const country = process.env.ADZUNA_COUNTRY || "in";

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(resultsPerPage),
    what: query,
  });
  if (location) params.set("where", location);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return { jobs: [], error: `Adzuna responded with status ${response.status}.` };
    }

    const data = await response.json();
    const jobs = Array.isArray(data?.results) ? data.results.map(normalizeAdzunaJob).filter(Boolean) : [];
    return { jobs, error: null };
  } catch (err) {
    const message = err.name === "AbortError" ? "Adzuna request timed out." : err.message;
    return { jobs: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { searchAdzuna, PROVIDER_NAME };
