const express = require("express");
const protect = require("../middleware/authMiddleware");
const { searchJobs } = require("../controllers/jobController");

const router = express.Router();

// POST (not GET — see jobController.js's searchJobs comment for why) /api/jobs/search
router.post("/search", protect, searchJobs);

module.exports = router;
