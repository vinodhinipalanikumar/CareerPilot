// backend/services/joobleService.js
//
// Provider: Jooble (https://jooble.org/api/about).
// Free API key: sign up at jooble.org/api/about, then set JOOBLE_API_KEY in
// backend/.env. Endpoint is POST https://jooble.org/api/{apiKey}.
//
// NOTE ON RESPONSE SHAPE: Jooble's documented response is
//   { totalCount: number, jobs: [{ title, location, snippet, salary,
//     source, type, link, company, updated, id }] }
// Field availability can vary slightly by region/listing, so every field
// below is read defensively — an unexpected/missing field never throws,
// it just becomes null/undefined in the normalized job.

const PROVIDER_NAME = "Jooble";
const REQUEST_TIMEOUT_MS = 8000;

function normalizeJoobleJob(raw) {
  if (!raw) return null;
  return {
    id: raw.id ? String(raw.id) : null,
    source: PROVIDER_NAME,
    title: raw.title || "",
    company: raw.company || "",
    location: raw.location || "",
    description: raw.snippet || "",
    salary: raw.salary || null,
    employmentType: raw.type || null,
    postedDate: raw.updated || null,
    url: raw.link || null,
  };
}

/**
 * @param {string} query - search keywords
 * @param {object} options - { location }
 * @returns {Promise<{jobs: object[], error: string|null}>}
 */
async function searchJooble(query, { location } = {}) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    return { jobs: [], error: "Jooble API key is not configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  keywords: query,
  location: location || "India",
}),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { jobs: [], error: `Jooble responded with status ${response.status}.` };
    }

    const data = await response.json();
    const jobs = Array.isArray(data?.jobs) ? data.jobs.map(normalizeJoobleJob).filter(Boolean) : [];
    return { jobs, error: null };
  } catch (err) {
    const message = err.name === "AbortError" ? "Jooble request timed out." : err.message;
    return { jobs: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { searchJooble, PROVIDER_NAME };
