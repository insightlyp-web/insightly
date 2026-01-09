// src/routes/student/placement.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// Get all placement posts (filtered by eligibility criteria)
router.get("/posts", requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, company, active } = req.query;
    
    // Get student profile for eligibility check
    const studentProfile = await query(
      `SELECT department, gpa, student_year, academic_year 
       FROM campus360_dev.profiles 
       WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentProfile.rows.length === 0) {
      return res.status(403).json({ message: "Student profile not found" });
    }

    const student = studentProfile.rows[0];
    const studentDept = student.department;
    const studentGPA = student.gpa || 0;
    // Convert student_year from 'I', 'II', 'III', 'IV' to 1, 2, 3, 4
    const yearMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
    const studentYear = student.student_year ? yearMap[student.student_year] : null;

    let sql = `SELECT * FROM campus360_dev.placement_posts WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    // Filter by active status
    // Default to showing active posts if active filter is not explicitly "0"
    if (active && active !== "0") {
      sql += ` AND (active = true OR active IS NULL) AND (deadline IS NULL OR deadline > NOW())`;
    } else if (active === "0") {
      // Show all posts (active and inactive) when active=0
      // No additional filter
    } else {
      // Default: show active posts
      sql += ` AND (active = true OR active IS NULL) AND (deadline IS NULL OR deadline > NOW())`;
    }

    // Filter by type
    if (type) {
      paramCount++;
      sql += ` AND job_type = $${paramCount}`;
      params.push(type);
    }

    // Filter by company
    if (company) {
      paramCount++;
      sql += ` AND company_name ILIKE $${paramCount}`;
      params.push(`%${company}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    const r = await query(sql, params);
    
    console.log(`[placement-posts] Found ${r.rows.length} total posts for student ${studentId}`);
    console.log(`[placement-posts] Student dept: ${studentDept}, GPA: ${studentGPA}, Year: ${studentYear}`);
    
    // Filter by eligibility criteria
    const eligiblePosts = r.rows.filter(post => {
      // Check department eligibility
      if (post.eligible_departments && Array.isArray(post.eligible_departments) && post.eligible_departments.length > 0) {
        if (!post.eligible_departments.includes(studentDept)) {
          console.log(`[placement-posts] Post ${post.id} filtered: department mismatch (${post.eligible_departments} vs ${studentDept})`);
          return false;
        }
      }

      // Check GPA eligibility (only if student has GPA and post requires it)
      if (post.min_gpa && studentGPA > 0 && studentGPA < post.min_gpa) {
        console.log(`[placement-posts] Post ${post.id} filtered: GPA too low (${studentGPA} < ${post.min_gpa})`);
        return false;
      }

      // Check year eligibility (only if student has year and post requires it)
      if (studentYear !== null) {
        if (post.min_year && studentYear < post.min_year) {
          console.log(`[placement-posts] Post ${post.id} filtered: year too low (${studentYear} < ${post.min_year})`);
          return false;
        }
        if (post.max_year && studentYear > post.max_year) {
          console.log(`[placement-posts] Post ${post.id} filtered: year too high (${studentYear} > ${post.max_year})`);
          return false;
        }
      }

      return true;
    });

    console.log(`[placement-posts] Returning ${eligiblePosts.length} eligible posts`);
    res.json({ posts: eligiblePosts });
  } catch (err) {
    console.error("placement posts error:", err);
    res.status(500).json({ message: "Failed to fetch job posts" });
  }
});

// Apply to placement
router.post("/apply", requireAuth, async (req, res) => {
  const { post_id, resume_url } = req.body;
  const student_id = req.user.id;

  if (!post_id || !resume_url)
    return res.status(400).json({ message: "post_id & resume_url required" });

  try {
    await query(
      `INSERT INTO campus360_dev.placement_applications 
       (post_id, student_id, resume_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, student_id) DO NOTHING`,
      [post_id, student_id, resume_url]
    );

    res.json({ message: "Applied successfully" });
  } catch (err) {
    console.error("apply placement error:", err);
    res.status(500).json({ message: "Failed to apply" });
  }
});

// Get student's applications
router.get("/applications", requireAuth, async (req, res) => {
  const student_id = req.user.id;

  try {
    const r = await query(
      `SELECT pa.*, p.title, p.company_name, p.job_type, pa.status_history
       FROM campus360_dev.placement_applications pa
       JOIN campus360_dev.placement_posts p ON p.id = pa.post_id
       WHERE pa.student_id = $1
       ORDER BY applied_at DESC`,
      [student_id]
    );

    res.json({ applications: r.rows });
  } catch (err) {
    console.error("placement apps error:", err);
    res.status(500).json({ message: "Failed to load applications" });
  }
});

// GET /student/placement/applications/:id
// Get single application with full details and status history
router.get("/applications/:id", requireAuth, async (req, res) => {
  const student_id = req.user.id;
  const application_id = req.params.id;

  try {
    const r = await query(
      `SELECT pa.*, p.title, p.company_name, p.job_type, p.description, pa.status_history
       FROM campus360_dev.placement_applications pa
       JOIN campus360_dev.placement_posts p ON p.id = pa.post_id
       WHERE pa.id = $1 AND pa.student_id = $2`,
      [application_id, student_id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ application: r.rows[0] });
  } catch (err) {
    console.error("placement app detail error:", err);
    res.status(500).json({ message: "Failed to load application" });
  }
});

export default router;
