// ResumeBuilder.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom"; // CHANGED: replaces generateResumeDoc import
import DashboardLayout from "../layouts/DashboardLayout";
import { resumeSections } from "../data/resumeFormConfig";
import { AccordionSection, FieldRenderer } from "../components/resume-builder/FormElements";
import { saveResumeData } from "../utils/ats/resumeStorage";
import { resumesAPI } from "../utils/api";

const FONT_OPTIONS = ["Arial", "Calibri", "Times New Roman"];
// Canonical persistence: every other module (ATS Analyzer, Career Guidance,
// Resume Preview) reads this same saved resume via resumeStorage.js, so
// there is exactly one source of truth for the CareerPilot resume.

function buildInitialState(sections) {
  const state = {};
  sections.forEach((s) => { state[s.key] = s.repeatable ? [] : {}; });
  return state;
}

export default function ResumeBuilder() {
  const navigate = useNavigate(); // NEW
  const { resumeId: routeResumeId } = useParams(); // present only when editing a saved resume
  const [formData, setFormData] = useState(() => buildInitialState(resumeSections));
  const [openSections, setOpenSections] = useState({ personalInfo: true });
  const [editingId, setEditingId] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedFont, setSelectedFont] = useState("Arial");
  // REMOVED: isGenerating (no longer async — no docx generation happens here)

  // NEW: multi-resume MongoDB sync state.
  // `resumeId` starts as the route param (editing a saved resume) or null
  // (a brand-new resume) — and is filled in the moment a new resume is
  // first auto-saved, so every save after that updates the SAME document
  // instead of creating duplicates.
  const resumeIdRef = useRef(routeResumeId || null);
  const [title, setTitle] = useState(null); // null until a saved resume's real title loads
  const [templateId, setTemplateId] = useState("professional-classic");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "local"
  const debounceRef = useRef(null);
  const saveVersionRef = useRef(0); // guards against out-of-order responses

  const setResumeIdEverywhere = useCallback((id) => {
    resumeIdRef.current = id;
  }, []);

  // Create-or-update the current resume in MongoDB. Only formData/font are
  // sent from here — title/templateId are owned by Resume Preview's
  // explicit Save flow and are never overwritten by this autosave.
  const persistToMongo = useCallback(async (dataToSave, fontToSave) => {
    const thisVersion = ++saveVersionRef.current;
    setSaveStatus("saving");
    try {
      let saved;
      if (resumeIdRef.current) {
        const res = await resumesAPI.update(resumeIdRef.current, {
          formData: dataToSave,
          font: fontToSave,
        });
        saved = res?.resume;
      } else {
        const res = await resumesAPI.create({
          formData: dataToSave,
          font: fontToSave,
        });
        saved = res?.resume;
        if (saved?.id) {
          setResumeIdEverywhere(saved.id);
          // Reflect the new id in the URL so a refresh continues editing
          // the same resume instead of starting another new one.
          navigate(`/resume-builder/${saved.id}`, { replace: true });
        }
      }
      if (thisVersion === saveVersionRef.current) {
        setSaveStatus("saved");
        if (saved?.title) setTitle(saved.title);
        if (saved?.templateId) setTemplateId(saved.templateId);
      }
    } catch {
      // MongoDB save failed — localStorage (already written below) remains
      // the source of truth locally, so nothing is lost.
      if (thisVersion === saveVersionRef.current) {
        setSaveStatus("local");
      }
    }
  }, [navigate, setResumeIdEverywhere]);

  // On mount: if we're editing a saved resume (route has :resumeId), load
  // it from MongoDB. A brand-new resume (no :resumeId) always starts blank
  // — it must never preload another resume's data.
  useEffect(() => {
    let cancelled = false;

    if (!routeResumeId) {
      setHydrated(true);
      return;
    }

    (async () => {
      try {
        const data = await resumesAPI.getById(routeResumeId);
        const saved = data?.resume;
        if (!cancelled && saved) {
          setFormData(saved.formData || buildInitialState(resumeSections));
          if (saved.font) setSelectedFont(saved.font);
          if (saved.templateId) setTemplateId(saved.templateId);
          setTitle(saved.title || "My Resume");
        }
      } catch {
        // Could not load this saved resume (deleted, offline, etc.) — keep
        // the blank initial state rather than crash the page.
        if (!cancelled) setSaveStatus("local");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeResumeId]);

  // Persist on every change (not just on navigation) so the latest data is
  // never lost — this is what lets ATS Analyzer, Career Guidance, and Resume
  // Preview pick up the resume after a navigation, a closed tab, or a
  // refresh. Additive only — does not change any Resume Builder behavior or
  // validation.
  useEffect(() => {
    saveResumeData(formData, selectedFont);

    // Debounced MongoDB sync (only once we're past initial hydration, so we
    // never fire a save request on the very first render with blank data).
    if (!hydrated) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persistToMongo(formData, selectedFont);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData, selectedFont, hydrated, persistToMongo]);

  // Flush any pending debounced save immediately — used right before
  // navigating away so the next page always sees the latest data.
  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await persistToMongo(formData, selectedFont);
  }, [formData, selectedFont, persistToMongo]);

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateSingleField = (sectionKey, fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldName]: value },
    }));
  };

  const addEntry = (sectionKey) => {
    const id = crypto.randomUUID();
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], { id }],
    }));
    setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));
    setEditingId((prev) => ({ ...prev, [sectionKey]: id }));
  };

  const updateEntryField = (sectionKey, id, fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((entry) =>
        entry.id === id ? { ...entry, [fieldName]: value } : entry
      ),
    }));
  };

  const deleteEntry = (sectionKey, id) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((entry) => entry.id !== id),
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${sectionKey}-${id}`];
      return copy;
    });
  };

  const validateEntry = (section, entry) => {
    const entryErrors = {};
    section.fields.forEach((field) => {
      if (field.required && !entry[field.name]) {
        entryErrors[field.name] = `${field.label} is required.`;
      }
    });
    return entryErrors;
  };

  const toggleEditEntry = (section, entry) => {
    const isCurrentlyEditing = editingId[section.key] === entry.id;
    if (isCurrentlyEditing) {
      const entryErrors = validateEntry(section, entry);
      setErrors((prev) => ({ ...prev, [`${section.key}-${entry.id}`]: entryErrors }));
      if (Object.keys(entryErrors).length > 0) return;
      setEditingId((prev) => ({ ...prev, [section.key]: null }));
    } else {
      setEditingId((prev) => ({ ...prev, [section.key]: entry.id }));
    }
  };

  const validateWholeForm = () => {
    const allErrors = {};
    const sectionsToOpen = {};

    resumeSections.forEach((section) => {
      if (!section.repeatable) {
        const fieldErrors = {};
        section.fields.forEach((field) => {
          if (field.required && !formData[section.key][field.name]) {
            fieldErrors[field.name] = `${field.label} is required.`;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          allErrors[section.key] = fieldErrors;
          sectionsToOpen[section.key] = true;
        }
      } else {
        formData[section.key].forEach((entry) => {
          const entryErrors = validateEntry(section, entry);
          if (Object.keys(entryErrors).length > 0) {
            allErrors[`${section.key}-${entry.id}`] = entryErrors;
            sectionsToOpen[section.key] = true;
          }
        });
      }
    });

    return { allErrors, sectionsToOpen };
  };

  // ------------------------------------------------------------------
  // CHANGED: Generate Resume now navigates instead of generating a file.
  // Validation is unchanged; only what happens after validation differs.
  // ------------------------------------------------------------------
  const handleGenerateResume = async () => {
    const { allErrors, sectionsToOpen } = validateWholeForm();

    if (Object.keys(allErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...allErrors }));
      setOpenSections((prev) => ({ ...prev, ...sectionsToOpen }));
      alert("Please complete all required fields before generating your resume.");
      return;
    }

    // Make sure MongoDB has the latest data before leaving this page —
    // failure here is non-fatal (see persistToMongo/flushSave), navigation
    // still proceeds using localStorage as the fallback.
    await flushSave();

    // React Router's `state` option passes data to the next route without
    // putting it in the URL — it's available on the destination page via
    // the `useLocation()` hook's `location.state`. It only survives client-side
    // navigation (not a hard refresh), which is fine since this is a preview step.
    navigate("/resume-preview", {
      state: {
        formData,
        font: selectedFont,
        resumeId: resumeIdRef.current,
        title,
        templateId,
        isNewResume: !routeResumeId, // only prompt for a name the first time
      },
    });
  };

  const handleAnalyzeResume = async () => {
    await flushSave();
    navigate("/ats-analysis", { state: { formData, font: selectedFont } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">
          Build Your Resume
        </h1>
        {saveStatus && (
          <p className="text-center text-xs text-gray-500 mb-6">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "local" && "Could not sync — saved locally"}
          </p>
        )}
        {!saveStatus && <div className="mb-8" />}

        {resumeSections.map((section) => (
          <AccordionSection
            key={section.key}
            title={section.title}
            isOpen={!!openSections[section.key]}
            onToggle={() => toggleSection(section.key)}
          >
            {!section.repeatable &&
              section.fields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={formData[section.key][field.name]}
                  onChange={(val) => updateSingleField(section.key, field.name, val)}
                  error={errors[section.key]?.[field.name]}
                />
              ))}

            {section.repeatable && (
              <>
                {formData[section.key].map((entry) => {
                  const isEditing = editingId[section.key] === entry.id;
                  const entryErrors = errors[`${section.key}-${entry.id}`] || {};
                  return (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">
                          {section.entryLabel(entry)}
                        </span>
                        <div className="flex gap-3 text-sm">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline"
                            onClick={() => toggleEditEntry(section, entry)}
                          >
                            {isEditing ? "Done" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="text-red-500 hover:underline"
                            onClick={() => deleteEntry(section.key, entry.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div>
                          {section.fields
                            .filter((f) => !f.showIf || f.showIf(entry))
                            .map((field) => (
                              <FieldRenderer
                                key={field.name}
                                field={field}
                                value={entry[field.name]}
                                onChange={(val) =>
                                  updateEntryField(section.key, entry.id, field.name, val)
                                }
                                error={entryErrors[field.name]}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => addEntry(section.key)}
                  className="mt-2 px-4 py-2 text-sm font-medium text-blue-600
                             border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  + Add {section.title}
                </button>
              </>
            )}
          </AccordionSection>
        ))}

        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Font:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyzeResume}
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 font-semibold rounded-lg
                         hover:bg-blue-50 transition-colors"
              title="Analyze this resume's ATS compatibility and job match, without needing to generate a file first"
            >
              Analyze Resume (ATS)
            </button>
            <button
              type="button"
              onClick={handleGenerateResume}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                         hover:bg-blue-700 transition-colors"
            >
              Generate Resume
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}