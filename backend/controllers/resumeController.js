const mongoose = require("mongoose");
const Resume = require("../models/Resume");

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function serialize(resume) {
  return {
    id: resume._id,
    title: resume.title,
    formData: resume.formData,
    templateId: resume.templateId,
    font: resume.font,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

// GET /api/resumes — every resume belonging to the authenticated user,
// most recently updated first.
async function getAllResumes(req, res) {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ updatedAt: -1 });
    return res.status(200).json({ resumes: resumes.map(serialize) });
  } catch (err) {
    console.error("Get resumes error:", err);
    return res.status(500).json({ message: "Could not load your resumes. Please try again." });
  }
}

// GET /api/resumes/:id — a single resume, only if it belongs to this user.
async function getResumeById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    // Never trust a client-supplied user id — compare against the resume's
    // actual owner and the authenticated user from the verified JWT.
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have access to this resume" });
    }

    return res.status(200).json({ resume: serialize(resume) });
  } catch (err) {
    console.error("Get resume error:", err);
    return res.status(500).json({ message: "Could not load this resume. Please try again." });
  }
}

// POST /api/resumes — create a new resume owned by the authenticated user.
async function createResume(req, res) {
  try {
    const { title, formData, templateId, font } = req.body;

    if (formData === undefined) {
      return res.status(400).json({ message: "formData is required" });
    }

    const resume = await Resume.create({
      user: req.user.id,
      title: title?.trim() || "My Resume",
      formData,
      templateId: templateId || "professional-classic",
      font: font || "Arial",
    });

    return res.status(201).json({ resume: serialize(resume) });
  } catch (err) {
    console.error("Create resume error:", err);
    return res.status(500).json({ message: "Could not save your resume. Please try again." });
  }
}

// PUT /api/resumes/:id — update a resume, but only if it belongs to this
// user. Fields are updated only if provided, so a partial update (e.g. just
// { formData } from the Resume Builder's autosave) never clobbers the
// title/templateId set elsewhere.
async function updateResume(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have access to this resume" });
    }

    const { title, formData, templateId, font } = req.body;
    if (title !== undefined) resume.title = title?.trim() || "My Resume";
    if (formData !== undefined) resume.formData = formData;
    if (templateId !== undefined) resume.templateId = templateId;
    if (font !== undefined) resume.font = font;

    await resume.save();

    return res.status(200).json({ resume: serialize(resume) });
  } catch (err) {
    console.error("Update resume error:", err);
    return res.status(500).json({ message: "Could not save your resume. Please try again." });
  }
}

// DELETE /api/resumes/:id — delete a resume, but only if it belongs to
// this user.
async function deleteResume(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have access to this resume" });
    }

    await resume.deleteOne();

    return res.status(200).json({ message: "Resume deleted" });
  } catch (err) {
    console.error("Delete resume error:", err);
    return res.status(500).json({ message: "Could not delete this resume. Please try again." });
  }
}

module.exports = {
  getAllResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
};
