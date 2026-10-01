// Small helper around localStorage for the logged-in user's
// JWT and basic profile info. Intentionally simple for this step.

const TOKEN_KEY = "careerpilot_token";
const USER_KEY = "careerpilot_user";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  broadcastAuthChange();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ROOT CAUSE of "Navbar shows Logout on a fresh visit / after the token has
// expired" (reproduced by reading the actual logic, not assumed): the old
// isAuthenticated() only checked whether *a string exists* under
// careerpilot_token in localStorage. localStorage persists across browser
// restarts (unlike sessionStorage), and the backend signs tokens with a 7-day
// expiry (see backend/controllers/authController.js, `expiresIn: "7d"") —
// but nothing on the frontend ever checked that expiry. So a token left over
// from a previous session (even one that has since expired, or was never a
// real JWT at all — e.g. corrupted localStorage) was treated as permanently
// valid, and the Navbar showed "Logout" for a "logged out" user.
// FIX: decode the JWT payload (no signature verification needed here — the
// backend still verifies the signature on every real API call; this is only
// for "should the UI treat this person as logged in") and check `exp`.
// An expired, malformed, or missing token is treated as NOT authenticated,
// and the stale token is proactively cleared.

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  // No decodable payload, or no `exp` claim at all -> can't confirm it's a
  // real, current token, so treat it as invalid rather than trusting it
  // indefinitely.
  if (!payload || typeof payload.exp !== "number") return false;
  return Date.now() < payload.exp * 1000;
}

export function isAuthenticated() {
  const token = getToken();
  if (isTokenValid(token)) return true;
  // Stale/expired/malformed token found — clear it so the app doesn't keep
  // re-checking a dead token, and so the user cleanly lands on "logged out".
  if (token) logout();
  return false;
}

// Broadcast so already-mounted components (e.g. Navbar, DashboardLayout)
// can react to a login/logout that happened elsewhere in the same tab —
// a plain localStorage write does not by itself trigger a React re-render.
const AUTH_CHANGE_EVENT = "careerpilot:auth-change";

export function onAuthChange(callback) {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback); // cross-tab
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function broadcastAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  broadcastAuthChange();
}
