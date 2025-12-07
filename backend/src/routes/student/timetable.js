// src/routes/student/timetable.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// Today's timetable
router.get("/today", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student details
    const profile = await query(
      `SELECT department FROM campus360_dev.profiles WHERE id=$1`,
      [userId]
    );
    if (profile.rows.length === 0) return res.status(404).json({ message: "Profile not found" });

    const department = profile.rows[0].department;

    // Today - ensure consistent format (Mon, Tue, etc.)
    const today = new Date().toLocaleString("en-US", { weekday: "short" });

    const tt = await query(
      `SELECT t.*, c.code AS course_code, c.name AS course_name, p.full_name AS faculty_name
       FROM campus360_dev.timetable t
       JOIN campus360_dev.courses c ON c.id = t.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id = t.faculty_id
       WHERE c.department = $1 AND t.day_of_week = $2
       ORDER BY t.start_time`,
      [department, today]
    );

    res.json({ timetable: tt.rows });
  } catch (err) {
    console.error("Student timetable error:", err);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
});

// Weekly timetable
router.get("/week", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student details
    const profile = await query(
      `SELECT department FROM campus360_dev.profiles WHERE id=$1`,
      [userId]
    );
    if (profile.rows.length === 0) return res.status(404).json({ message: "Profile not found" });

    const department = profile.rows[0].department;

    const tt = await query(
      `SELECT t.*, c.code AS course_code, c.name AS course_name, p.full_name AS faculty_name
       FROM campus360_dev.timetable t
       JOIN campus360_dev.courses c ON c.id = t.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id = t.faculty_id
       WHERE c.department = $1
       ORDER BY 
         CASE t.day_of_week
           WHEN 'Mon' THEN 1
           WHEN 'Tue' THEN 2
           WHEN 'Wed' THEN 3
           WHEN 'Thu' THEN 4
           WHEN 'Fri' THEN 5
           WHEN 'Sat' THEN 6
           WHEN 'Sun' THEN 7
           ELSE 8
         END,
         t.start_time`,
      [department]
    );

    res.json({ timetable: tt.rows });
  } catch (err) {
    console.error("Student weekly timetable error:", err);
    res.status(500).json({ message: "Failed to fetch weekly timetable" });
  }
});

export default router;
