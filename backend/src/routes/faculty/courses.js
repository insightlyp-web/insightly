// src/routes/faculty/courses.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /faculty/courses
// List courses taught by this faculty
router.get("/", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  try {
    const r = await query(
      `SELECT id, code, name, department, year, academic_year
       FROM campus360_dev.courses
       WHERE faculty_id = $1
       ORDER BY code`,
      [facultyId]
    );
    res.json({ courses: r.rows });
  } catch (err) {
    console.error("Faculty courses error:", err);
    res.status(500).json({ message: "Failed to fetch faculty courses" });
  }
});

// GET /faculty/courses/:id/students
// List students enrolled in a given course (must be taught by this faculty)
router.get("/:id/students", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const courseId = req.params.id;

  try {
    // verify course belongs to this faculty
    const courseRes = await query(
      `SELECT id FROM campus360_dev.courses WHERE id = $1 AND faculty_id = $2`,
      [courseId, facultyId]
    );
    if (courseRes.rows.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this course" });
    }

    const r = await query(
      `SELECT p.id, p.full_name, p.email, p.phone, p.department, 
              p.academic_year, p.student_year, p.roll_number
       FROM campus360_dev.enrollments e
       JOIN campus360_dev.profiles p ON p.id = e.student_id
       WHERE e.course_id = $1
       ORDER BY p.academic_year DESC NULLS LAST, p.student_year, p.roll_number, p.full_name`,
      [courseId]
    );

    res.json({ students: r.rows });
  } catch (err) {
    console.error("Course students error:", err);
    res.status(500).json({ message: "Failed to fetch course students" });
  }
});

export default router;

