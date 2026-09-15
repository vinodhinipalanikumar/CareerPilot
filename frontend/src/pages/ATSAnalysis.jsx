// src/pages/ATSAnalysis.jsx
//
// Orchestrator page only — all analysis logic lives in src/utils/ats/*,
// all result presentation lives in src/components/ats/*.
import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FileText, ScanSearch, UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import JobMatchResults from "../components/ats/JobMatchResults";
import CareerFitResults from "../components/ats/CareerFitResults";
import { getSavedResumeData } from "../utils/ats/resumeStorage";
import SavedResumePicker from "../components/SavedResumePicker";
import { useSavedResumes } from "../hooks/useSavedResumes";
import { fromCareerPilotFormData } from "../utils/ats/formDataAdapter";
import { extractResumeText, detectFormatRisk } from "../utils/ats/fileParsers";
import { parseResumeText } from "../utils/ats/resumeParser";
import { runAtsAnalysis } from "../utils/ats/resumeAnalyzer";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

/** Resolve the best-available CareerPilot resume: fresh router state (if the
 *  user just came from ResumeBuilder's "Analyze Resume (ATS)" button) takes
 *  priority, falling back to the persisted resume in localStorage — this is
 *  what lets "Use CareerPilot Resume" work even when this page was reached
 *  via a plain link (e.g. the Home page), after a refresh, or in a new tab. */
function resolveCareerPilotFormData(locationState) {
  if (locationState?.formData) return locationState.formData;
  return getSavedResumeData();
}

export default function ATSAnalysis() {
  const location = useLocation();

  const rawCareerPilotFormData = useMemo(() => resolveCareerPilotFormData(location.state), [location.state]);

  const [resumeSource, setResumeSource] = useState(null); // null | "careerpilot" | "upload"

  // When the user has more than one saved MongoDB resume, let them choose
  // which one to analyze instead of always using whichever was last edited.
  const { resumes: savedResumes } = useSavedResumes(resumeSource === "careerpilot");
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState(null);
  useEffect(() => {
    if (savedResumes.length > 0 && !selectedSavedResumeId) {
      setSelectedSavedResumeId(savedResumes[0].id); // most recently updated first
    }
  }, [savedResumes, selectedSavedResumeId]);

  const selectedSavedResumeData = savedResumes.find((r) => r.id === selectedSavedResumeId)?.formData;
  const effectiveCareerPilotFormData = selectedSavedResumeData || rawCareerPilotFormData;
  const effectiveCareerPilotResume = useMemo(
    () => (effectiveCareerPilotFormData ? fromCareerPilotFormData(effectiveCareerPilotFormData) : null),
    [effectiveCareerPilotFormData]
  );

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedUploadResume, setParsedUploadResume] = useState(null);
  const fileInputRef = useRef(null);

  const [jobDescription, setJobDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const isCareerPilotSelected = resumeSource === "careerpilot";
  const isUploadSelected = resumeSource === "upload";

  const parseAndSetFile = async (file) => {
    setUploadedFile(file);
    setParsedUploadResume(null);
    setIsParsingFile(true);
    setUploadError("");
    try {
      const rawText = await extractResumeText(file);
      // Best-effort layout-risk detection (tables/columns/images) — never
      // blocks or fails the analysis if it can't determine something.
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

  const handleSelectCareerPilot = () => { setResumeSource("careerpilot"); setFormError(""); setAnalysisResult(null); };
  const handleSelectUpload = () => { setResumeSource("upload"); setFormError(""); setAnalysisResult(null); };
  const handleFileInputChange = (e) => validateAndSetFile(e.target.files?.[0]);
  const handleChangeFileClick = () => fileInputRef.current?.click();
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedUploadResume(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartOver = () => {
    setAnalysisResult(null);
    setFormError("");
  };

  const handleAnalyzeResume = () => {
    let resume = null;

    if (resumeSource === "careerpilot") {
      if (!effectiveCareerPilotResume) {
        setFormError("No CareerPilot resume data was found. Build a resume first, then come back here.");
        return;
      }
      resume = effectiveCareerPilotResume;
    } else if (resumeSource === "upload") {
      if (isParsingFile) { setFormError("Please wait for your file to finish processing."); return; }
      if (!uploadedFile || !parsedUploadResume) { setFormError("Please select a valid PDF or DOCX file before analyzing."); return; }
      resume = parsedUploadResume;
    } else {
      setFormError("Please choose a resume source to continue: CareerPilot Resume or Upload Resume.");
      return;
    }

    setFormError("");
    setIsAnalyzing(true);
    // Synchronous, deterministic scoring — no network/AI call — but we still
    // yield a tick so the UI can show a brief "Analyzing..." state.
    setTimeout(() => {
      try {
        const result = runAtsAnalysis(resume, jobDescription);
        setAnalysisResult(result);
      } catch (err) {
        setFormError(`Something went wrong while analyzing this resume: ${err.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    }, 50);
  };

  if (analysisResult) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto py-10 px-4">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <h1 className="text-3xl font-bold text-blue-600">
              {analysisResult.mode === "job-match" ? "Job Match Results" : analysisResult.mode === "career-fit" ? "Career Fit Results" : "Analysis"}
            </h1>
            <button
              type="button"
              onClick={handleStartOver}
              className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Analyze Another Resume
            </button>
          </div>

          {analysisResult.mode === "insufficient-data" && (
            <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-600 bg-white">
              Not enough resume content was found to run an analysis. Please make sure your CareerPilot resume has at least some skills, education, or projects filled in, or try uploading a different file.
            </div>
          )}
          {analysisResult.mode === "job-match" && <JobMatchResults result={analysisResult} />}
          {analysisResult.mode === "career-fit" && <CareerFitResults result={analysisResult} />}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-600 mb-3">ATS Resume Analyzer</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Analyze your resume for ATS compatibility and job relevance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Option 1: CareerPilot Resume */}
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
            <p className="text-gray-600 leading-relaxed flex-grow">
              Analyze the resume you created with CareerPilot.
            </p>

            <button
              type="button"
              onClick={handleSelectCareerPilot}
              className={`mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors ${
                isCareerPilotSelected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              {isCareerPilotSelected ? "✓ CareerPilot Resume Selected" : "Use CareerPilot Resume"}
            </button>

            {isCareerPilotSelected && !effectiveCareerPilotResume && (
              <p className="text-sm text-red-500 mt-3">
                No saved resume data was found.{" "}
                <Link to="/resume-builder" className="underline font-medium">Build your resume</Link> first, then come back here.
              </p>
            )}
            {isCareerPilotSelected && effectiveCareerPilotResume && (
              <p className="text-sm text-green-600 mt-3">Using the resume data from your CareerPilot Resume Builder.</p>
            )}

            {isCareerPilotSelected && (
              <SavedResumePicker
                resumes={savedResumes}
                selectedId={selectedSavedResumeId}
                onSelect={setSelectedSavedResumeId}
              />
            )}
          </div>

          {/* Option 2: Upload Resume */}
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

            <h3 className="text-2xl font-bold text-gray-800 mb-3">Upload Resume</h3>
            <p className="text-gray-600 leading-relaxed flex-grow">
              Upload an existing resume in PDF or DOCX format.
            </p>

            {!isUploadSelected && (
              <button
                type="button"
                onClick={handleSelectUpload}
                className="mt-6 px-5 py-2.5 font-semibold rounded-lg transition-colors bg-white text-sky-600 border border-sky-600 hover:bg-sky-50"
              >
                Upload Resume
              </button>
            )}

            {isUploadSelected && (
              <div className="mt-6">
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
                      <button type="button" onClick={handleChangeFileClick} className="text-sm font-medium text-blue-600 hover:underline">
                        Change File
                      </button>
                      <button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove file">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            <label htmlFor="job-description" className="text-lg font-semibold text-gray-800">Job Description</label>
            <span className="text-sm font-medium text-gray-400">(Optional)</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Add a job description to check your match for that specific role, or leave this blank to get general ATS feedback and role suggestions.
          </p>
          <textarea
            id="job-description"
            rows={6}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here if you want to check how well your resume matches this specific job..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyzeResume}
            disabled={isAnalyzing}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAnalyzing ? "Analyzing…" : "Analyze Resume"}
          </button>
          {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}