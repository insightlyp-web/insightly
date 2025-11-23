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

    // Today
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

export default router;
