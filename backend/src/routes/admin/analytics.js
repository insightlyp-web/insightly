// src/routes/admin/analytics.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /admin/analytics/overview
router.get("/overview", requireAuth, requireAdmin, async (req, res) => {
  try {
    const posts = await query(
      `SELECT COUNT(*) AS total_posts FROM campus360_dev.placement_posts`
    );
    const apps = await query(
      `SELECT COUNT(*) AS total_applications FROM campus360_dev.placement_applications`
    );
    const statusBreakdown = await query(
      `SELECT status, COUNT(*) AS count
       FROM campus360_dev.placement_applications
       GROUP BY status`
    );

    res.json({
      total_posts: Number(posts.rows[0].total_posts || 0),
      total_applications: Number(apps.rows[0].total_applications || 0),
      status_breakdown: statusBreakdown.rows
    });
  } catch (err) {
    console.error("Admin analytics overview error:", err);
    res.status(500).json({ message: "Failed to load overview analytics" });
  }
});

// GET /admin/analytics/company
// Company-wise application counts
router.get("/company", requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await query(
      `SELECT pp.company_name,
              COUNT(pa.id) AS applications_count
       FROM campus360_dev.placement_posts pp
       LEFT JOIN campus360_dev.placement_applications pa ON pa.post_id = pp.id
       GROUP BY pp.company_name
       ORDER BY applications_count DESC`
    );

    res.json({ company_stats: r.rows });
  } catch (err) {
    console.error("Admin analytics company error:", err);
    res.status(500).json({ message: "Failed to load company analytics" });
  }
});

// GET /admin/analytics/department
// Department-wise application counts
router.get("/department", requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await query(
      `SELECT p.department,
              COUNT(pa.id) AS applications_count
       FROM campus360_dev.placement_applications pa
       JOIN campus360_dev.profiles p ON p.id = pa.student_id
       GROUP BY p.department
       ORDER BY applications_count DESC`
    );

    res.json({ department_stats: r.rows });
  } catch (err) {
    console.error("Admin analytics department error:", err);
    res.status(500).json({ message: "Failed to load department analytics" });
  }
});

export default router;

