const mongoose = require("mongoose");

// Optional history collection — NOT a cache of live job data, just a record
// of what the user searched for (used only for the "Based on: <resume>"
// header / potential future "recent searches" UI). Safe to fail silently:
// see controllers/jobController.js, which never lets a write here block or
// fail the actual job search response.
const jobSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", default: null },
    keyword: { type: String, default: "" },
    location: { type: String, default: "" },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("JobSearch", jobSearchSchema);
