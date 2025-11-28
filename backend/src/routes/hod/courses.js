// src/routes/hod/courses.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

router.post("/", requireAuth, requireHOD, async (req, res) => {
  const { code, name, year } = req.body;
  if (!code || !name) return res.status(400).json({ message: "code and name required" });
  try {
    const r = await query(
      `INSERT INTO campus360_dev.courses (code, name, year, department) VALUES ($1,$2,$3,$4) RETURNING *`,
      [code, name, year || null, req.department]
    );
    res.json({ course: r.rows[0] });
  } catch (err) {
    console.error("create course error", err);
    res.status(500).json({ message: "Server error creating course" });
  }
});

router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const r = await query(
      `SELECT 
        c.id, c.code, c.name, c.department, c.year, c.academic_year, c.semester, 
        c.subject_type, c.elective_group, c.faculty_id, c.created_at,
        p.full_name AS faculty_name
       FROM campus360_dev.courses c
       LEFT JOIN campus360_dev.profiles p ON c.faculty_id = p.id
       WHERE c.department=$1 
       ORDER BY c.year DESC, c.semester DESC, c.code`, 
      [req.department]
    );
    res.json({ courses: r.rows });
  } catch (err) {
    console.error("list courses error", err);
    res.status(500).json({ message: "Server error listing courses" });
  }
});

router.put("/:id/map-faculty", requireAuth, requireHOD, async (req, res) => {
  const courseId = req.params.id;
  const { faculty_id, academic_year, semester } = req.body;
  try {
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (faculty_id !== undefined) {
      updates.push(`faculty_id = $${paramIndex++}`);
      values.push(faculty_id === null || faculty_id === '' ? null : faculty_id);
    }

    if (academic_year !== undefined && academic_year !== null && academic_year !== '') {
      updates.push(`academic_year = $${paramIndex++}`);
      values.push(academic_year);
    }

    if (semester !== undefined && semester !== null && semester !== '') {
      updates.push(`semester = $${paramIndex++}`);
      values.push(semester);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "At least one field (faculty_id, academic_year, or semester) must be provided" });
    }

    // Add courseId and department to values
    values.push(courseId, req.department);

    const queryText = `UPDATE campus360_dev.courses 
                       SET ${updates.join(', ')} 
                       WHERE id = $${paramIndex++} AND department = $${paramIndex++}`;

    await query(queryText, values);
    res.json({ message: "Course updated successfully" });
  } catch (err) {
    console.error("map faculty error", err);
    res.status(500).json({ message: "Server error updating course" });
  }
});

router.delete("/:id", requireAuth, requireHOD, async (req, res) => {
  const courseId = req.params.id;
  try {
    // Verify course belongs to the HOD's department
    const courseCheck = await query(
      `SELECT id, code, name FROM campus360_dev.courses WHERE id = $1 AND department = $2`,
      [courseId, req.department]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: "Course not found or does not belong to your department" });
    }

    const course = courseCheck.rows[0];

    // Get counts before deletion for response
    const enrollmentsCheck = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.enrollments WHERE course_id = $1`,
      [courseId]
    );
    const enrollmentsCount = parseInt(enrollmentsCheck.rows[0]?.count || 0);

    const sessionsCheck = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.attendance_sessions WHERE course_id = $1`,
      [courseId]
    );
    const sessionsCount = parseInt(sessionsCheck.rows[0]?.count || 0);

    // Delete course (enrollments and assessments will be cascade deleted, attendance_sessions will have course_id set to NULL)
    await query(
      `DELETE FROM campus360_dev.courses WHERE id = $1`,
      [courseId]
    );

    res.json({ 
      message: "Course deleted successfully",
      course_code: course.code,
      course_name: course.name,
      enrollments_deleted: enrollmentsCount,
      sessions_affected: sessionsCount
    });
  } catch (err) {
    console.error("delete course error", err);
    res.status(500).json({ message: "Server error deleting course" });
  }
});

export default router;
