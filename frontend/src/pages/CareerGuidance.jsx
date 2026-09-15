// src/pages/CareerGuidance.jsx
//
// Orchestrator page only — profile extraction lives in
// utils/career-guidance/profileExtractor.js, matching logic in
// careerMatcher.js, roadmap generation in roadmapGenerator.js, and result
// presentation in components/career-guidance/*.
//
// Data source: the user's existing Resume Builder formData (never asks the
// user to re-enter resume information). Works entirely without a job
// description — this is intentionally separate from the ATS Analyzer.
import { useMemo, useRef, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Compass, Sparkles, FileWarning, FileText, UploadCloud,
  CheckCircle2, Loader2, X, RefreshCcw,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProfileSummary from "../components/career-guidance/ProfileSummary";
import CareerRecommendations from "../components/career-guidance/CareerRecommendations";
import CareerDetails from "../components/career-guidance/CareerDetails";
import { getSavedResumeData } from "../utils/ats/resumeStorage";
import SavedResumePicker from "../components/SavedResumePicker";
import { useSavedResumes } from "../hooks/useSavedResumes";
import { extractResumeText, detectFormatRisk } from "../utils/ats/fileParsers";
import { parseResumeText } from "../utils/ats/resumeParser";
import { extractProfile } from "../utils/career-guidance/profileExtractor";
import { matchCareers } from "../utils/career-guidance/careerMatcher";
import { buildRoadmap } from "../utils/career-guidance/roadmapGenerator";
import { CAREER_ROLES } from "../data/career-guidance/careerRoles";

const TOP_N = 5;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Resolve the CareerPilot Resume: fresh router state (if the user arrived
 *  with it) takes priority, falling back to the persisted resume in
 *  localStorage — this is what lets "CareerPilot Resume" work after a
 *  navigation, a closed tab, or a refresh, without re-entering anything. */
function resolveCareerPilotFormData(locationState) {
  if (locationState?.formData) return locationState.formData;
  return getSavedResumeData();
}

export default function CareerGuidance() {
  const location = useLocation();

  const careerPilotFormData = useMemo(
    () => resolveCareerPilotFormData(location.state),
    [location.state]
  );

  const [resumeSource, setResumeSource] = useState(null); // null | "careerpilot" | "upload"

  // When the user has more than one saved MongoDB resume, let them choose
  // which one to use instead of always using whichever was last edited.
  const { resumes: savedResumes } = useSavedResumes(resumeSource === "careerpilot");
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState(null);
  useEffect(() => {
    if (savedResumes.length > 0 && !selectedSavedResumeId) {
      setSelectedSavedResumeId(savedResumes[0].id); // most recently updated first
    }
  }, [savedResumes, selectedSavedResumeId]);
  const selectedSavedResumeData = savedResumes.find((r) => r.id === selectedSavedResumeId)?.formData;
  const effectiveCareerPilotFormData = selectedSavedResumeData || careerPilotFormData;

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedUploadResume, setParsedUploadResume] = useState(null);
  const fileInputRef = useRef(null);

  const [analyzed, setAnalyzed] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Both sources are normalized by extractProfile() into the exact same
  // profile shape — CareerPilot formData and the ATS parser's output share
  // field names 1:1 (personalInfo/education/skills/projects/... with
  // skillName, jobTitle, etc.), so no separate parsing or matching logic is
  // needed for either path.
  const activeFormData =
    resumeSource === "careerpilot" ? effectiveCareerPilotFormData
    : resumeSource === "upload" ? parsedUploadResume
    : null;
  const profile = useMemo(() => extractProfile(activeFormData), [activeFormData]);

  const isCareerPilotSelected = resumeSource === "careerpilot";
  const isUploadSelected = resumeSource === "upload";
  const hasChosenSource = resumeSource !== null;

  const resetAnalysis = () => {
    setAnalyzed(false);
    setSelectedRoleId(null);
  };

  const handleSelectCareerPilot = () => { setResumeSource("careerpilot"); resetAnalysis(); };
  const handleSelectUpload = () => { setResumeSource("upload"); resetAnalysis(); };

  const handleChangeResume = () => {
    setResumeSource(null);
    setUploadedFile(null);
    setParsedUploadResume(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    resetAnalysis();
  };

  const parseAndSetFile = async (file) => {
    setUploadedFile(file);
    setParsedUploadResume(null);
    setIsParsingFile(true);
    setUploadError("");
    resetAnalysis();
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
    parseAndSetFile(file);
  };

  const handleFileInputChange = (e) => validateAndSetFile(e.target.files?.[0]);
  const handleChangeFileClick = () => fileInputRef.current?.click();
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedUploadResume(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    resetAnalysis();
  };

  const allMatches = useMemo(() => {
    if (!analyzed) return [];
    try {
      return matchCareers(profile, CAREER_ROLES);
    } catch {
      return [];
    }
  }, [analyzed, profile]);

  const topMatches = allMatches.slice(0, TOP_N);
  const selectedMatch = selectedRoleId ? allMatches.find((m) => m.role.id === selectedRoleId) : null;
  const roadmap = useMemo(() => (selectedMatch ? buildRoadmap(profile, selectedMatch) : null), [selectedMatch, profile]);

  const readyToAnalyze = hasChosenSource && !profile.isEmpty && !isParsingFile;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-cyan-700 mb-3">Career Guidance</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover which career paths suit you, what skills you're missing, and what to do next — based on your own profile.
          </p>
        </div>

        {!analyzed && (
          <>
            {hasChosenSource && (
              <div className="max-w-xl mx-auto flex items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Resume Source:</span>{" "}
                  {isCareerPilotSelected ? "CareerPilot Resume" : "Uploaded Resume"}
                  {isUploadSelected && uploadedFile && (
                    <span className="text-gray-500"> — {uploadedFile.name}</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleChangeResume}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:underline shrink-0"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Change Resume
                </button>
              </div>
            )}

            {isCareerPilotSelected && savedResumes.length > 0 && (
              <div className="max-w-xl mx-auto mb-6 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <SavedResumePicker
                  resumes={savedResumes}
                  selectedId={selectedSavedResumeId}
                  onSelect={setSelectedSavedResumeId}
                />
              </div>
            )}

            {!hasChosenSource && (
              <div className="max-w-3xl mx-auto mb-10">
                <h2 className="text-lg font-semibold text-gray-800 text-center mb-5">Choose Your Resume</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl shadow-md p-8 flex flex-col h-full border-2 border-transparent bg-cyan-50/60 hover:shadow-xl transition-all duration-300">
                    <div className="bg-cyan-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                      <FileText className="text-cyan-700 w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">CareerPilot Resume</h3>
                    <p className="text-gray-600 leading-relaxed flex-grow">
                      Analyze the resume you created in CareerPilot.
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectCareerPilot}
                      className="mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors bg-white text-cyan-700 border border-cyan-700 hover:bg-cyan-50"
                    >
                      Use CareerPilot Resume
                    </button>
                  </div>

                  <div className="rounded-2xl shadow-md p-8 flex flex-col h-full border-2 border-transparent bg-sky-50/60 hover:shadow-xl transition-all duration-300">
                    <div className="bg-sky-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                      <UploadCloud className="text-sky-600 w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Upload Your Resume</h3>
                    <p className="text-gray-600 leading-relaxed flex-grow">
                      Upload an existing PDF or DOCX resume.
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectUpload}
                      className="mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors bg-white text-sky-600 border border-sky-600 hover:bg-sky-50"
                    >
                      Upload My Resume
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isCareerPilotSelected && profile.isEmpty && (
              <div className="max-w-xl mx-auto border border-dashed border-gray-300 rounded-2xl bg-white p-10 text-center">
                <FileWarning className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No CareerPilot resume found.</h3>
                <p className="text-gray-500 mb-6">
                  Career Guidance uses the profile you build in Resume Builder — skills, education, projects, and experience — to recommend suitable careers.
                </p>
                <Link
                  to="/resume-builder"
                  className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Create My Resume
                </Link>
              </div>
            )}

            {isUploadSelected && (
              <div className="max-w-xl mx-auto border border-gray-200 rounded-2xl bg-white shadow-sm p-8 mb-8">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileInputChange} />

                {!uploadedFile && (
                  <button
                    type="button"
                    onClick={handleChangeFileClick}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-sky-300 rounded-xl py-8 px-4 text-sky-600 hover:bg-sky-50 hover:border-sky-400 transition-colors"
                  >
                    <UploadCloud className="w-8 h-8" />
                    <span className="font-semibold">Click to select a file</span>
                    <span className="text-xs text-gray-500">PDF or DOCX, up to 10 MB</span>
                  </button>
                )}

                {uploadedFile && (
                  <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      {isParsingFile ? (
                        <Loader2 className="w-5 h-5 text-sky-500 shrink-0 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadedFile.size)}{isParsingFile ? " • Reading file…" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={handleChangeFileClick} className="text-sm font-medium text-cyan-700 hover:underline">
                        Change File
                      </button>
                      <button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove file">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                {!uploadError && uploadedFile && !isParsingFile && profile.isEmpty && (
                  <p className="text-amber-600 text-sm mt-2">
                    We couldn't find enough resume content in this file to analyze. Try a different file.
                  </p>
                )}
              </div>
            )}

            {readyToAnalyze && (
              <div className="max-w-xl mx-auto border border-gray-200 rounded-2xl bg-white shadow-sm p-10 text-center">
                <Compass className="w-10 h-10 mx-auto mb-4 text-cyan-600" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to analyze your profile</h3>
                <p className="text-gray-500 mb-6">
                  We'll look at your skills, education, projects, and experience to suggest suitable career paths.
                </p>
                <button
                  type="button"
                  onClick={() => setAnalyzed(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Analyze My Profile
                </button>
              </div>
            )}
          </>
        )}

        {analyzed && !selectedMatch && (
          <div className="space-y-8">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-3 -mt-4 mb-2 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Resume Source:</span>{" "}
                {isCareerPilotSelected ? "CareerPilot Resume" : "Uploaded Resume"}
                {isUploadSelected && uploadedFile && (
                  <span className="text-gray-500"> — {uploadedFile.name}</span>
                )}
              </p>
              <button
                type="button"
                onClick={handleChangeResume}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:underline shrink-0"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Change Resume
              </button>
            </div>
            <ProfileSummary profile={profile} topMatches={topMatches} />
            <CareerRecommendations results={topMatches} onViewPath={setSelectedRoleId} />
          </div>
        )}

        {analyzed && selectedMatch && roadmap && (
          <CareerDetails matchResult={selectedMatch} roadmap={roadmap} onBack={() => setSelectedRoleId(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}
