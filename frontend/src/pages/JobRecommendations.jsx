// src/pages/JobRecommendations.jsx
//
// Orchestrator page only, following the same split used by ATSAnalysis.jsx:
// resume source selection + parsing here, all actual job searching/matching
// happens on the backend (backend/controllers/jobController.js) so external
// API keys never reach the browser. Results rendering lives in
// src/components/jobs/JobResultCard.jsx.
//
// Resume-specificity is the whole point of this page: switching the
// selected/uploaded resume and clicking "Find Jobs" again always sends a
// fresh resumeId/resumeData — nothing from a previous resume is ever mixed
// in (see backend/utils/resumeProfileExtractor.js).
import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText, ScanSearch, UploadCloud, X, CheckCircle2, Loader2,
  Search, AlertTriangle, Briefcase, MapPin,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import SavedResumePicker from "../components/SavedResumePicker";
import JobResultCard from "../components/jobs/JobResultCard";
import { useSavedResumes } from "../hooks/useSavedResumes";
import { extractResumeText, detectFormatRisk } from "../utils/ats/fileParsers";
import { parseResumeText } from "../utils/ats/resumeParser";
import { jobsAPI } from "../utils/api";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const WORK_MODES = [
  { value: "any", label: "Any" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];
const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher / Entry Level" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5+", label: "5+ years" },
];
const DATE_POSTED_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "3d", label: "Past 3 days" },
  { value: "7d", label: "Past 7 days" },
  { value: "30d", label: "Past 30 days" },
];

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** UI-only quick preview of a canonical resume object (works for both a
 *  saved CareerPilot resume's formData and the ATS parser's uploaded-resume
 *  output — both share the same shape). This never leaves the browser as
 *  the source of truth for matching; the backend re-derives its own profile
 *  from the same data (see resumeProfileExtractor.js) once a search runs. */
function buildQuickPreview(resumeLike) {
  if (!resumeLike) return null;
  const p = resumeLike.personalInfo || {};
  const skills = (resumeLike.skills || []).map((s) => s.skillName).filter(Boolean);
  const education = (resumeLike.education || [])[0];
  const educationLabel = education ? [education.degree, education.fieldOfStudy].filter(Boolean).join(" in ") : "";
  const location = [p.city, p.state].filter(Boolean).join(", ");
  const hasWork = (resumeLike.workExperience || []).length > 0;
  const hasIntern = (resumeLike.internships || []).length > 0;
  const experienceLabel = hasWork ? "Experienced" : hasIntern ? "Fresher / Internship" : "Fresher / Entry Level";
  return { skills, educationLabel, location, experienceLabel };
}

export default function JobRecommendations() {
  const [resumeSource, setResumeSource] = useState(null); // null | "careerpilot" | "upload"

  const { resumes: savedResumes } = useSavedResumes(resumeSource === "careerpilot");
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState(null);
  const selectedSavedResume = savedResumes.find((r) => r.id === selectedSavedResumeId);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedUploadResume, setParsedUploadResume] = useState(null);
  const fileInputRef = useRef(null);

  const isCareerPilotSelected = resumeSource === "careerpilot";
  const isUploadSelected = resumeSource === "upload";

  const activeResumeLike = isCareerPilotSelected
    ? selectedSavedResume?.formData
    : isUploadSelected
    ? parsedUploadResume
    : null;
  const preview = useMemo(() => buildQuickPreview(activeResumeLike), [activeResumeLike]);

  // The location filter defaults to the resume's own city (requirement
  // #12) without needing an effect: while the user hasn't typed anything,
  // the input just displays the resume's location; the moment they type,
  // `location` takes over completely.
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("any");
  const [experience, setExperience] = useState("fresher");
  const [datePosted, setDatePosted] = useState("any");
  const displayedLocation = location || preview?.location || "";

  const [formError, setFormError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState(null);
  const [basedOn, setBasedOn] = useState("");
  const [resumeProfile, setResumeProfile] = useState(null);
  const [providerErrors, setProviderErrors] = useState([]);

  const parseAndSetFile = async (file) => {
    setUploadedFile(file);
    setParsedUploadResume(null);
    setIsParsingFile(true);
    setUploadError("");
    try {
      const rawText = await extractResumeText(file);
      const formatRisk = await detectFormatRisk(file).catch(() => null);
      const parsed = parseResumeText(rawText, formatRisk);
      setParsedUploadResume(parsed);
    } catch (err) {
      setUploadError(err.message || "Could not read this file.");
      setUploadedFile(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const extension = getExtension(file.name);
    const extensionOk = ACCEPTED_EXTENSIONS.includes(extension);
    const mimeOk = ACCEPTED_MIME_TYPES.includes(file.type) || file.type === "";
    if (!extensionOk || !mimeOk) {
      setUploadedFile(null);
      setUploadError("Unsupported file type. Please upload a .pdf or .docx file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadedFile(null);
      setUploadError("File is too large. Please upload a file under 10 MB.");
      return;
    }
    setFormError("");
    parseAndSetFile(file);
  };

  const handleSelectCareerPilot = () => { setResumeSource("careerpilot"); setFormError(""); };
  const handleSelectUpload = () => { setResumeSource("upload"); setFormError(""); };
  const handleFileInputChange = (e) => validateAndSetFile(e.target.files?.[0]);
  const handleChangeFileClick = () => fileInputRef.current?.click();
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedUploadResume(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFindJobs = async () => {
    let payload = { keyword, location: displayedLocation, remote: workMode === "remote", experience, datePosted };

    if (resumeSource === "careerpilot") {
      if (!selectedSavedResumeId) {
        setFormError("Please select or upload a resume to find relevant jobs.");
        return;
      }
      payload.resumeId = selectedSavedResumeId;
    } else if (resumeSource === "upload") {
      if (isParsingFile) { setFormError("Please wait for your file to finish processing."); return; }
      if (!uploadedFile || !parsedUploadResume) { setFormError("Please select or upload a resume to find relevant jobs."); return; }
      payload.resumeData = parsedUploadResume;
    } else {
      setFormError("Please select or upload a resume to find relevant jobs.");
      return;
    }

    setFormError("");
    setSearchError("");
    setIsSearching(true);
    setResults(null);
    try {
      const data = await jobsAPI.search(payload);
      setResults(data.jobs || []);
      setBasedOn(data.basedOn || "");
      setResumeProfile(data.resumeProfile || null);
      setProviderErrors(data.providerErrors || []);
    } catch (err) {
      setSearchError(err.message || "Could not search for jobs right now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-600 mb-3">Job Recommendations</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Find jobs that match your resume.</p>
        </div>

        {/* Step 1: Resume */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className={`rounded-2xl shadow-md p-8 flex flex-col h-full border-2 transition-all duration-300 ${
              isCareerPilotSelected ? "border-blue-600 bg-blue-50" : "border-transparent bg-blue-50/60 hover:shadow-xl"
            }`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600 w-7 h-7" />
              </div>
              {isCareerPilotSelected && (
                <span className="flex items-center gap-1 text-blue-600 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">CareerPilot Resume</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">Use one of your saved resumes.</p>
            <button
              type="button"
              onClick={handleSelectCareerPilot}
              className={`mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors ${
                isCareerPilotSelected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              {isCareerPilotSelected ? "✓ CareerPilot Resume Selected" : "Use CareerPilot Resume"}
            </button>

            {isCareerPilotSelected && savedResumes.length === 0 && (
              <p className="text-sm text-red-500 mt-3">
                No saved resumes found.{" "}
                <Link to="/resume-builder" className="underline font-medium">Build your resume</Link> first, then come back here.
              </p>
            )}
            {isCareerPilotSelected && (
              <SavedResumePicker resumes={savedResumes} selectedId={selectedSavedResumeId} onSelect={setSelectedSavedResumeId} />
            )}
          </div>

          <div
            className={`rounded-2xl shadow-md p-8 flex flex-col h-full border-2 transition-all duration-300 ${
              isUploadSelected ? "border-sky-600 bg-sky-50" : "border-transparent bg-sky-50/60 hover:shadow-xl"
            }`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-sky-100 w-14 h-14 rounded-xl flex items-center justify-center">
                <ScanSearch className="text-sky-600 w-7 h-7" />
              </div>
              {isUploadSelected && (
                <span className="flex items-center gap-1 text-sky-600 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Selected
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Upload My Resume</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">Upload a resume in PDF or DOCX format.</p>

            {!isUploadSelected && (
              <button type="button" onClick={handleSelectUpload} className="mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors bg-white text-sky-600 border border-sky-600 hover:bg-sky-50">
                Upload Resume
              </button>
            )}

            {isUploadSelected && (
              <div className="mt-6">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileInputChange} />
                {!uploadedFile && (
                  <button type="button" onClick={handleChangeFileClick} className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-sky-300 rounded-xl py-8 px-4 text-sky-600 hover:bg-sky-50 hover:border-sky-400 transition-colors">
                    <UploadCloud className="w-8 h-8" />
                    <span className="font-semibold">Click to select a file</span>
                    <span className="text-xs text-gray-500">PDF or DOCX, up to 10 MB</span>
                  </button>
                )}
                {uploadedFile && (
                  <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      {isParsingFile ? <Loader2 className="w-5 h-5 text-sky-500 shrink-0 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}{isParsingFile ? " • Reading file…" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={handleChangeFileClick} className="text-sm font-medium text-blue-600 hover:underline">Change File</button>
                      <button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove file"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
                {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Profile summary */}
        {preview && (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Your Profile</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Skills</p>
                <p className="text-gray-800 font-medium">{preview.skills.length > 0 ? preview.skills.slice(0, 6).join(" • ") : "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Experience</p>
                <p className="text-gray-800 font-medium">{preview.experienceLabel}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Education</p>
                <p className="text-gray-800 font-medium">{preview.educationLabel || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Filters */}
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Filters</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Leave blank to auto-generate from your resume"
                  className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayedLocation}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, Bangalore, Remote"
                  className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Work Mode</label>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                {WORK_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Experience</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                {EXPERIENCE_LEVELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date Posted</label>
              <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                {DATE_POSTED_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mb-10">
          <button
            type="button"
            onClick={handleFindJobs}
            disabled={isSearching}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSearching ? "Searching…" : "Find Jobs"}
          </button>
          {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
        </div>

        {/* Results */}
        {searchError && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-6 text-center mb-8 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {searchError}
          </div>
        )}

        {results && !searchError && (
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" /> Recommended Jobs
              </h2>
            </div>
            {basedOn && <p className="text-sm text-gray-500 mb-1">Based on: {basedOn}</p>}
            {resumeProfile?.targetRoles?.length > 0 && (
              <p className="text-xs text-gray-400 mb-6">
                Matching roles considered: {resumeProfile.targetRoles.join(", ")}
              </p>
            )}
            {!resumeProfile?.targetRoles?.length && <div className="mb-6" />}

            {providerErrors.length > 0 && results.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 text-amber-700 rounded-lg p-4 text-sm mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Some job sources are temporarily unavailable. Showing available results from other sources.
              </div>
            )}

            {results.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-600 bg-white">
                <p className="font-semibold mb-1">No matching jobs found.</p>
                <p className="text-sm">Try changing the keyword or location.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {results.map((job, i) => (
                  <JobResultCard key={job.id || job.url || i} job={job} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
