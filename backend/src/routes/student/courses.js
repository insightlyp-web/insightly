// src/routes/student/courses.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// Get all enrolled courses
router.get("/", requireAuth, async (req, res) => {
  const studentId = req.user.id;

  try {
    const r = await query(
      `SELECT c.id, c.code, c.name, c.year, p.full_name AS faculty_name
       FROM campus360_dev.enrollments e
       JOIN campus360_dev.courses c ON c.id = e.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id = c.faculty_id
       WHERE e.student_id = $1`,
      [studentId]
    );

    res.json({ courses: r.rows });
  } catch (err) {
    console.error("Student courses error:", err);
    res.status(500).json({ message: "Failed to fetch enrolled courses" });
  }
});

// Specific course
router.get("/:id", requireAuth, async (req, res) => {
  const courseId = req.params.id;

  try {
    const r = await query(
      `SELECT id, code, name, department, year, faculty_id
       FROM campus360_dev.courses
       WHERE id = $1`,
      [courseId]
    );

    if (r.rows.length === 0)
      return res.status(404).json({ message: "Course not found" });

    res.json({ course: r.rows[0] });
  } catch (err) {
    console.error("Specific course error:", err);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

export default router;
