const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // NOTE: intentionally NOT unique — a user can own many resumes.
      // Every query/update/delete must still filter by `user` (see
      // resumeController.js) so one user can never touch another's data.
    },
    title: {
      type: String,
      trim: true,
      default: "My Resume",
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    templateId: {
      type: String,
      default: "professional-classic",
    },
    font: {
      type: String,
      default: "Arial",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

resumeSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Resume", resumeSchema);
