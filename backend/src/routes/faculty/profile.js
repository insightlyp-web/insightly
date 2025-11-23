// src/routes/faculty/profile.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /faculty/profile
router.get("/", requireAuth, requireFaculty, async (req, res) => {
  try {
    const facultyId = req.facultyProfile.id;

    const r = await query(
      `SELECT id, full_name, email, role, department, phone, created_at
       FROM campus360_dev.profiles
       WHERE id = $1 AND role = 'faculty'`,
      [facultyId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Faculty profile not found" });
    }

    res.json({ profile: r.rows[0] });
  } catch (err) {
    console.error("Faculty profile error:", err);
    res.status(500).json({ message: "Failed to fetch faculty profile" });
  }
});

export default router;

