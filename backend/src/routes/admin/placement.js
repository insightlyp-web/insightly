// src/routes/admin/placement.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /admin/placement/posts
// Optional filters: ?company=...&type=internship|fulltime&active=1
router.get("/posts", requireAuth, requireAdmin, async (req, res) => {
  const { company, type, active } = req.query;
  let where = [];
  let params = [];
  let i = 1;

  if (company) {
    where.push(`company_name ILIKE $${i++}`);
    params.push(`%${company}%`);
  }
  if (type) {
    where.push(`job_type = $${i++}`);
    params.push(type);
  }
  if (active) {
    where.push(`deadline > now()`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const r = await query(
      `SELECT id, title, company_name, job_type, package, stipend, required_skills, deadline, description, eligible_departments, created_at
       FROM campus360_dev.placement_posts
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );
    res.json({ posts: r.rows });
  } catch (err) {
    console.error("Admin list posts error:", err);
    res.status(500).json({ message: "Failed to list placement posts" });
  }
});

// POST /admin/placement/posts
// Body: { title, company_name, job_type, package, stipend, required_skills, deadline, description, eligible_departments, min_gpa, min_year, max_year, active }
router.post("/posts", requireAuth, requireAdmin, async (req, res) => {
  const adminId = req.adminProfile.id;
  const { 
    title, 
    company_name, 
    job_type, 
    package: pkg, 
    stipend,
    required_skills, 
    deadline, 
    description,
    eligible_departments,
    min_gpa,
    min_year,
    max_year,
    active
  } = req.body;

  if (!title || !company_name || !job_type) {
    return res.status(400).json({ message: "title, company_name, job_type required" });
  }

  try {
    const r = await query(
      `INSERT INTO campus360_dev.placement_posts
       (created_by, title, company_name, job_type, package, stipend, required_skills, deadline, description, 
        eligible_departments, min_gpa, min_year, max_year, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        adminId,
        title,
        company_name,
        job_type,
        pkg || null,
        stipend || null,
        required_skills || null,
        deadline || null,
        description || null,
        eligible_departments || null,
        min_gpa || null,
        min_year || null,
        max_year || null,
        active !== undefined ? active : true
      ]
    );

    res.json({ post: r.rows[0] });
  } catch (err) {
    console.error("Admin create post error:", err);
    res.status(500).json({ message: "Failed to create placement post" });
  }
});

// GET /admin/placement/posts/:id
// Returns post + application count
router.get("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const postId = req.params.id;
  try {
    const postRes = await query(
      `SELECT * FROM campus360_dev.placement_posts WHERE id = $1`,
      [postId]
    );
    if (postRes.rows.length === 0) {
      return res.status(404).json({ message: "Placement post not found" });
    }

    const countRes = await query(
      `SELECT COUNT(*) AS applications_count
       FROM campus360_dev.placement_applications
       WHERE post_id = $1`,
      [postId]
    );

    res.json({
      post: postRes.rows[0],
      applications_count: Number(countRes.rows[0].applications_count || 0)
    });
  } catch (err) {
    console.error("Admin get post error:", err);
    res.status(500).json({ message: "Failed to fetch placement post" });
  }
});

// PUT /admin/placement/posts/:id
router.put("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const postId = req.params.id;
  const { 
    title, 
    company_name, 
    job_type, 
    package: pkg, 
    stipend,
    required_skills, 
    deadline, 
    description,
    eligible_departments,
    min_gpa,
    min_year,
    max_year,
    active
  } = req.body;

  try {
    await query(
      `UPDATE campus360_dev.placement_posts
       SET title = COALESCE($1, title),
           company_name = COALESCE($2, company_name),
           job_type = COALESCE($3, job_type),
           package = COALESCE($4, package),
           stipend = COALESCE($5, stipend),
           required_skills = COALESCE($6, required_skills),
           deadline = COALESCE($7, deadline),
           description = COALESCE($8, description),
           eligible_departments = COALESCE($9, eligible_departments),
           min_gpa = COALESCE($10, min_gpa),
           min_year = COALESCE($11, min_year),
           max_year = COALESCE($12, max_year),
           active = COALESCE($13, active)
       WHERE id = $14`,
      [title, company_name, job_type, pkg, stipend, required_skills, deadline, description, 
       eligible_departments, min_gpa, min_year, max_year, active, postId]
    );
    res.json({ message: "Placement post updated" });
  } catch (err) {
    console.error("Admin update post error:", err);
    res.status(500).json({ message: "Failed to update placement post" });
  }
});

// DELETE /admin/placement/posts/:id
router.delete("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const postId = req.params.id;
  try {
    await query(
      `DELETE FROM campus360_dev.placement_posts WHERE id = $1`,
      [postId]
    );
    res.json({ message: "Placement post deleted" });
  } catch (err) {
    console.error("Admin delete post error:", err);
    res.status(500).json({ message: "Failed to delete placement post" });
  }
});

export default router;

