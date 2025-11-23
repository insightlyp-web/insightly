// src/routes/faculty/dashboard.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /faculty/dashboard
router.get("/", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;

  try {
    const courses = await query(
      `SELECT id, code, name, year FROM campus360_dev.courses WHERE faculty_id = $1`,
      [facultyId]
    );

    const sessions = await query(
      `SELECT COUNT(*) AS total_sessions
       FROM campus360_dev.attendance_sessions
       WHERE faculty_id = $1`,
      [facultyId]
    );

    const assessments = await query(
      `SELECT COUNT(*) AS total_assessments
       FROM campus360_dev.assessments a
       JOIN campus360_dev.courses c ON c.id = a.course_id
       WHERE c.faculty_id = $1`,
      [facultyId]
    );

    res.json({
      courses: courses.rows,
      stats: {
        total_courses: courses.rows.length,
        total_sessions: Number(sessions.rows[0].total_sessions || 0),
        total_assessments: Number(assessments.rows[0].total_assessments || 0)
      }
    });
  } catch (err) {
    console.error("Faculty dashboard error:", err);
    res.status(500).json({ message: "Failed to load faculty dashboard" });
  }
});

export default router;

