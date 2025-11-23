// src/routes/faculty/marks.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// POST /faculty/marks/assessments
// Body: { course_id, title, type, max_marks, weightage, due_date }
router.post("/assessments", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const { course_id, title, type, max_marks, weightage, due_date } = req.body;

  if (!course_id || !title || !type) {
    return res.status(400).json({ message: "course_id, title, type required" });
  }

  try {
    // verify course belongs to faculty
    const c = await query(
      `SELECT id FROM campus360_dev.courses WHERE id = $1 AND faculty_id = $2`,
      [course_id, facultyId]
    );
    if (c.rows.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this course" });
    }

    const r = await query(
      `INSERT INTO campus360_dev.assessments
       (course_id, title, type, max_marks, weightage, due_date)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [course_id, title, type, max_marks || 100, weightage || null, due_date || null]
    );

    res.json({ assessment: r.rows[0] });
  } catch (err) {
    console.error("Create assessment error:", err);
    res.status(500).json({ message: "Failed to create assessment" });
  }
});

// GET /faculty/marks/assessments?course_id=...
router.get("/assessments", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const { course_id } = req.query;

  try {
    let params = [facultyId];
    let where = `WHERE c.faculty_id = $1`;

    if (course_id) {
      params.push(course_id);
      where += ` AND a.course_id = $2`;
    }

    const r = await query(
      `SELECT a.id, a.course_id, a.title, a.type, a.max_marks, a.weightage, a.due_date, a.created_at,
              c.code AS course_code, c.name AS course_name
       FROM campus360_dev.assessments a
       JOIN campus360_dev.courses c ON c.id = a.course_id
       ${where}
       ORDER BY a.created_at DESC NULLS LAST`,
      params
    );

    res.json({ assessments: r.rows || [] });
  } catch (err) {
    console.error("List assessments error:", err);
    console.error("Error details:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Failed to list assessments",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST /faculty/marks/assessments/:id/marks
// Body: { marks: [{ student_id, marks_obtained, feedback }] } OR { student_id, marks_obtained, feedback } (single)
router.post("/assessments/:id/marks", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const assessmentId = req.params.id;
  const { marks, student_id, marks_obtained, feedback } = req.body;

  try {
    // verify assessment belongs to a course taught by this faculty
    const a = await query(
      `SELECT a.id, a.course_id
       FROM campus360_dev.assessments a
       JOIN campus360_dev.courses c ON c.id = a.course_id
       WHERE a.id = $1 AND c.faculty_id = $2`,
      [assessmentId, facultyId]
    );
    if (a.rows.length === 0) {
      return res.status(403).json({ message: "You are not allowed to modify this assessment" });
    }

    const courseId = a.rows[0].course_id;
    let successCount = 0;

    // Handle bulk marks array or single mark
    const marksArray = marks || (student_id ? [{ student_id, marks_obtained, feedback }] : []);

    if (!Array.isArray(marksArray) || marksArray.length === 0) {
      return res.status(400).json({ message: "marks array or single mark required" });
    }

    for (const mark of marksArray) {
      const { student_id: sid, marks_obtained: mo, feedback: fb } = mark;

      if (!sid || mo == null) continue;

      // verify student is enrolled in this course
      const enrollment = await query(
        `SELECT id FROM campus360_dev.enrollments
         WHERE student_id = $1 AND course_id = $2`,
        [sid, courseId]
      );
      if (enrollment.rows.length === 0) continue;

      await query(
        `INSERT INTO campus360_dev.assessment_marks
         (assessment_id, student_id, marks_obtained, feedback)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (assessment_id, student_id)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained,
                       feedback = EXCLUDED.feedback,
                       submitted_at = now()`,
        [assessmentId, sid, mo, fb || null]
      );
      successCount++;
    }

    res.json({ message: `Marks recorded successfully for ${successCount} students` });
  } catch (err) {
    console.error("Record marks error:", err);
    res.status(500).json({ message: "Failed to record marks" });
  }
});

// GET /faculty/marks/assessments/:id/marks
router.get("/assessments/:id/marks", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const assessmentId = req.params.id;

  try {
    // verify assessment belongs to this faculty's course
    const a = await query(
      `SELECT a.id, a.course_id
       FROM campus360_dev.assessments a
       JOIN campus360_dev.courses c ON c.id = a.course_id
       WHERE a.id = $1 AND c.faculty_id = $2`,
      [assessmentId, facultyId]
    );
    if (a.rows.length === 0) {
      return res.status(403).json({ message: "You are not allowed to view marks for this assessment" });
    }

    const r = await query(
      `SELECT p.id AS student_id, p.full_name, p.email,
              m.marks_obtained, m.feedback, m.submitted_at
       FROM campus360_dev.enrollments e
       JOIN campus360_dev.profiles p ON p.id = e.student_id
       LEFT JOIN campus360_dev.assessment_marks m 
         ON m.student_id = e.student_id AND m.assessment_id = $1
       WHERE e.course_id = $2
       ORDER BY p.full_name`,
      [assessmentId, a.rows[0].course_id]
    );

    res.json({ 
      students: r.rows.map(row => ({
        id: row.student_id,
        full_name: row.full_name,
        email: row.email,
      })),
      marks: r.rows.map(row => ({
        student_id: row.student_id,
        marks_obtained: row.marks_obtained,
        feedback: row.feedback,
      }))
    });
  } catch (err) {
    console.error("Get marks error:", err);
    res.status(500).json({ message: "Failed to load marks" });
  }
});

export default router;
