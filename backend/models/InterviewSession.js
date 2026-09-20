const mongoose = require("mongoose");

// A single resume-specific interview question, generated on the frontend
// from that resume's own data (see frontend/src/utils/mock-interview).
const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "project",
        "skill",
        "experience",
        "education",
        "certification",
        "cross-section",
      ],
    },
    text: { type: String, required: true },
    // Free-form context the evaluator uses (e.g. which skill/project this
    // question refers to) — not shown to the user, only used for keyword
    // matching when the answer is evaluated.
    keywords: { type: [String], default: [] },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    verdict: { type: String, enum: ["good", "needs-improvement", "missing"] },
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

// One question + the user's answer + its rule-based evaluation, kept
// together so history/report rendering never has to re-join three arrays.
const answerItemSchema = new mongoose.Schema(
  {
    question: { type: questionSchema, required: true },
    answerText: { type: String, default: "" },
    evaluation: { type: evaluationSchema, default: null },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

const areaScoresSchema = new mongoose.Schema(
  {
    projectUnderstanding: { type: Number, default: null },
    technicalSkills: { type: Number, default: null },
    experience: { type: Number, default: null },
    communication: { type: Number, default: null },
    resumeKnowledge: { type: Number, default: null },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Same rule as Resume.user — never unique, every query must filter
      // by it (see interviewController.js) so sessions never leak across
      // users.
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      // Which saved resume this interview was generated from — this is
      // what keeps every user's multiple resumes isolated into separate
      // interview contexts (see interviewController.js).
    },
    resumeTitleSnapshot: {
      type: String,
      default: "My Resume",
      // Copied from the resume at creation time so history/report still
      // reads correctly even if the resume is later renamed or deleted.
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    questionCount: { type: Number, required: true },
    items: { type: [answerItemSchema], default: [] },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    finalScore: { type: Number, default: null },
    areaScores: { type: areaScoresSchema, default: () => ({}) },
    strongAreas: { type: [String], default: [] },
    areasToImprove: { type: [String], default: [] },
    preparationSuggestions: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ user: 1, resume: 1 });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
