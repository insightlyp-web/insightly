// src/routes/admin/applications.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /admin/applications/post/:postId
// List all applications for a placement post
router.get("/post/:postId", requireAuth, requireAdmin, async (req, res) => {
  const postId = req.params.postId;

  try {
    const r = await query(
      `SELECT pa.id,
              pa.post_id,
              pa.student_id,
              pa.resume_url,
              pa.cover_letter,
              pa.status,
              pa.mentor_feedback,
              pa.admin_feedback,
              pa.recruiter_feedback,
              pa.applied_at,
              p.full_name AS student_name,
              p.email AS student_email,
              p.department AS student_department
       FROM campus360_dev.placement_applications pa
       JOIN campus360_dev.profiles p ON p.id = pa.student_id
       WHERE pa.post_id = $1
       ORDER BY pa.applied_at DESC`,
      [postId]
    );

    res.json({ applications: r.rows });
  } catch (err) {
    console.error("Admin list applications error:", err);
    res.status(500).json({ message: "Failed to list applications" });
  }
});

// PATCH /admin/applications/:id/status
// Body: { status, admin_feedback }
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const appId = req.params.id;
  const { status, admin_feedback } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status required" });
  }

  // allowed statuses: 'applied','mentor_approved','mentor_rejected','shortlisted','not_shortlisted','selected','rejected'
  const allowed = [
    "applied",
    "mentor_approved",
    "mentor_rejected",
    "shortlisted",
    "not_shortlisted",
    "selected",
    "rejected"
  ];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    await query(
      `UPDATE campus360_dev.placement_applications
       SET status = $1,
           admin_feedback = COALESCE($2, admin_feedback)
       WHERE id = $3`,
      [status, admin_feedback || null, appId]
    );

    res.json({ message: "Application status updated" });
  } catch (err) {
    console.error("Admin update application status error:", err);
    res.status(500).json({ message: "Failed to update application status" });
  }
});

export default router;

