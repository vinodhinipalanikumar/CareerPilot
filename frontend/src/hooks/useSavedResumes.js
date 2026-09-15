// useSavedResumes.js
// Lazily fetches the authenticated user's saved MongoDB resumes the first
// time `active` becomes true (e.g. once the user picks the "CareerPilot
// Resume" option), so pages that don't need this list never pay for the
// request. Shared by ATS Analysis and Career Guidance's resume pickers.
import { useEffect, useState } from "react";
import { resumesAPI } from "../utils/api";

export function useSavedResumes(active) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!active || fetched) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await resumesAPI.getAll();
        if (!cancelled) setResumes(data?.resumes || []);
      } catch {
        // Non-fatal — callers fall back to the single-resume localStorage
        // behavior when this list is empty.
        if (!cancelled) setResumes([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFetched(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, fetched]);

  return { resumes, loading };
}
