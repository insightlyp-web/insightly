// src/routes/hod/profile.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /hod/profile
router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const hodId = req.profile.id;

    const r = await query(
      `SELECT id, full_name, email, role, department, phone, created_at
       FROM campus360_dev.profiles
       WHERE id = $1 AND role = 'hod'`,
      [hodId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "HOD profile not found" });
    }

    res.json({ profile: r.rows[0] });
  } catch (err) {
    console.error("HOD profile error:", err);
    res.status(500).json({ message: "Failed to fetch HOD profile" });
  }
});

export default router;

