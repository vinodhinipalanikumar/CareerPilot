// ResumePreview.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ResumeTemplates from "./ResumeTemplates";
import { generateResumeDoc } from "../utils/resumeGenerator";
import { templateRegistry, getTemplateById } from "../data/templateRegistry";
import { getSavedResumeData, getSavedResumeFont } from "../utils/ats/resumeStorage";
import { resumesAPI } from "../utils/api";

// Printing only the #resume-document element (every template component
// renders with that id) is the smallest reliable way to get a working PDF
// download without adding a new library: the browser's own "Save as PDF"
// print destination handles pagination, keeps text selectable/readable,
// and @page here pins it to A4. This stylesheet only exists in the DOM
// while this page is mounted, so it never affects printing elsewhere.
const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    #resume-document, #resume-document * { visibility: visible; }
    #resume-document {
      position: absolute;
      top: 0;
      left: 0;
      margin: 0 !important;
      box-shadow: none !important;
    }
    @page { size: A4; margin: 0; }
  }
`;

function SaveNameModal({ initialTitle, onCancel, onSave }) {
  const [value, setValue] = useState(initialTitle || "My Resume");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Name this resume</h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Java Developer Resume"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(value.trim() || "My Resume")}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResumePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeId: routeResumeId } = useParams();

  // Three ways to arrive here:
  // 1. Fresh from Resume Builder's "Generate Resume" — router state has
  //    everything, including a resumeId if one already exists.
  // 2. "View" or "Edit"'s Preview step on a saved resume — /resume-preview/:resumeId,
  //    no router state (e.g. after a refresh), so we fetch it.
  // 3. Reached directly with neither — fall back to the last-edited
  //    CareerPilot resume in localStorage, same as before this feature.
  const stateData = location.state;

  const [formData, setFormData] = useState(stateData?.formData || null);
  const [font, setFont] = useState(stateData?.font || "Arial");
  const [resumeId, setResumeId] = useState(stateData?.resumeId || routeResumeId || null);
  const [title, setTitle] = useState(stateData?.title || null);
  const [isNewResume, setIsNewResume] = useState(
    stateData ? Boolean(stateData.isNewResume) : !routeResumeId
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    stateData?.templateId || templateRegistry[0].id
  );
  const [loadingSavedResume, setLoadingSavedResume] = useState(false);

  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(""); // success/error banner text
  const [saveMessageIsError, setSaveMessageIsError] = useState(false);

  // Case 2 above: no router state, but a saved resume id in the URL —
  // load it from MongoDB.
  useEffect(() => {
    if (stateData || !routeResumeId) return;

    let cancelled = false;
    setLoadingSavedResume(true);
    (async () => {
      try {
        const data = await resumesAPI.getById(routeResumeId);
        const saved = data?.resume;
        if (!cancelled && saved) {
          setFormData(saved.formData);
          setFont(saved.font || "Arial");
          setTitle(saved.title || "My Resume");
          setSelectedTemplateId(saved.templateId || templateRegistry[0].id);
          setIsNewResume(false);
        }
      } catch {
        // Leave formData null — the "No Resume Data Found" state below
        // covers this (deleted resume, offline, etc.).
      } finally {
        if (!cancelled) setLoadingSavedResume(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeResumeId]);

  // Case 3 above: nothing from router state or the URL — fall back to the
  // localStorage snapshot, exactly like before this feature existed.
  useEffect(() => {
    if (stateData || routeResumeId) return;
    const localData = getSavedResumeData();
    if (localData) {
      setFormData(localData);
      setFont(getSavedResumeFont() || "Arial");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTemplate = getTemplateById(selectedTemplateId);
  const ActiveTemplateComponent = activeTemplate.component;

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const blob = await generateResumeDoc(formData, { font });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formData.personalInfo?.fullName || "Resume"}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX generation failed:", err);
      alert("Something went wrong while generating your DOCX. Please try again.");
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = () => {
    // Opens the browser's print dialog scoped to just the resume (see
    // PRINT_STYLES above) — choosing "Save as PDF" there downloads it.
    window.print();
  };

  const persistResume = async (nameToUse) => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const payload = {
        title: nameToUse,
        formData,
        templateId: selectedTemplateId,
        font,
      };

      let saved;
      if (resumeId) {
        const res = await resumesAPI.update(resumeId, payload);
        saved = res?.resume;
      } else {
        const res = await resumesAPI.create(payload);
        saved = res?.resume;
        if (saved?.id) {
          setResumeId(saved.id);
          navigate(`/resume-preview/${saved.id}`, { replace: true });
        }
      }

      setTitle(saved?.title || nameToUse);
      setIsNewResume(false);
      setSaveMessageIsError(false);
      setSaveMessage("Resume saved successfully!");
    } catch (err) {
      setSaveMessageIsError(true);
      setSaveMessage(err.message || "Could not save your resume. Please try again.");
    } finally {
      setIsSaving(false);
      // Let a success message fade from context after a few seconds.
      setTimeout(() => setSaveMessage(""), 4000);
    }
  };

  const handleSaveResumeClick = () => {
    if (isNewResume) {
      setShowNameModal(true);
      return;
    }
    persistResume(title || "My Resume");
  };

  if (loadingSavedResume) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center text-gray-500">Loading your resume…</div>
      </MainLayout>
    );
  }

  if (!formData) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">No Resume Data Found</h1>
          <p className="text-gray-600">
            Please go back to the Resume Builder and click{" "}
            <span className="font-medium">Generate Resume</span> to preview your resume.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{PRINT_STYLES}</style>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stable toolbar — never scrolls with either panel below */}
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-1">
            Resume{title ? `: ${title}` : " Preview"}
          </h1>

          <div className="flex flex-wrap justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleSaveResumeClick}
              disabled={isSaving}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg
                         hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Resume"}
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg
                         hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDownloadingDocx ? "Preparing..." : "Download DOCX"}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-6 py-2.5 bg-white text-blue-600 border border-blue-600 font-semibold rounded-lg
                         hover:bg-blue-50 transition-colors"
              title="Opens your browser's print dialog — choose 'Save as PDF'"
            >
              Download PDF
            </button>
          </div>

          {saveMessage && (
            <p
              className={`text-center text-sm mt-3 ${
                saveMessageIsError ? "text-red-600" : "text-green-700"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>

        {/* Independent-scroll panes: scrolling templates never moves the
            preview, and vice versa. Falls back to normal stacked scroll
            on small screens. */}
        <div className="md:flex md:gap-8 md:h-[calc(100vh-220px)]">
          <div className="md:w-[280px] md:shrink-0 md:h-full md:overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Templates</h2>
            <ResumeTemplates
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />
          </div>

          <div className="md:flex-1 md:h-full md:overflow-y-auto flex justify-center">
            <div className="shadow-lg">
              <ActiveTemplateComponent formData={formData} font={font} />
            </div>
          </div>
        </div>
      </div>

      {showNameModal && (
        <SaveNameModal
          initialTitle={title || "My Resume"}
          onCancel={() => setShowNameModal(false)}
          onSave={(name) => {
            setShowNameModal(false);
            persistResume(name);
          }}
        />
      )}
    </MainLayout>
  );
}
