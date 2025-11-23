// src/routes/hod/attendance.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

router.get("/students", requireAuth, requireHOD, async (req, res) => {
  try {
    const q = `
      SELECT 
        p.full_name AS student_name,
        c.code AS course_code,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT ar.id) AS attended_sessions,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN ROUND((COUNT(DISTINCT ar.id)::numeric / COUNT(DISTINCT s.id)::numeric) * 100, 2)
          ELSE 0 
        END AS attendance_percentage
      FROM campus360_dev.profiles p
      CROSS JOIN campus360_dev.courses c
      LEFT JOIN campus360_dev.enrollments e ON e.student_id = p.id AND e.course_id = c.id
      LEFT JOIN campus360_dev.attendance_sessions s ON s.course_id = c.id
      LEFT JOIN campus360_dev.attendance_records ar ON ar.student_id = p.id AND ar.session_id = s.id
      WHERE p.department = $1 
        AND p.role = 'student'
        AND c.department = $1
        AND e.id IS NOT NULL
      GROUP BY p.full_name, p.id, c.code, c.id
      HAVING COUNT(DISTINCT s.id) > 0
      ORDER BY p.full_name, c.code;
    `;
    const r = await query(q, [req.department]);
    res.json({ attendance: r.rows });
  } catch (err) {
    console.error("attendance students error", err);
    res.status(500).json({ message: "Server error fetching attendance summary" });
  }
});

router.get("/course/:id", requireAuth, requireHOD, async (req, res) => {
  const courseId = req.params.id;
  try {
    // Get detailed records
    const recordsRes = await query(
      `SELECT p.full_name, s.session_code, ar.timestamp
       FROM campus360_dev.attendance_records ar
       JOIN campus360_dev.attendance_sessions s ON s.id = ar.session_id
       JOIN campus360_dev.profiles p ON p.id = ar.student_id
       WHERE s.course_id = $1
       ORDER BY ar.timestamp DESC`,
      [courseId]
    );

    // Get daily attendance trend - average attendance percentage per day
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
      records: recordsRes.rows,
      daily: dailyRes.rows
    });
  } catch (err) {
    console.error("attendance course error", err);
    res.status(500).json({ message: "Server error fetching course attendance" });
  }
});

router.get("/session/:id", requireAuth, requireHOD, async (req, res) => {
  const sessionId = req.params.id;
  try {
    const r = await query(
      `SELECT p.full_name, ar.timestamp
       FROM campus360_dev.attendance_records ar
       JOIN campus360_dev.profiles p ON p.id = ar.student_id
       WHERE ar.session_id = $1`,
      [sessionId]
    );
    res.json({ records: r.rows });
  } catch (err) {
    console.error("attendance session error", err);
    res.status(500).json({ message: "Server error fetching session attendance" });
  }
});

export default router;
