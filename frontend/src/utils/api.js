// Central place for the backend base URL so we never hardcode
// http://localhost:5001 (or a production URL) around the app.
import { getToken } from "./auth";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network-level failure (backend not running, wrong URL, CORS, etc.)
    throw new Error(
      "Could not reach the server. Please make sure the backend is running."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. 204) — fine to ignore.
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const authAPI = {
  signup: (payload) =>
    request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) =>
    request("/api/auth/login", { method: "POST", body: payload }),
};

// Authenticated CRUD calls for the logged-in user's saved resumes.
// Every call automatically sends the JWT from getToken() as a Bearer token.
export const resumesAPI = {
  getAll: () => request("/api/resumes", { token: getToken() }),
  getById: (id) => request(`/api/resumes/${id}`, { token: getToken() }),
  create: (data) =>
    request("/api/resumes", { method: "POST", body: data, token: getToken() }),
  update: (id, data) =>
    request(`/api/resumes/${id}`, { method: "PUT", body: data, token: getToken() }),
  delete: (id) =>
    request(`/api/resumes/${id}`, { method: "DELETE", token: getToken() }),
};
