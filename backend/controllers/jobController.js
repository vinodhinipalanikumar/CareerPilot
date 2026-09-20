const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobSearch = require("../models/JobSearch");
const { extractJobProfile } = require("../utils/resumeProfileExtractor");
const { buildSearchQueries } = require("../utils/queryBuilder");
const { searchAllProviders } = require("../services/jobSearchService");
const { dedupeJobs, scoreJob } = require("../utils/jobMatcher");

const MAX_RESULTS = 40;
// Defensive cap on an uploaded/parsed resume payload sent by the client
// (the "Upload My Resume" path — see resumeProfileExtractor.js header for
// why the client sends this object instead of a raw file). Generous enough
// for any real resume, small enough to block abuse.
const MAX_RESUME_DATA_BYTES = 300 * 1024;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const REMOTE_HINTS = ["remote", "work from home", "wfh"];

function passesPostFilters(job, { remote, datePosted }) {
  if (remote) {
    const text = `${job.title} ${job.description} ${job.location}`.toLowerCase();
    if (!REMOTE_HINTS.some((h) => text.includes(h))) return false;
  }

  if (datePosted && datePosted !== "any" && job.postedDate) {
    const posted = new Date(job.postedDate);
    if (!Number.isNaN(posted.getTime())) {
      const daysAgo = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
      const limits = { "24h": 1, "3d": 3, "7d": 7, "14d": 14, "30d": 30 };
      const limit = limits[datePosted];
      if (limit && daysAgo > limit) return false;
    }
  }

  return true;
}

// GET-semantics search exposed as POST /api/jobs/search.
//
// Why POST instead of a plain GET: the "Upload My Resume" path has to carry
// an already-parsed resume object (see resumeProfileExtractor.js) that can
// be several KB of JSON — too large/unwieldy for a query string, and not
// something that belongs in server access logs. The saved-resume path only
// ever needs `resumeId`, so a GET would have worked for that case alone,
// but keeping ONE request shape for both resume sources kept the frontend
// and this controller far simpler. Everything else (JWT auth, ownership
// checks, no server-side mutation) matches what a GET would have done.
async function searchJobs(req, res) {
  try {
    const {
      resumeId,
      resumeData,
      keyword = "",
      location = "",
      remote = false,
      experience = "",
      datePosted = "any",
    } = req.body || {};

    if (!resumeId && !resumeData) {
      return res.status(400).json({ message: "Select or upload a resume to find relevant jobs." });
    }

    let resumeLike = null;
    let basedOnTitle = "your resume";
    let resumeRef = null;

    if (resumeId) {
      if (!isValidId(resumeId)) {
        return res.status(404).json({ message: "Resume not found" });
      }
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      // Ownership check — a user can NEVER search using another user's
      // resume, even if they know/guess its id.
      if (resume.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "You do not have access to this resume" });
      }
      resumeLike = resume.formData || {};
      basedOnTitle = resume.title || "your resume";
      resumeRef = resume._id;
    } else {
      const size = Buffer.byteLength(JSON.stringify(resumeData || {}), "utf8");
      if (size > MAX_RESUME_DATA_BYTES) {
        return res.status(400).json({ message: "Uploaded resume data is too large." });
      }
      if (typeof resumeData !== "object" || Array.isArray(resumeData)) {
        return res.status(400).json({ message: "Invalid resume data." });
      }
      resumeLike = resumeData;
      basedOnTitle = resumeData?.personalInfo?.fullName ? `${resumeData.personalInfo.fullName}'s uploaded resume` : "your uploaded resume";
    }

    const profile = extractJobProfile(resumeLike);
    const effectiveLocation = "India";
    const queries = buildSearchQueries(profile, keyword);

    const { jobs: rawJobs, providerErrors, providersTried } = await searchAllProviders(queries, {
  location: effectiveLocation,
});     
  

    if (providersTried.length === 0) {
      const isDev = process.env.NODE_ENV !== "production";
      return res.status(503).json({
        message: isDev
          ? "No job provider API credentials are configured. Set JOOBLE_API_KEY and/or ADZUNA_APP_ID/ADZUNA_APP_KEY in backend/.env."
          : "Job search is temporarily unavailable. Please try again later.",
      });
    }

    const deduped = dedupeJobs(rawJobs);

    const scored = deduped
      .filter((job) => passesPostFilters(job, { remote, datePosted }))
      .map((job) => {
        const { sources, ...jobFields } = job;
        const { matchScore, matchedSkills, missingSkills, reasons } = scoreJob(jobFields, profile, {
          location: effectiveLocation,
          remote,
          experience,
        });
        return { ...jobFields, sources, matchScore, matchedSkills, missingSkills, reasons };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_RESULTS);

    // Best-effort search history — never blocks or fails the actual response.
    try {
      await JobSearch.create({
        user: req.user.id,
        resume: resumeRef,
        keyword,
        location: effectiveLocation,
        filters: { remote, experience, datePosted },
      });
    } catch (historyErr) {
      console.error("Job search history save failed (non-fatal):", historyErr.message);
    }

    return res.status(200).json({
      jobs: scored,
      basedOn: basedOnTitle,
      resumeProfile: {
        skills: profile.skills,
        targetRoles: profile.targetRoles,
        location: profile.location,
        educationText: profile.educationText,
        experienceLevel: profile.experienceLevel,
      },
      queriesUsed: queries,
      providersTried,
      providerErrors,
    });
  } catch (err) {
    console.error("Job search error:", err);
    return res.status(500).json({ message: "Could not search for jobs right now. Please try again." });
  }
}

module.exports = { searchJobs };
