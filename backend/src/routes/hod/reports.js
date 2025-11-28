// src/routes/hod/reports.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

// GET /hod/reports/weekly
// Get weekly attendance report for the department
router.get("/weekly", requireAuth, requireHOD, async (req, res) => {
  try {
    const department = req.department;

    // Get weekly attendance aggregated by week
    const weeklyReport = await query(
      `WITH weekly_sessions AS (
        SELECT 
          DATE_TRUNC('week', s.start_time) AS week_start,
          DATE_TRUNC('week', s.start_time) + INTERVAL '6 days' AS week_end,
          COUNT(DISTINCT s.id) AS total_sessions,
          COUNT(DISTINCT c.id) AS total_courses,
          COUNT(DISTINCT e.student_id) AS total_students,
          COUNT(DISTINCT ar.id) AS total_attendance_records
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        LEFT JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('week', s.start_time)
      ),
      weekly_attendance_percentage AS (
        SELECT 
          DATE_TRUNC('week', s.start_time) AS week_start,
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance_percentage
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            DATE_TRUNC('week', s2.start_time) AS week_start,
            COUNT(DISTINCT s2.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          JOIN campus360_dev.courses c2 ON c2.id = e2.course_id
          JOIN campus360_dev.attendance_sessions s2 ON s2.course_id = c2.id
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s2.id
          WHERE c2.department = $1
          GROUP BY e2.student_id, DATE_TRUNC('week', s2.start_time)
        ) sc ON sc.week_start = DATE_TRUNC('week', s.start_time)
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('week', s.start_time)
      )
      SELECT 
        ws.week_start::date AS week_start,
        ws.week_end::date AS week_end,
        ws.total_sessions,
        ws.total_courses,
        ws.total_students,
        ws.total_attendance_records,
        COALESCE(wap.avg_attendance_percentage, 0) AS avg_attendance_percentage
      FROM weekly_sessions ws
      LEFT JOIN weekly_attendance_percentage wap ON wap.week_start = ws.week_start
      ORDER BY ws.week_start DESC
      LIMIT 12`,
      [department]
    );

    // Get course-wise weekly breakdown
    const courseWeeklyBreakdown = await query(
      `WITH weekly_course_sessions AS (
        SELECT 
          DATE_TRUNC('week', s.start_time) AS week_start,
          c.id AS course_id,
          c.code AS course_code,
          c.name AS course_name,
          COUNT(DISTINCT s.id) AS total_sessions,
          COUNT(DISTINCT e.student_id) AS total_students,
          COUNT(DISTINCT ar.id) AS total_attendance_records
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        LEFT JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('week', s.start_time), c.id, c.code, c.name
      ),
      weekly_course_attendance AS (
        SELECT 
          DATE_TRUNC('week', s.start_time) AS week_start,
          c.id AS course_id,
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance_percentage
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            e2.course_id,
            DATE_TRUNC('week', s2.start_time) AS week_start,
            COUNT(DISTINCT s2.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          JOIN campus360_dev.attendance_sessions s2 ON s2.course_id = e2.course_id
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s2.id
          GROUP BY e2.student_id, e2.course_id, DATE_TRUNC('week', s2.start_time)
        ) sc ON sc.course_id = c.id AND sc.week_start = DATE_TRUNC('week', s.start_time)
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('week', s.start_time), c.id
      )
      SELECT 
        wcs.week_start::date AS week_start,
        wcs.course_id,
        wcs.course_code,
        wcs.course_name,
        wcs.total_sessions,
        wcs.total_students,
        wcs.total_attendance_records,
        COALESCE(wca.avg_attendance_percentage, 0) AS avg_attendance_percentage
      FROM weekly_course_sessions wcs
      LEFT JOIN weekly_course_attendance wca 
        ON wca.week_start = wcs.week_start AND wca.course_id = wcs.course_id
      ORDER BY wcs.week_start DESC, wcs.course_code
      LIMIT 100`,
      [department]
    );

    res.json({
      weekly: weeklyReport.rows,
      courseBreakdown: courseWeeklyBreakdown.rows,
    });
  } catch (err) {
    console.error("Weekly report error:", err);
    res.status(500).json({ message: "Failed to generate weekly report" });
  }
});

// GET /hod/reports/monthly
// Get monthly attendance report for the department
router.get("/monthly", requireAuth, requireHOD, async (req, res) => {
  try {
    const department = req.department;

    // Get monthly attendance aggregated by month
    const monthlyReport = await query(
      `WITH monthly_sessions AS (
        SELECT 
          DATE_TRUNC('month', s.start_time) AS month_start,
          COUNT(DISTINCT s.id) AS total_sessions,
          COUNT(DISTINCT c.id) AS total_courses,
          COUNT(DISTINCT e.student_id) AS total_students,
          COUNT(DISTINCT ar.id) AS total_attendance_records
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        LEFT JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('month', s.start_time)
      ),
      monthly_attendance_percentage AS (
        SELECT 
          DATE_TRUNC('month', s.start_time) AS month_start,
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance_percentage
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            DATE_TRUNC('month', s2.start_time) AS month_start,
            COUNT(DISTINCT s2.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          JOIN campus360_dev.courses c2 ON c2.id = e2.course_id
          JOIN campus360_dev.attendance_sessions s2 ON s2.course_id = c2.id
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s2.id
          WHERE c2.department = $1
          GROUP BY e2.student_id, DATE_TRUNC('month', s2.start_time)
        ) sc ON sc.month_start = DATE_TRUNC('month', s.start_time)
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('month', s.start_time)
      )
      SELECT 
        ms.month_start::date AS month_start,
        TO_CHAR(ms.month_start, 'Month YYYY') AS month_name,
        EXTRACT(YEAR FROM ms.month_start) AS year,
        EXTRACT(MONTH FROM ms.month_start) AS month,
        ms.total_sessions,
        ms.total_courses,
        ms.total_students,
        ms.total_attendance_records,
        COALESCE(map.avg_attendance_percentage, 0) AS avg_attendance_percentage
      FROM monthly_sessions ms
      LEFT JOIN monthly_attendance_percentage map ON map.month_start = ms.month_start
      ORDER BY ms.month_start DESC
      LIMIT 12`,
      [department]
    );

    // Get course-wise monthly breakdown
    const courseMonthlyBreakdown = await query(
      `WITH monthly_course_sessions AS (
        SELECT 
          DATE_TRUNC('month', s.start_time) AS month_start,
          c.id AS course_id,
          c.code AS course_code,
          c.name AS course_name,
          COUNT(DISTINCT s.id) AS total_sessions,
          COUNT(DISTINCT e.student_id) AS total_students,
          COUNT(DISTINCT ar.id) AS total_attendance_records
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        LEFT JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('month', s.start_time), c.id, c.code, c.name
      ),
      monthly_course_attendance AS (
        SELECT 
          DATE_TRUNC('month', s.start_time) AS month_start,
          c.id AS course_id,
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance_percentage
        FROM campus360_dev.attendance_sessions s
        JOIN campus360_dev.courses c ON c.id = s.course_id
        JOIN campus360_dev.enrollments e ON e.course_id = c.id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            e2.course_id,
            DATE_TRUNC('month', s2.start_time) AS month_start,
            COUNT(DISTINCT s2.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          JOIN campus360_dev.attendance_sessions s2 ON s2.course_id = e2.course_id
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s2.id
          GROUP BY e2.student_id, e2.course_id, DATE_TRUNC('month', s2.start_time)
        ) sc ON sc.course_id = c.id AND sc.month_start = DATE_TRUNC('month', s.start_time)
        WHERE c.department = $1
        GROUP BY DATE_TRUNC('month', s.start_time), c.id
      )
      SELECT 
        mcs.month_start::date AS month_start,
        TO_CHAR(mcs.month_start, 'Month YYYY') AS month_name,
        mcs.course_id,
        mcs.course_code,
        mcs.course_name,
        mcs.total_sessions,
        mcs.total_students,
        mcs.total_attendance_records,
        COALESCE(mca.avg_attendance_percentage, 0) AS avg_attendance_percentage
      FROM monthly_course_sessions mcs
      LEFT JOIN monthly_course_attendance mca 
        ON mca.month_start = mcs.month_start AND mca.course_id = mcs.course_id
      ORDER BY mcs.month_start DESC, mcs.course_code
      LIMIT 100`,
      [department]
    );

    res.json({
      monthly: monthlyReport.rows,
      courseBreakdown: courseMonthlyBreakdown.rows,
    });
  } catch (err) {
    console.error("Monthly report error:", err);
    res.status(500).json({ message: "Failed to generate monthly report" });
  }
});

export default router;

