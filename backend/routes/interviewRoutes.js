const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
} = require("../controllers/interviewController");

const router = express.Router();

router.get("/", protect, getAllSessions);
router.post("/", protect, createSession);
router.get("/:id", protect, getSessionById);
router.put("/:id", protect, updateSession);

module.exports = router;
