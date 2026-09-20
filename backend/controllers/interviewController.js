const mongoose = require("mongoose");
const InterviewSession = require("../models/InterviewSession");
const Resume = require("../models/Resume");

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function serialize(session) {
  return {
    id: session._id,
    resumeId: session.resume,
    resumeTitleSnapshot: session.resumeTitleSnapshot,
    difficulty: session.difficulty,
    questionCount: session.questionCount,
    items: session.items,
    status: session.status,
    finalScore: session.finalScore,
    areaScores: session.areaScores,
    strongAreas: session.strongAreas,
    areasToImprove: session.areasToImprove,
    preparationSuggestions: session.preparationSuggestions,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt,
  };
}

// GET /api/interviews — this user's interview history, newest first.
// Used by the Mock Interview page's "Previous Interviews" list.
async function getAllSessions(req, res) {
  try {
    const sessions = await InterviewSession.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ sessions: sessions.map(serialize) });
  } catch (err) {
    console.error("Get interview sessions error:", err);
    return res
      .status(500)
      .json({ message: "Could not load your interview history. Please try again." });
  }
}

// GET /api/interviews/:id — a single session (interview screen resume-on-
// refresh, or the report view), only if it belongs to this user.
async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const session = await InterviewSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }
    if (session.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have access to this interview session" });
    }

    return res.status(200).json({ session: serialize(session) });
  } catch (err) {
    console.error("Get interview session error:", err);
    return res
      .status(500)
      .json({ message: "Could not load this interview session. Please try again." });
  }
}

// POST /api/interviews — start a new resume-specific interview session.
// The question set itself is generated on the frontend (see
// src/utils/mock-interview/questionGenerator.js), from the selected saved
// resume's own formData, so it is always specific to that resume. This
// endpoint just verifies the resume actually belongs to this user before
// persisting the session against it — the resume's own data is never
// re-derived or re-parsed here (no second resume parser).
async function createSession(req, res) {
  try {
    const { resumeId, difficulty, questionCount, items } = req.body;

    if (!resumeId || !isValidId(resumeId)) {
      return res.status(400).json({ message: "A valid resumeId is required" });
    }
    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return res.status(400).json({ message: "A valid difficulty is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    if (resume.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have access to this resume" });
    }

    const session = await InterviewSession.create({
      user: req.user.id,
      resume: resume._id,
      resumeTitleSnapshot: resume.title,
      difficulty,
      questionCount: questionCount || items.length,
      items,
      status: "in-progress",
    });

    return res.status(201).json({ session: serialize(session) });
  } catch (err) {
    console.error("Create interview session error:", err);
    return res
      .status(500)
      .json({ message: "Could not start the interview. Please try again." });
  }
}

// PUT /api/interviews/:id — record an answer/evaluation for a question, or
// (with status: "completed") finalize the session with its report data.
// Fields are only updated when provided, so a per-question update never
// clobbers unrelated fields.
async function updateSession(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const session = await InterviewSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }
    if (session.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have access to this interview session" });
    }

    const {
      items,
      status,
      finalScore,
      areaScores,
      strongAreas,
      areasToImprove,
      preparationSuggestions,
    } = req.body;

    if (items !== undefined) session.items = items;
    if (status !== undefined) session.status = status;
    if (finalScore !== undefined) session.finalScore = finalScore;
    if (areaScores !== undefined) session.areaScores = areaScores;
    if (strongAreas !== undefined) session.strongAreas = strongAreas;
    if (areasToImprove !== undefined) session.areasToImprove = areasToImprove;
    if (preparationSuggestions !== undefined)
      session.preparationSuggestions = preparationSuggestions;
    if (status === "completed" && !session.completedAt) {
      session.completedAt = new Date();
    }

    await session.save();

    return res.status(200).json({ session: serialize(session) });
  } catch (err) {
    console.error("Update interview session error:", err);
    return res
      .status(500)
      .json({ message: "Could not save your progress. Please try again." });
  }
}

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
};
