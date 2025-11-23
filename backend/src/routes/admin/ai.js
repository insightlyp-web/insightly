// src/routes/admin/ai.js
// AI routes for admin - forwards to ML service
import express from "express";
import axios from "axios";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// GET /admin/ai/placement/success - Predict placement success rates
router.get("/placement/success", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get all students with applications
    const studentsResult = await query(
      `SELECT DISTINCT p.id, p.full_name, p.department, p.student_year,
              p.resume_json, COUNT(pa.id) as application_count
       FROM campus360_dev.profiles p
       INNER JOIN campus360_dev.placement_applications pa ON pa.student_id = p.id
       WHERE p.role = 'student'
       GROUP BY p.id, p.full_name, p.department, p.student_year, p.resume_json`
    );

    const predictions = [];

    for (const student of studentsResult.rows) {
      const resumeData = student.resume_json || {};
      const skillsCount = (resumeData.skills || []).length;

      // Get attendance
      const attendanceResult = await query(
        `SELECT 
          COUNT(DISTINCT asess.id) as total_sessions,
          COUNT(DISTINCT ar.id) as attended_sessions
         FROM campus360_dev.attendance_sessions asess
         LEFT JOIN campus360_dev.attendance_records ar 
           ON ar.session_id = asess.id AND ar.student_id = $1
         WHERE asess.end_time > NOW() - INTERVAL '90 days'`,
        [student.id]
      );

      const totalSessions = parseInt(attendanceResult.rows[0]?.total_sessions || 0);
      const attendedSessions = parseInt(attendanceResult.rows[0]?.attended_sessions || 0);
      const attendance = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      // Get marks
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

      const semesterMap = { I: 1, II: 2, III: 3, IV: 4 };
      const semester = semesterMap[student.student_year] || 1;

      // Calculate success probability (simplified)
      const avgMarks = internalMarks.length > 0
        ? internalMarks.reduce((a, b) => a + b, 0) / internalMarks.length
        : 0;

      const successScore = (
        (attendance / 100) * 0.2 +
        (avgMarks / 100) * 0.3 +
        (Math.min(skillsCount, 20) / 20) * 0.3 +
        (Math.min(parseInt(student.application_count), 10) / 10) * 0.2
      ) * 100;

      predictions.push({
        student_id: student.id,
        student_name: student.full_name,
        department: student.department,
        student_year: student.student_year,
        success_probability: Math.round(successScore),
        application_count: parseInt(student.application_count),
        skills_count: skillsCount,
        attendance_percentage: Math.round(attendance),
        average_marks: Math.round(avgMarks),
      });
    }

    // Sort by success probability
    predictions.sort((a, b) => b.success_probability - a.success_probability);

    res.json({
      predictions,
      total_students: predictions.length,
    });
  } catch (error) {
    console.error("Placement success prediction error:", error);
    res.status(500).json({
      message: "Failed to predict placement success",
      error: error.message,
    });
  }
});

// GET /admin/ai/skills/demand - Analyze skill demand vs supply
router.get("/skills/demand", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get all required skills from active posts
    const postsResult = await query(
      `SELECT required_skills FROM campus360_dev.placement_posts
       WHERE deadline IS NULL OR deadline > NOW()`
    );

    // Count skill demand
    const skillDemand = {};
    for (const post of postsResult.rows) {
      const skills = post.required_skills || [];
      for (const skill of skills) {
        skillDemand[skill.toLowerCase()] = (skillDemand[skill.toLowerCase()] || 0) + 1;
      }
    }

    // Get all student skills
    const studentsResult = await query(
      `SELECT resume_json FROM campus360_dev.profiles
       WHERE role = 'student' AND resume_json IS NOT NULL`
    );

    const skillSupply = {};
    for (const student of studentsResult.rows) {
      const resumeData = student.resume_json || {};
      const skills = resumeData.skills || [];
      for (const skill of skills) {
        skillSupply[skill.toLowerCase()] = (skillSupply[skill.toLowerCase()] || 0) + 1;
      }
    }

    // Calculate gap
    const allSkills = new Set([...Object.keys(skillDemand), ...Object.keys(skillSupply)]);
    const skillAnalysis = [];

    for (const skill of allSkills) {
      const demand = skillDemand[skill] || 0;
      const supply = skillSupply[skill] || 0;
      const gap = demand - supply;
      const gap_percentage = demand > 0 ? ((gap / demand) * 100) : 0;

      skillAnalysis.push({
        skill: skill,
        demand: demand,
        supply: supply,
        gap: gap,
        gap_percentage: Math.round(gap_percentage),
      });
    }

    // Sort by gap (highest gap first)
    skillAnalysis.sort((a, b) => b.gap - a.gap);

    res.json({
      skill_analysis: skillAnalysis,
      total_posts: postsResult.rows.length,
      total_students: studentsResult.rows.length,
    });
  } catch (error) {
    console.error("Skill demand analysis error:", error);
    res.status(500).json({
      message: "Failed to analyze skill demand",
      error: error.message,
    });
  }
});

// GET /admin/ai/company/skills - Company vs Skills heatmap data
router.get("/company/skills", requireAuth, requireAdmin, async (req, res) => {
  try {
    const postsResult = await query(
      `SELECT company_name, required_skills
       FROM campus360_dev.placement_posts
       WHERE deadline IS NULL OR deadline > NOW()`
    );

    const companySkills = {};

    for (const post of postsResult.rows) {
      const company = post.company_name;
      const skills = post.required_skills || [];

      if (!companySkills[company]) {
        companySkills[company] = {};
      }

      for (const skill of skills) {
        companySkills[company][skill] = (companySkills[company][skill] || 0) + 1;
      }
    }

    // Convert to array format for heatmap
    const companies = Object.keys(companySkills);
    const allSkills = new Set();
    companies.forEach((company) => {
      Object.keys(companySkills[company]).forEach((skill) => allSkills.add(skill));
    });

    const heatmapData = [];
    for (const company of companies) {
      for (const skill of allSkills) {
        const count = companySkills[company][skill] || 0;
        if (count > 0) {
          heatmapData.push({
            company,
            skill,
            count,
          });
        }
      }
    }

    res.json({
      heatmap_data: heatmapData,
      companies: companies,
      skills: Array.from(allSkills),
    });
  } catch (error) {
    console.error("Company skills analysis error:", error);
    res.status(500).json({
      message: "Failed to analyze company skills",
      error: error.message,
    });
  }
});

export default router;

