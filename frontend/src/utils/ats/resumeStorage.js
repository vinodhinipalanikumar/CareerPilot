// src/utils/ats/resumeStorage.js
//
// Single source of truth for reading/writing the CareerPilot Resume Builder's
// `formData` outside of React state. Everything that needs this resume
// (ResumeBuilder itself, ATS Analyzer, Career Guidance, Resume Preview)
// should go through these two functions instead of touching storage
// directly — that's what keeps them all reading/writing the exact same key
// in the exact same shape.
//
// Backed by localStorage (not sessionStorage) so the resume survives a
// closed tab/browser, not just a refresh — per the "leave the app, come
// back later" and "refresh, then open Career Guidance" requirements.

import { ATS_RESUME_STORAGE_KEY } from "./storageKeys";

/**
 * Persist the Resume Builder's formData (+ selected font) as the canonical
 * CareerPilot resume. Safe to call on every formData change.
 */
export function saveResumeData(formData, font) {
  try {
    localStorage.setItem(ATS_RESUME_STORAGE_KEY, JSON.stringify({ formData, font }));
  } catch {
    // localStorage may be unavailable (e.g. private browsing / storage full).
    // Non-fatal: the in-memory formData the user is actively editing is
    // unaffected, only the cross-page/cross-session snapshot is skipped.
  }
}

/**
 * Read back the saved CareerPilot resume's formData.
 * Returns null if nothing is saved, or if what's saved is corrupted/malformed
 * — callers should treat null exactly like "no resume yet" and must never
 * throw or crash on bad stored data.
 */
export function getSavedResumeData() {
  try {
    const raw = localStorage.getItem(ATS_RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.formData || null;
  } catch {
    // Malformed JSON or storage access error — treat as "no resume".
    return null;
  }
}

/** Read back the font saved alongside the resume, if any. */
export function getSavedResumeFont() {
  try {
    const raw = localStorage.getItem(ATS_RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.font || null;
  } catch {
    return null;
  }
}
