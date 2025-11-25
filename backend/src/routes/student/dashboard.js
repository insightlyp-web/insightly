// src/routes/student/dashboard.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireStudent } from "../../middleware/studentCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

router.get("/", requireAuth, requireStudent, async (req, res) => {
  const studentId = req.studentProfile.id; // Use studentProfile from middleware instead of req.user.id

  try {
    // Profile - include all student fields
    const profile = await query(
      `SELECT id, full_name, email, department, phone, academic_year, student_year, roll_number
       FROM campus360_dev.profiles 
       WHERE id=$1 AND role='student'`,
      [studentId]
    );

    if (profile.rows.length === 0) {
      console.error(`Student profile not found for user ${studentId}`);
      return res.status(404).json({ 
        message: "Student profile not found",
        profile: null,
        attendance_summary: { present_count: 0 },
        today_timetable: [],
        recent_placements: []
      });
    }

    // Attendance summary
    const attendance = await query(
      `SELECT COUNT(*) AS present_count 
       FROM campus360_dev.attendance_records 
       WHERE student_id=$1`,
      [studentId]
    );

    // Today timetable
    const today = new Date().toLocaleString("en-US", { weekday: "short" });

    const timetable = await query(
      `SELECT t.*, c.code AS course_code, c.name AS course_name, p.full_name AS faculty_name
       FROM campus360_dev.timetable t
       JOIN campus360_dev.courses c ON c.id=t.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id=t.faculty_id
       WHERE c.department = (SELECT department FROM campus360_dev.profiles WHERE id=$1)
       AND t.day_of_week=$2
       ORDER BY t.start_time`,
      [studentId, today]
    );

    // Placements
    const placements = await query(
      `SELECT id, title, company_name, job_type, deadline
       FROM campus360_dev.placement_posts
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      profile: profile.rows[0],
      attendance_summary: attendance.rows[0] || { present_count: 0 },
      today_timetable: timetable.rows || [],
      recent_placements: placements.rows || []
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ 
      message: "Failed to load dashboard",
      error: err.message
    });
  }
});

export default router;
