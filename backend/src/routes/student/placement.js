// src/routes/student/placement.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// Get all placement posts
router.get("/posts", requireAuth, async (req, res) => {
  try {
    const { type, company, active } = req.query;
    let sql = `SELECT * FROM campus360_dev.placement_posts WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      sql += ` AND job_type = $${paramCount}`;
      params.push(type);
    }

    if (company) {
      paramCount++;
      sql += ` AND company_name ILIKE $${paramCount}`;
      params.push(`%${company}%`);
    }

    if (active) {
      sql += ` AND deadline > NOW()`;
    }

    sql += ` ORDER BY created_at DESC`;

    const r = await query(sql, params);
    res.json({ posts: r.rows });
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
      `SELECT pa.*, p.title, p.company_name, p.job_type 
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

export default router;
