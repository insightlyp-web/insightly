// src/routes/admin/profile.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /admin/profile
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const adminId = req.adminProfile.id;

    const r = await query(
      `SELECT id, full_name, email, role, created_at
       FROM campus360_dev.profiles
       WHERE id = $1 AND role = 'admin'`,
      [adminId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    res.json({ profile: r.rows[0] });
  } catch (err) {
    console.error("Admin profile error:", err);
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
});

export default router;

