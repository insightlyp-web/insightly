// src/routes/student/attendance.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";
import { isWithinRadius } from "../../utils/geolocation.js";

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

// Get session details by session code (for checking location requirements)
router.get("/session/:session_code", requireAuth, async (req, res) => {
  try {
    const { session_code } = req.params;

    const session = await query(
      `SELECT s.id, s.session_code, s.start_time, s.end_time, 
              s.location_required, s.faculty_lat, s.faculty_lng, s.allowed_radius,
              c.name AS course_name, c.code AS course_code
       FROM campus360_dev.attendance_sessions s
       JOIN campus360_dev.courses c ON c.id = s.course_id
       WHERE s.session_code = $1`,
      [session_code]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ message: "Invalid session" });
    }

    const s = session.rows[0];
    const now = new Date();

    // Check if session is active
    if (now < s.start_time || now > s.end_time) {
      return res.status(400).json({ 
        message: "Session expired or not active",
        session: null
      });
    }

    res.json({
      session: {
        session_code: s.session_code,
        course_name: s.course_name,
        course_code: s.course_code,
        start_time: s.start_time,
        end_time: s.end_time,
        location_required: s.location_required,
        allowed_radius: s.allowed_radius,
        faculty_lat: s.faculty_lat,
        faculty_lng: s.faculty_lng,
      }
    });
  } catch (err) {
    console.error("Get session details error:", err);
    res.status(500).json({ message: "Failed to get session details" });
  }
});

// Mark attendance via session code
router.post("/mark", requireAuth, async (req, res) => {
  const { session_code, student_lat, student_lng } = req.body;
  const userId = req.user.id;

  if (!session_code) return res.status(400).json({ message: "session_code required" });

  try {
    const session = await query(
      `SELECT id, start_time, end_time, location_required, faculty_lat, faculty_lng, allowed_radius 
       FROM campus360_dev.attendance_sessions WHERE session_code=$1`,
      [session_code]
    );

    if (session.rows.length === 0)
      return res.status(404).json({ message: "Invalid session" });

    const s = session.rows[0];
    const now = new Date();

    if (now < s.start_time || now > s.end_time)
      return res.status(400).json({ message: "Session expired or not active" });

    // Check location requirement
    if (s.location_required === true) {
      // Location is required for this session
      if (student_lat === undefined || student_lng === undefined) {
        return res.status(400).json({ 
          message: "Student location required for this session" 
        });
      }

      const lat = parseFloat(student_lat);
      const lng = parseFloat(student_lng);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid student location coordinates" });
      }

      // Check if faculty location is set
      if (s.faculty_lat === null || s.faculty_lng === null) {
        return res.status(500).json({ 
          message: "Session location not configured properly" 
        });
      }

      // Check if student is within allowed radius
      const radius = s.allowed_radius || 50; // default to 50 meters
      const withinRadius = isWithinRadius(
        lat, 
        lng, 
        s.faculty_lat, 
        s.faculty_lng, 
        radius
      );

      if (!withinRadius) {
        return res.status(403).json({ 
          message: "You are outside the allowed location range" 
        });
      }
    }
    // If location_required is false, proceed without location check

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
