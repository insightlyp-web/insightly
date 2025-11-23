// src/routes/faculty/ai.js
// AI routes for faculty - forwards to ML service
import express from "express";
import axios from "axios";
import { requireAuth } from "../../middleware/auth.js";
import { requireFaculty } from "../../middleware/facultyCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// GET /faculty/ai/attendance/anomaly?course_id=UUID - Get attendance anomalies for a course
router.get("/attendance/anomaly", requireAuth, requireFaculty, async (req, res) => {
  try {
    const { course_id } = req.query;
    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Get all students enrolled in the course
    const studentsResult = await query(
      `SELECT p.id, p.full_name, p.email
       FROM campus360_dev.profiles p
       INNER JOIN campus360_dev.enrollments e ON e.student_id = p.id
       WHERE e.course_id = $1 AND p.role = 'student'`,
      [course_id]
    );

    const students = studentsResult.rows;
    const anomalies = [];

    // For each student, get attendance records and detect anomalies
    for (const student of students) {
      const attendanceResult = await query(
        `SELECT ar.timestamp::date as date, 
                CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as status
         FROM (
           SELECT DISTINCT timestamp::date as date
           FROM campus360_dev.attendance_sessions
           WHERE course_id = $1 AND end_time > NOW() - INTERVAL '90 days'
         ) dates
         LEFT JOIN campus360_dev.attendance_records ar 
           ON ar.timestamp::date = dates.date 
           AND ar.student_id = $2
         ORDER BY dates.date DESC
         LIMIT 90`,
        [course_id, student.id]
      );

      const records = attendanceResult.rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        status: row.status,
      }));

      if (records.length > 0) {
        try {
          const mlResponse = await axios.post(
            `${ML_SERVICE_URL}/ai/attendance/anomaly`,
            { records },
            { timeout: 10000 }
          );

          if (mlResponse.data.pattern === "at-risk" || mlResponse.data.pattern === "inconsistent") {
            anomalies.push({
              student_id: student.id,
              student_name: student.full_name,
              student_email: student.email,
              ...mlResponse.data,
            });
          }
        } catch (error) {
          console.error(`Error analyzing attendance for student ${student.id}:`, error);
        }
      }
    }

    res.json({
      anomalies,
      total_students: students.length,
      students_with_anomalies: anomalies.length,
    });
  } catch (error) {
    console.error("Attendance anomaly detection error:", error);
    res.status(500).json({
      message: "Failed to detect anomalies",
      error: error.message,
    });
  }
});

// GET /faculty/ai/students/at-risk?course_id=UUID - Get at-risk students for a course
router.get("/students/at-risk", requireAuth, requireFaculty, async (req, res) => {
  try {
    const { course_id } = req.query;
    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Get all students enrolled in the course
    const studentsResult = await query(
      `SELECT p.id, p.full_name, p.email, p.student_year
       FROM campus360_dev.profiles p
       INNER JOIN campus360_dev.enrollments e ON e.student_id = p.id
       WHERE e.course_id = $1 AND p.role = 'student'`,
      [course_id]
    );

    const students = studentsResult.rows;
    const atRiskStudents = [];

    // For each student, calculate risk
    for (const student of students) {
      // Get attendance percentage
      const attendanceResult = await query(
        `SELECT 
          COUNT(DISTINCT asess.id) as total_sessions,
          COUNT(DISTINCT ar.id) as attended_sessions
         FROM campus360_dev.attendance_sessions asess
         LEFT JOIN campus360_dev.attendance_records ar 
           ON ar.session_id = asess.id AND ar.student_id = $1
         WHERE asess.course_id = $2 
           AND asess.end_time > NOW() - INTERVAL '90 days'`,
        [student.id, course_id]
      );

      const totalSessions = parseInt(attendanceResult.rows[0]?.total_sessions || 0);
      const attendedSessions = parseInt(attendanceResult.rows[0]?.attended_sessions || 0);
      const attendance = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      // Get internal marks for this course
      const marksResult = await query(
        `SELECT am.marks_obtained, a.max_marks
         FROM campus360_dev.assessment_marks am
         INNER JOIN campus360_dev.assessments a ON a.id = am.assessment_id
         WHERE am.student_id = $1 AND a.course_id = $2`,
        [student.id, course_id]
      );

      const internalMarks = marksResult.rows.map(
        (row) => (row.marks_obtained / row.max_marks) * 100
      );

      // Get skills count from resume
      const resumeResult = await query(
        `SELECT resume_json FROM campus360_dev.profiles WHERE id = $1`,
        [student.id]
      );
      const resumeData = resumeResult.rows[0]?.resume_json || {};
      const skillsCount = (resumeData.skills || []).length;

      // Get applications count
      const appsResult = await query(
        `SELECT COUNT(*) as count FROM campus360_dev.placement_applications WHERE student_id = $1`,
        [student.id]
      );
      const applicationsCount = parseInt(appsResult.rows[0]?.count || 0);

      // Determine semester from student_year
      const semesterMap = { I: 1, II: 2, III: 3, IV: 4 };
      const semester = semesterMap[student.student_year] || 1;

      // Call ML service
      try {
        const mlResponse = await axios.post(
          `${ML_SERVICE_URL}/ai/risk/predict`,
          {
            attendance,
            internal_marks: internalMarks,
            skills_count: skillsCount,
            applications_count: applicationsCount,
            semester,
          },
          { timeout: 10000 }
        );

        if (mlResponse.data.risk_level !== "low") {
          atRiskStudents.push({
            student_id: student.id,
            student_name: student.full_name,
            student_email: student.email,
            ...mlResponse.data,
            attendance_percentage: attendance,
          });
        }
      } catch (error) {
        console.error(`Error predicting risk for student ${student.id}:`, error);
      }
    }

    // Sort by risk level (high -> medium -> low)
    const riskOrder = { high: 3, medium: 2, low: 1 };
    atRiskStudents.sort((a, b) => riskOrder[b.risk_level] - riskOrder[a.risk_level]);

    res.json({
      at_risk_students: atRiskStudents,
      total_students: students.length,
      at_risk_count: atRiskStudents.length,
    });
  } catch (error) {
    console.error("At-risk student prediction error:", error);
    res.status(500).json({
      message: "Failed to predict at-risk students",
      error: error.message,
    });
  }
});

export default router;

