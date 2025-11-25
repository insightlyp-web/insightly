// src/routes/student/profile.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireStudent } from "../../middleware/studentCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// Get student profile
router.get("/", requireAuth, requireStudent, async (req, res) => {
  try {
    const studentId = req.studentProfile.id;

    // Fetch full student profile (include role for frontend verification)
    const r = await query(
      `SELECT id, full_name, email, role, department, phone, academic_year, student_year, roll_number, created_at 
       FROM campus360_dev.profiles 
       WHERE id=$1 AND role='student'`,
      [studentId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.json({ profile: r.rows[0] });
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({ message: "Failed to fetch student profile" });
  }
});

export default router;
