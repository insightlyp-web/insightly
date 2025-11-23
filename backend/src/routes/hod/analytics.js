// src/routes/hod/analytics.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

/**
 * Placement analytics for HOD department
 */
router.get("/placements", requireAuth, requireHOD, async (req, res) => {
  try {
    const department = req.department;

    const q = `
      SELECT 
        pp.id AS post_id,
        pp.company_name,
        pp.title,
        pp.job_type,
        pp.created_at,
        COUNT(pa.id) AS applications_count,
        COUNT(CASE WHEN pa.status = 'selected' THEN 1 END) AS selected_count,
        COUNT(CASE WHEN pa.status = 'shortlisted' THEN 1 END) AS shortlisted_count
      FROM campus360_dev.placement_posts pp
      LEFT JOIN campus360_dev.placement_applications pa
        ON pa.post_id = pp.id
      WHERE (
        SELECT department 
        FROM campus360_dev.profiles 
        WHERE id = pp.created_by
      ) = $1
      GROUP BY pp.id
      ORDER BY pp.created_at DESC;
    `;

    const result = await query(q, [department]);

    res.json({ analytics: result.rows });
  } catch (err) {
    console.error("Placement analytics error:", err);
    res.status(500).json({ message: "Server error fetching analytics", error: err.message });
  }
});

export default router;
