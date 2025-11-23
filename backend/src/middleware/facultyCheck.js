// src/middleware/facultyCheck.js
import { query } from "../config/db.js";

export async function requireFaculty(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Missing user id in token" });
    }

    const r = await query(
      `SELECT id, role, department 
       FROM campus360_dev.profiles 
       WHERE id = $1`,
      [userId]
    );

    const profile = r.rows[0];
    if (!profile) {
      console.log(`[requireFaculty] Profile not found for user: ${userId}`);
      return res.status(403).json({ 
        message: "Profile not found. Please complete onboarding.",
        currentRole: null
      });
    }

    if (profile.role !== "faculty") {
      console.log(`[requireFaculty] Access denied - User ${userId} has role '${profile.role}', requires 'faculty'`);
      return res.status(403).json({ 
        message: `Forbidden: requires faculty role. Your role is '${profile.role}'.`,
        currentRole: profile.role
      });
    }

    req.facultyProfile = profile;
    next();
  } catch (err) {
    console.error("requireFaculty error", err);
    res.status(500).json({ message: "Server error in faculty role check" });
  }
}

