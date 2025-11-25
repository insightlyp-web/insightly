// src/routes/student/ai.js
// AI routes for students - forwards to ML service
import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { requireAuth } from "../../middleware/auth.js";
import { requireStudent } from "../../middleware/studentCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Configure multer for file uploads (in-memory storage for ML service, but we'll also save to disk)
const upload = multer({ storage: multer.memoryStorage() });

// POST /student/ai/resume/analyze - Analyze resume PDF
router.post("/resume/analyze", requireAuth, requireStudent, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Forward to ML service using form-data
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname || "resume.pdf",
      contentType: "application/pdf",
    });

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ai/resume/parse`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      }
    );

    const parsedData = mlResponse.data;

    // Store only parsed data (not the file)
    const studentId = req.studentProfile.id;
    await query(
      `UPDATE campus360_dev.profiles 
       SET resume_json = $1 
       WHERE id = $2`,
      [JSON.stringify(parsedData), studentId]
    );

    res.json({
      message: "Resume analyzed successfully",
      data: parsedData,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        message: "ML service error",
        error: error.response.data,
      });
    }
    res.status(500).json({
      message: "Failed to analyze resume",
      error: error.message,
    });
  }
});

// GET /student/ai/skills/gap?post_id=UUID - Get skill gap analysis for a placement post
router.get("/skills/gap", requireAuth, requireStudent, async (req, res) => {
  try {
    const { post_id } = req.query;
    if (!post_id) {
      return res.status(400).json({ message: "post_id is required" });
    }

    const studentId = req.studentProfile.id;

    // Get student skills from resume_json
    const studentProfile = await query(
      `SELECT resume_json FROM campus360_dev.profiles WHERE id = $1`,
      [studentId]
    );

    const resumeData = studentProfile.rows[0]?.resume_json || {};
    const studentSkills = resumeData.skills || [];

    // Get placement post required skills
    const postResult = await query(
      `SELECT required_skills FROM campus360_dev.placement_posts WHERE id = $1`,
      [post_id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: "Placement post not found" });
    }

    const requiredSkills = postResult.rows[0].required_skills || [];

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ai/skills/gap`,
      {
        student_skills: studentSkills,
        required_skills: requiredSkills,
      },
      { timeout: 10000 }
    );

    res.json(mlResponse.data);
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        message: "ML service error",
        error: error.response.data,
      });
    }
    res.status(500).json({
      message: "Failed to analyze skill gap",
      error: error.message,
    });
  }
});

// GET /student/ai/placement/recommended - Get recommended placement posts
router.get("/placement/recommended", requireAuth, requireStudent, async (req, res) => {
  try {
    const studentId = req.studentProfile.id;

    // Get student skills from resume_json
    const studentProfile = await query(
      `SELECT resume_json FROM campus360_dev.profiles WHERE id = $1`,
      [studentId]
    );

    const resumeData = studentProfile.rows[0]?.resume_json || {};
    const studentSkills = resumeData.skills || [];

    // Get all active placement posts
    const postsResult = await query(
      `SELECT id, title, company_name, required_skills, deadline
       FROM campus360_dev.placement_posts
       WHERE deadline IS NULL OR deadline > NOW()
       ORDER BY created_at DESC`
    );

    const posts = postsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      company: row.company_name,
      required_skills: row.required_skills || [],
    }));

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ai/recommend/placements`,
      {
        skills: studentSkills,
        posts: posts,
      },
      { timeout: 15000 }
    );

    // Get full post details for recommended posts
    const recommendations = mlResponse.data;
    const recommendedPosts = await Promise.all(
      recommendations.slice(0, 10).map(async (rec) => {
        const postResult = await query(
          `SELECT id, title, company_name, job_type, package, required_skills, 
                  deadline, description, created_at
           FROM campus360_dev.placement_posts
           WHERE id = $1`,
          [rec.post_id]
        );
        return {
          ...postResult.rows[0],
          recommendation_score: rec.score,
          matched_skills_count: rec.matched_skills_count,
          total_required_skills: rec.total_required_skills,
        };
      })
    );

    res.json({
      recommendations: recommendedPosts,
    });
  } catch (error) {
    console.error("Placement recommendation error:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        message: "ML service error",
        error: error.response.data,
      });
    }
    res.status(500).json({
      message: "Failed to get recommendations",
      error: error.message,
    });
  }
});

// POST /student/ai/resume/save - Save resume PDF file
router.post("/resume/save", requireAuth, requireStudent, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const studentId = req.studentProfile.id;
    
    // Save PDF file to disk
    const uniqueFilename = `resume_${studentId}_${Date.now()}.pdf`;
    const resumesDir = path.join("uploads", "resumes");
    
    // Create resumes directory if it doesn't exist
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }
    
    const filePath = path.join(resumesDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Delete old resume if exists
    const oldResume = await query(
      `SELECT resume_url FROM campus360_dev.profiles WHERE id = $1`,
      [studentId]
    );
    
    if (oldResume.rows[0]?.resume_url && fs.existsSync(oldResume.rows[0].resume_url)) {
      try {
        fs.unlinkSync(oldResume.rows[0].resume_url);
      } catch (err) {
        console.warn("Failed to delete old resume:", err);
      }
    }

    // Store file path in database
    await query(
      `UPDATE campus360_dev.profiles 
       SET resume_url = $1 
       WHERE id = $2`,
      [filePath, studentId]
    );

    res.json({
      message: "Resume saved successfully",
      resume_url: filePath,
    });
  } catch (error) {
    console.error("Resume save error:", error);
    res.status(500).json({
      message: "Failed to save resume",
      error: error.message,
    });
  }
});

// GET /student/ai/attendance/anomaly - Get attendance anomaly analysis
router.get("/attendance/anomaly", requireAuth, requireStudent, async (req, res) => {
  try {
    const studentId = req.studentProfile.id;

    // Get attendance records
    const attendanceResult = await query(
      `SELECT dates.date, 
              CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as status
       FROM (
         SELECT DISTINCT start_time::date as date
         FROM campus360_dev.attendance_sessions
         WHERE end_time > NOW() - INTERVAL '90 days'
       ) dates
       LEFT JOIN campus360_dev.attendance_records ar 
         ON ar.timestamp::date = dates.date 
         AND ar.student_id = $1
       ORDER BY dates.date DESC
       LIMIT 90`,
      [studentId]
    );

    const records = attendanceResult.rows.map((row) => ({
      date: row.date.toISOString().split("T")[0],
      status: row.status,
    }));

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/ai/attendance/anomaly`,
      { records },
      { timeout: 10000 }
    );

    res.json(mlResponse.data);
  } catch (error) {
    console.error("Attendance anomaly detection error:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        message: "ML service error",
        error: error.response.data,
      });
    }
    res.status(500).json({
      message: "Failed to detect anomalies",
      error: error.message,
    });
  }
});

export default router;

