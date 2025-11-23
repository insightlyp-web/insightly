// src/middleware/hodCheck.js
import { query } from "../config/db.js";

export async function requireHOD(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log("[requireHOD] Missing user id in token");
      return res.status(401).json({ message: "Missing user id in token" });
    }

    console.log(`[requireHOD] Checking user: ${userId}`);
    const q = `SELECT id, role, department FROM campus360_dev.profiles WHERE id = $1`;
    const r = await query(q, [userId]);
    const profile = r.rows[0];
    
    if (!profile) {
      console.log(`[requireHOD] Profile not found for user: ${userId}`);
      return res.status(403).json({ 
        message: "Profile not found. Please complete onboarding.",
        userId: userId,
        hint: "Create a profile with role='hod' in the database"
      });
    }

    console.log(`[requireHOD] Found profile - role: ${profile.role}, department: ${profile.department}`);
    
    if (profile.role !== "hod") {
      console.log(`[requireHOD] Wrong role: ${profile.role}, expected: hod`);
      return res.status(403).json({ 
        message: "Forbidden: requires HOD role",
        currentRole: profile.role,
        hint: `Update profile role to 'hod' for user ${userId}`
      });
    }

    req.hodProfile = profile;
    req.department = profile.department; // Keep for backward compatibility
    req.profile = profile; // Keep for backward compatibility
    next();
  } catch (err) {
    console.error("[requireHOD] Error:", err);
    res.status(500).json({ message: "Server error in role check", error: err.message });
  }
}
