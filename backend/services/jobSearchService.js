// backend/services/jobSearchService.js
//
// Fans a small set of queries out across every configured provider, in
// parallel, and merges the results. One provider (or one query) failing
// never fails the whole search — see PROVIDER ARCHITECTURE / EMPTY-ERROR
// STATES requirements. Adding a future provider means adding one entry to
// `PROVIDERS` below; nothing else in the app needs to know it exists.

const { searchJooble, PROVIDER_NAME: JOOBLE } = require("./joobleService");
const { searchAdzuna, PROVIDER_NAME: ADZUNA } = require("./adzunaService");

const PROVIDERS = [
  { name: JOOBLE, search: searchJooble, configured: () => Boolean(process.env.JOOBLE_API_KEY) },
  { name: ADZUNA, search: searchAdzuna, configured: () => Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) },
];

/**
 * @param {string[]} queries
 * @param {object} options - { location }
 * @returns {Promise<{ jobs: object[], providerErrors: {provider:string, message:string}[], providersTried: string[] }>}
 */
async function searchAllProviders(queries, options = {}) {
  const configuredProviders = PROVIDERS.filter((p) => p.configured());

  if (configuredProviders.length === 0) {
    return {
      jobs: [],
      providerErrors: [{ provider: "all", message: "No job provider API credentials are configured on the server." }],
      providersTried: [],
    };
  }

  const tasks = [];
  for (const provider of configuredProviders) {
    for (const query of queries) {
      tasks.push(
        provider.search(query, options).then((result) => ({ provider: provider.name, query, ...result }))
      );
    }
  }

  const settled = await Promise.all(tasks);

  const jobs = [];
  const providerErrors = [];
  const failedByProvider = new Map();
  const succeededByProvider = new Set();

  settled.forEach(({ provider, error, jobs: providerJobs }) => {
    if (providerJobs && providerJobs.length > 0) {
      succeededByProvider.add(provider);
      jobs.push(...providerJobs);
    }
    if (error) {
      if (!failedByProvider.has(provider)) failedByProvider.set(provider, error);
    } else {
      succeededByProvider.add(provider);
    }
  });

  // Only report a provider as "failed" if it never returned anything usable
  // across any of the queries we tried.
  failedByProvider.forEach((message, provider) => {
    if (!succeededByProvider.has(provider)) providerErrors.push({ provider, message });
  });

  return { jobs, providerErrors, providersTried: configuredProviders.map((p) => p.name) };
}

module.exports = { searchAllProviders };
