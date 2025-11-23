// src/routes/faculty/attendance.js
import express from "express";
import crypto from "crypto";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// helper: generate session_code (short random string)
function generateSessionCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. 'A1B2C3D4'
}

// POST /faculty/attendance/sessions
// Body: { course_id, start_time, end_time }
// start_time, end_time: ISO strings
router.post("/sessions", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const { course_id, start_time, end_time } = req.body;

  if (!course_id || !start_time || !end_time) {
    return res.status(400).json({ message: "course_id, start_time, end_time required" });
  }

  try {
    // ensure course belongs to faculty
    const c = await query(
      `SELECT id FROM campus360_dev.courses WHERE id = $1 AND faculty_id = $2`,
      [course_id, facultyId]
    );
    if (c.rows.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this course" });
    }

    const sessionCode = generateSessionCode();

    const r = await query(
      `INSERT INTO campus360_dev.attendance_sessions
       (faculty_id, course_id, session_code, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, session_code, start_time, end_time`,
      [facultyId, course_id, sessionCode, start_time, end_time]
    );

    res.json({
      message: "Session created",
      session: r.rows[0]
    });
  } catch (err) {
    console.error("Create attendance session error:", err);
    res.status(500).json({ message: "Failed to create attendance session" });
  }
});

// GET /faculty/attendance/sessions?course_id=...
router.get("/sessions", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const { course_id } = req.query;

  try {
    const params = [facultyId];
    let where = `WHERE s.faculty_id = $1`;

    if (course_id) {
      params.push(course_id);
      where += ` AND s.course_id = $2`;
    }

    const r = await query(
      `SELECT s.id, s.session_code, s.start_time, s.end_time, c.code AS course_code, c.name AS course_name
       FROM campus360_dev.attendance_sessions s
       JOIN campus360_dev.courses c ON c.id = s.course_id
       ${where}
       ORDER BY s.start_time DESC`,
      params
    );

    res.json({ sessions: r.rows });
  } catch (err) {
    console.error("List attendance sessions error:", err);
    res.status(500).json({ message: "Failed to list sessions" });
  }
});

// GET /faculty/attendance/sessions/:id
// Get attendance details for a specific session
router.get("/sessions/:id", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const sessionId = req.params.id;

  try {
    // verify this session belongs to faculty
    const s = await query(
      `SELECT s.id, s.session_code, s.start_time, s.end_time, s.course_id, c.code, c.name
       FROM campus360_dev.attendance_sessions s
       JOIN campus360_dev.courses c ON c.id = s.course_id
       WHERE s.id = $1 AND s.faculty_id = $2`,
      [sessionId, facultyId]
    );

    if (s.rows.length === 0) {
      return res.status(404).json({ message: "Session not found or not yours" });
    }

    const session = s.rows[0];

    const records = await query(
      `SELECT p.id AS student_id, p.full_name, p.email, ar.timestamp
       FROM campus360_dev.attendance_records ar
       JOIN campus360_dev.profiles p ON p.id = ar.student_id
       WHERE ar.session_id = $1
       ORDER BY p.full_name`,
      [sessionId]
    );

    res.json({
      session: {
        session_code: session.session_code,
        course_code: session.code,
        course_name: session.name,
        start_time: session.start_time,
        end_time: session.end_time,
      },
      records: records.rows.map(r => ({
        student_name: r.full_name,
        timestamp: r.timestamp,
      }))
    });
  } catch (err) {
    console.error("Session details error:", err);
    res.status(500).json({ message: "Failed to load session attendance" });
  }
});

// GET /faculty/attendance/course/:courseId
// Aggregate attendance for a course (for this faculty)
router.get("/course/:courseId", requireAuth, requireFaculty, async (req, res) => {
  const facultyId = req.facultyProfile.id;
  const courseId = req.params.courseId;

  try {
    // verify course
    const c = await query(
      `SELECT id FROM campus360_dev.courses WHERE id = $1 AND faculty_id = $2`,
      [courseId, facultyId]
    );
    if (c.rows.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this course" });
    }

    // Get course info
    const courseInfo = await query(
      `SELECT code, name FROM campus360_dev.courses WHERE id = $1`,
      [courseId]
    );

    // Get student attendance with percentage
    const studentsRes = await query(
      `WITH enrolled_students AS (
        SELECT student_id FROM campus360_dev.enrollments WHERE course_id = $1
      ),
      session_counts AS (
        SELECT 
          e.student_id,
          COUNT(DISTINCT s.id) AS total_sessions,
          COUNT(DISTINCT ar.id) AS attended_sessions
        FROM enrolled_students e
        CROSS JOIN campus360_dev.attendance_sessions s
        LEFT JOIN campus360_dev.attendance_records ar 
          ON ar.student_id = e.student_id AND ar.session_id = s.id
        WHERE s.course_id = $1
        GROUP BY e.student_id
      )
      SELECT 
        p.id AS student_id,
        p.full_name AS student_name,
        COALESCE(sc.total_sessions, 0) AS total_sessions,
        COALESCE(sc.attended_sessions, 0) AS attended_sessions,
        CASE 
          WHEN COALESCE(sc.total_sessions, 0) > 0 
          THEN ROUND((COALESCE(sc.attended_sessions, 0)::numeric / sc.total_sessions::numeric) * 100, 2)
          ELSE 0 
        END AS attendance_percentage
      FROM campus360_dev.profiles p
      JOIN enrolled_students e ON e.student_id = p.id
      LEFT JOIN session_counts sc ON sc.student_id = p.id
      WHERE p.role = 'student'
      ORDER BY p.full_name`,
      [courseId]
    );

    // Get daily attendance trend
    const dailyRes = await query(
      `WITH session_attendance AS (
        SELECT 
          DATE(s.start_time) AS date,
          s.id AS session_id,
          (SELECT COUNT(DISTINCT student_id) FROM campus360_dev.enrollments WHERE course_id = $1) AS total_enrolled,
          COUNT(DISTINCT ar.student_id) AS attended_count
        FROM campus360_dev.attendance_sessions s
        LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
        WHERE s.course_id = $1
        GROUP BY DATE(s.start_time), s.id
      )
      SELECT 
        date,
        AVG(
          CASE 
            WHEN total_enrolled > 0 
            THEN (attended_count::numeric / total_enrolled::numeric) * 100
            ELSE 0 
          END
        ) AS attendance_percentage
      FROM session_attendance
      GROUP BY date
      ORDER BY date ASC`,
      [courseId]
    );

    res.json({ 
      course: courseInfo.rows[0] || null,
      students: studentsRes.rows,
      daily: dailyRes.rows
    });
  } catch (err) {
    console.error("Course attendance summary error:", err);
    res.status(500).json({ message: "Failed to load course attendance summary" });
  }
});

export default router;

