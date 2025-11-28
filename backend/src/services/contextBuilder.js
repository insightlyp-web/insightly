// src/services/contextBuilder.js
import { query } from "../config/db.js";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Build context for student role
 */
export async function buildStudentContext(userId) {
  const context = {
    attendance: null,
    timetable: null,
    courses: null,
    placement: null,
    marks: null,
  };

  try {
    // Get attendance summary
    const attendanceRes = await query(
      `SELECT 
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT ar.id) AS attended_sessions,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN ROUND((COUNT(DISTINCT ar.id)::numeric / COUNT(DISTINCT s.id)::numeric) * 100, 2)
          ELSE 0 
        END AS attendance_percentage
      FROM campus360_dev.enrollments e
      JOIN campus360_dev.courses c ON c.id = e.course_id
      LEFT JOIN campus360_dev.attendance_sessions s ON s.course_id = c.id
      LEFT JOIN campus360_dev.attendance_records ar ON ar.student_id = e.student_id AND ar.session_id = s.id
      WHERE e.student_id = $1`,
      [userId]
    );
    context.attendance = attendanceRes.rows[0] || null;

    // Get today's timetable
    const today = new Date().toLocaleString("en-US", { weekday: "short" });
    const timetableRes = await query(
      `SELECT t.*, c.code AS course_code, c.name AS course_name, p.full_name AS faculty_name
       FROM campus360_dev.timetable t
       JOIN campus360_dev.courses c ON c.id = t.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id = t.faculty_id
       WHERE c.department = (SELECT department FROM campus360_dev.profiles WHERE id = $1)
       AND t.day_of_week = $2
       ORDER BY t.start_time`,
      [userId, today]
    );
    context.timetable = timetableRes.rows;

    // Get enrolled courses
    const coursesRes = await query(
      `SELECT c.id, c.code, c.name, c.year, p.full_name AS faculty_name
       FROM campus360_dev.enrollments e
       JOIN campus360_dev.courses c ON c.id = e.course_id
       LEFT JOIN campus360_dev.profiles p ON p.id = c.faculty_id
       WHERE e.student_id = $1`,
      [userId]
    );
    context.courses = coursesRes.rows;

    // Get recent placement posts
    const placementRes = await query(
      `SELECT id, company_name, title, created_at
       FROM campus360_dev.placement_posts
       WHERE active = true
       ORDER BY created_at DESC
       LIMIT 5`,
      []
    );
    context.placement = placementRes.rows;
  } catch (error) {
    console.error("Error building student context:", error);
  }

  return context;
}

/**
 * Build context for faculty role
 */
export async function buildFacultyContext(userId) {
  const context = {
    courses: null,
    sessions: null,
    students: null,
  };

  try {
    // Get assigned courses
    const coursesRes = await query(
      `SELECT c.id, c.code, c.name, c.year, c.academic_year, c.semester
       FROM campus360_dev.courses c
       WHERE c.faculty_id = $1`,
      [userId]
    );
    context.courses = coursesRes.rows;

    // Get recent sessions
    const sessionsRes = await query(
      `SELECT s.id, s.session_code, s.start_time, c.code AS course_code, c.name AS course_name,
              COUNT(DISTINCT ar.id) AS attendance_count
       FROM campus360_dev.attendance_sessions s
       JOIN campus360_dev.courses c ON c.id = s.course_id
       LEFT JOIN campus360_dev.attendance_records ar ON ar.session_id = s.id
       WHERE s.faculty_id = $1
       ORDER BY s.start_time DESC
       LIMIT 10`,
      [userId]
    );
    context.sessions = sessionsRes.rows;

    // Get total students across courses
    const studentsRes = await query(
      `SELECT COUNT(DISTINCT e.student_id) AS total_students
       FROM campus360_dev.courses c
       JOIN campus360_dev.enrollments e ON e.course_id = c.id
       WHERE c.faculty_id = $1`,
      [userId]
    );
    context.students = studentsRes.rows[0]?.total_students || 0;
  } catch (error) {
    console.error("Error building faculty context:", error);
  }

  return context;
}

/**
 * Build context for HOD role
 */
export async function buildHODContext(userId) {
  const context = {
    department: null,
    students: null,
    faculty: null,
    courses: null,
    attendance: null,
  };

  try {
    // Get department
    const deptRes = await query(
      `SELECT department FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );
    context.department = deptRes.rows[0]?.department || null;

    if (context.department) {
      // Get student count
      const studentsRes = await query(
        `SELECT COUNT(*) AS count FROM campus360_dev.profiles 
         WHERE department = $1 AND role = 'student'`,
        [context.department]
      );
      context.students = studentsRes.rows[0]?.count || 0;

      // Get faculty count
      const facultyRes = await query(
        `SELECT COUNT(*) AS count FROM campus360_dev.profiles 
         WHERE department = $1 AND role = 'faculty'`,
        [context.department]
      );
      context.faculty = facultyRes.rows[0]?.count || 0;

      // Get courses count
      const coursesRes = await query(
        `SELECT COUNT(*) AS count FROM campus360_dev.courses 
         WHERE department = $1`,
        [context.department]
      );
      context.courses = coursesRes.rows[0]?.count || 0;

      // Get overall attendance
      const attendanceRes = await query(
        `SELECT 
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance
        FROM campus360_dev.enrollments e
        JOIN campus360_dev.courses c ON c.id = e.course_id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            COUNT(DISTINCT s2.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          JOIN campus360_dev.courses c2 ON c2.id = e2.course_id
          JOIN campus360_dev.attendance_sessions s2 ON s2.course_id = c2.id
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s2.id
          WHERE c2.department = $1
          GROUP BY e2.student_id
        ) sc ON sc.student_id = e.student_id
        WHERE c.department = $1`,
        [context.department]
      );
      context.attendance = attendanceRes.rows[0]?.avg_attendance || 0;
    }
  } catch (error) {
    console.error("Error building HOD context:", error);
  }

  return context;
}

/**
 * Build formatted context string for LLM
 */
export function formatContext(context, role, intent) {
  let contextStr = `User Role: ${role}\n\n`;

  if (role === "student") {
    if (intent === "ATTENDANCE" || intent === "RISK_PREDICTION" || intent === "FORECAST") {
      if (context.attendance) {
        contextStr += `Attendance Summary:
- Total Sessions: ${context.attendance.total_sessions || 0}
- Attended Sessions: ${context.attendance.attended_sessions || 0}
- Attendance Percentage: ${context.attendance.attendance_percentage || 0}%
- Required: 75% minimum\n\n`;
      }
    }

    if (intent === "TIMETABLE") {
      if (context.timetable && context.timetable.length > 0) {
        contextStr += `Today's Timetable:\n`;
        context.timetable.forEach((t) => {
          contextStr += `- ${t.course_code} (${t.course_name}): ${t.start_time} - ${t.end_time} with ${t.faculty_name || "TBA"}\n`;
        });
        contextStr += "\n";
      } else {
        contextStr += "No classes scheduled for today.\n\n";
      }
    }

    if (intent === "PLACEMENT") {
      if (context.placement && context.placement.length > 0) {
        contextStr += `Recent Placement Posts:\n`;
        context.placement.forEach((p) => {
          contextStr += `- ${p.company_name}: ${p.title}\n`;
        });
        contextStr += "\n";
      }
    }

    if (intent === "MARKS") {
      contextStr += "Marks information is available in the dashboard.\n\n";
    }
  } else if (role === "faculty") {
    if (context.courses) {
      contextStr += `Assigned Courses: ${context.courses.length}\n`;
      context.courses.forEach((c) => {
        contextStr += `- ${c.code}: ${c.name}\n`;
      });
      contextStr += "\n";
    }
    if (context.students) {
      contextStr += `Total Students: ${context.students}\n\n`;
    }
  } else if (role === "hod") {
    contextStr += `Department: ${context.department || "N/A"}\n`;
    contextStr += `Students: ${context.students || 0}\n`;
    contextStr += `Faculty: ${context.faculty || 0}\n`;
    contextStr += `Courses: ${context.courses || 0}\n`;
    if (context.attendance) {
      contextStr += `Average Attendance: ${parseFloat(context.attendance).toFixed(2)}%\n`;
    }
    contextStr += "\n";
  }

  return contextStr;
}

/**
 * Get risk prediction from ML service
 */
export async function getRiskPrediction(userId) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-risk`, {
      student_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error("ML service error (risk prediction):", error.message);
    return null;
  }
}

/**
 * Get attendance forecast from ML service
 */
export async function getAttendanceForecast(userId) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/forecast-attendance`, {
      student_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error("ML service error (forecast):", error.message);
    return null;
  }
}

