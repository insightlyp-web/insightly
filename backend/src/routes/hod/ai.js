// src/routes/hod/ai.js
// AI routes for HOD - forwards to ML service
import express from "express";
import axios from "axios";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// GET /hod/ai/risk - Get all at-risk students in the department
router.get("/risk", requireAuth, requireHOD, async (req, res) => {
  try {
    const hodDepartment = req.hodProfile.department;

    // Get all students in the department
    const studentsResult = await query(
      `SELECT id, full_name, email, student_year, academic_year
       FROM campus360_dev.profiles
       WHERE role = 'student' AND department = $1`,
      [hodDepartment]
    );

    const students = studentsResult.rows;
    const atRiskStudents = [];

    // For each student, calculate risk
    for (const student of students) {
      // Get overall attendance percentage across all courses
      // Calculate weighted average across all subjects
      const attendanceResult = await query(
        `SELECT 
          c.id as course_id,
          c.code as course_code,
          COUNT(DISTINCT asess.id) as total_sessions,
          COUNT(DISTINCT ar.id) as attended_sessions
         FROM campus360_dev.enrollments e
         JOIN campus360_dev.courses c ON c.id = e.course_id
         LEFT JOIN campus360_dev.attendance_sessions asess ON asess.course_id = c.id
         LEFT JOIN campus360_dev.attendance_records ar 
           ON ar.session_id = asess.id AND ar.student_id = e.student_id
         WHERE e.student_id = $1
         GROUP BY c.id, c.code
         HAVING COUNT(DISTINCT asess.id) > 0`,
        [student.id]
      );

      // Calculate weighted average attendance across all courses
      let totalWeightedAttendance = 0;
      let totalWeight = 0;
      
      for (const course of attendanceResult.rows) {
        const totalSessions = parseInt(course.total_sessions || 0);
        const attendedSessions = parseInt(course.attended_sessions || 0);
        
        if (totalSessions > 0) {
          const courseAttendance = (attendedSessions / totalSessions) * 100;
          totalWeightedAttendance += courseAttendance * totalSessions; // Weight by number of sessions
          totalWeight += totalSessions;
        }
      }

      // Overall attendance percentage (weighted average)
      const attendance = totalWeight > 0 
        ? totalWeightedAttendance / totalWeight 
        : null; // null means insufficient data

      // Get all internal marks
      const marksResult = await query(
        `SELECT am.marks_obtained, a.max_marks
         FROM campus360_dev.assessment_marks am
         INNER JOIN campus360_dev.assessments a ON a.id = am.assessment_id
         WHERE am.student_id = $1`,
        [student.id]
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
        // Only predict risk if we have meaningful data
        // Skip if attendance is null (insufficient data) and no marks
        if (attendance === null && internalMarks.length === 0) {
          // Not enough data to make a prediction
          continue;
        }

        const mlResponse = await axios.post(
          `${ML_SERVICE_URL}/ai/risk/predict`,
          {
            attendance: attendance !== null ? attendance : 100, // Default to 100% if no data (don't penalize)
            internal_marks: internalMarks,
            skills_count: skillsCount,
            applications_count: applicationsCount,
            semester,
          },
          { timeout: 10000 }
        );

        // Only include students with medium or high risk (filter out low risk)
        const riskLevel = mlResponse.data.risk_level;
        if (riskLevel === "medium" || riskLevel === "high") {
          atRiskStudents.push({
            student_id: student.id,
            student_name: student.full_name,
            student_email: student.email,
            student_year: student.student_year,
            academic_year: student.academic_year,
            ...mlResponse.data,
            attendance_percentage: attendance,
          });
        }
      } catch (error) {
        // Log error but don't fail the entire request
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn(`ML service unavailable for student ${student.id}, skipping...`);
        } else {
          console.error(`Error predicting risk for student ${student.id}:`, error.message);
        }
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
    // Return empty results if ML service is unavailable, don't fail completely
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      res.json({
        at_risk_students: [],
        total_students: 0,
        at_risk_count: 0,
        message: "ML service is currently unavailable. Please try again later.",
      });
    } else {
      res.status(500).json({
        message: "Failed to predict at-risk students",
        error: error.message,
      });
    }
  }
});

// GET /hod/ai/skills/gap - Get skill gap distribution across department
router.get("/skills/gap", requireAuth, requireHOD, async (req, res) => {
  try {
    const hodDepartment = req.hodProfile.department;

    // Get all active placement posts
    const postsResult = await query(
      `SELECT id, title, company_name, required_skills
       FROM campus360_dev.placement_posts
       WHERE deadline IS NULL OR deadline > NOW()`
    );

    // Get all students in the department
    const studentsResult = await query(
      `SELECT id, full_name, resume_json
       FROM campus360_dev.profiles
       WHERE role = 'student' AND department = $1`,
      [hodDepartment]
    );

    const students = studentsResult.rows;
    const skillGapData = [];

    // For each post, calculate average skill gap for department students
    for (const post of postsResult.rows) {
      const requiredSkills = post.required_skills || [];
      if (requiredSkills.length === 0) continue;

      let totalMatchPercentage = 0;
      let studentCount = 0;

      for (const student of students) {
        const resumeData = student.resume_json || {};
        const studentSkills = resumeData.skills || [];

        if (studentSkills.length > 0) {
          try {
            const mlResponse = await axios.post(
              `${ML_SERVICE_URL}/ai/skills/gap`,
              {
                student_skills: studentSkills,
                required_skills: requiredSkills,
              },
              { timeout: 5000 }
            );

            totalMatchPercentage += mlResponse.data.match_percentage;
            studentCount++;
          } catch (error) {
            // Log error but don't fail the entire request
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
              console.warn(`ML service unavailable for student ${student.id}, skipping...`);
            } else {
              console.error(`Error analyzing skill gap for student ${student.id}:`, error.message);
            }
          }
        }
      }

      if (studentCount > 0) {
        skillGapData.push({
          post_id: post.id,
          post_title: post.title,
          company_name: post.company_name,
          required_skills: requiredSkills,
          average_match_percentage: totalMatchPercentage / studentCount,
          students_analyzed: studentCount,
        });
      }
    }

    res.json({
      skill_gap_distribution: skillGapData,
      total_posts: postsResult.rows.length,
      total_students: students.length,
    });
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    // Return empty results if ML service is unavailable, don't fail completely
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      res.json({
        skill_gap_distribution: [],
        total_posts: 0,
        total_students: 0,
        message: "ML service is currently unavailable. Please try again later.",
      });
    } else {
      res.status(500).json({
        message: "Failed to analyze skill gaps",
        error: error.message,
      });
    }
  }
});

export default router;

