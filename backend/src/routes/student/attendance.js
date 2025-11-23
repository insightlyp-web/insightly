// src/routes/student/attendance.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";

const router = express.Router();

// Attendance summary
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const r = await query(
      `SELECT COUNT(*) AS present_count 
       FROM campus360_dev.attendance_records 
       WHERE student_id = $1`,
      [userId]
    );

    res.json({ summary: r.rows[0] });
  } catch (err) {
    console.error("Attendance summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
});

// Full history
router.get("/history", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const r = await query(
      `SELECT s.session_code, s.start_time, ar.timestamp, c.name AS course_name 
       FROM campus360_dev.attendance_records ar
       JOIN campus360_dev.attendance_sessions s ON s.id = ar.session_id
       JOIN campus360_dev.courses c ON c.id = s.course_id
       WHERE ar.student_id = $1
       ORDER BY ar.timestamp DESC`,
      [userId]
    );

    res.json({ history: r.rows });
  } catch (err) {
    console.error("Attendance history error:", err);
    res.status(500).json({ message: "Failed to load history" });
  }
});

// Mark attendance via session code
router.post("/mark", requireAuth, async (req, res) => {
  const { session_code } = req.body;
  const userId = req.user.id;

  if (!session_code) return res.status(400).json({ message: "session_code required" });

  try {
    const session = await query(
      `SELECT id, start_time, end_time FROM campus360_dev.attendance_sessions WHERE session_code=$1`,
      [session_code]
    );

    if (session.rows.length === 0)
      return res.status(404).json({ message: "Invalid session" });

    const s = session.rows[0];
    const now = new Date();

    if (now < s.start_time || now > s.end_time)
      return res.status(400).json({ message: "Session expired or not active" });

    await query(
      `INSERT INTO campus360_dev.attendance_records (session_id, student_id, timestamp)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_id, student_id) DO NOTHING`,
      [s.id, userId]
    );

    res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
});

export default router;
