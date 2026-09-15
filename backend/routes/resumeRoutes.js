const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getAllResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
} = require("../controllers/resumeController");

const router = express.Router();

router.get("/", protect, getAllResumes);
router.post("/", protect, createResume);
router.get("/:id", protect, getResumeById);
router.put("/:id", protect, updateResume);
router.delete("/:id", protect, deleteResume);

module.exports = router;
