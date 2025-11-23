// src/middleware/adminCheck.js
import { query } from "../config/db.js";

export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Missing user id in token" });
    }

    const r = await query(
      `SELECT id, full_name, email, role
       FROM campus360_dev.profiles
       WHERE id = $1`,
      [userId]
    );

    const profile = r.rows[0];
    if (!profile) {
      return res.status(403).json({ message: "Profile not found. Please complete onboarding." });
    }

    if (profile.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: requires admin role" });
    }

    req.adminProfile = profile;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ message: "Server error in admin role check" });
  }
}

