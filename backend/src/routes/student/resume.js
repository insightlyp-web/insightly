// src/routes/student/resume.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";

const router = express.Router();

// Save resume URL
router.post("/", requireAuth, async (req, res) => {
  const { resume_url } = req.body;
  if (!resume_url) return res.status(400).json({ message: "resume_url required" });

  try {
    await query(
      `UPDATE campus360_dev.profiles SET phone=$1 WHERE id=$2`,
      [resume_url, req.user.id]
    );
    res.json({ message: "Resume updated successfully" });
  } catch (err) {
    console.error("resume err:", err);
    res.status(500).json({ message: "Failed to save resume" });
  }
});

// Get resume
router.get("/", requireAuth, async (req, res) => {
  try {
    const r = await query(
      `SELECT phone AS resume_url FROM campus360_dev.profiles WHERE id=$1`,
      [req.user.id]
    );
    res.json({ resume_url: r.rows[0]?.resume_url || null });
  } catch (err) {
    console.error("resume get err:", err);
    res.status(500).json({ message: "Failed to fetch resume" });
  }
});

export default router;
