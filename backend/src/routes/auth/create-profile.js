// src/routes/auth/create-profile.js
// Helper endpoint to create profile if missing (for existing users)
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";

const router = express.Router();

// POST /auth/create-profile - Create profile for authenticated user
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const { full_name, department, phone, role } = req.body;

    // Default to HOD if not specified
    const userRole = role || "hod";
    const userDepartment = department || "CS";
    const userName = full_name || "HOD User";

    // Check if profile already exists for this user ID
    const existingById = await query(
      `SELECT id, role FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );

    if (existingById.rows.length > 0) {
      const existingProfile = existingById.rows[0];
      return res.json({
        message: "Profile already exists",
        profile: existingProfile,
        action: existingProfile.role !== userRole 
          ? `Profile exists but role is '${existingProfile.role}'. Update it to '${userRole}'?`
          : "Profile is already set up correctly"
      });
    }

    // Check if profile exists with this email (from seed data)
    // If so, update it to link to the Supabase user ID
    const existingByEmail = await query(
      `SELECT id, role, department FROM campus360_dev.profiles WHERE email = $1`,
      [email]
    );

    if (existingByEmail.rows.length > 0) {
      const existingProfile = existingByEmail.rows[0];
      const oldId = existingProfile.id;
      
      console.log(`Linking existing profile (${oldId}) to Supabase user (${userId}) for ${email}`);
      
      // Update the existing profile to use the new Supabase user ID
      await query(
        `UPDATE campus360_dev.profiles 
         SET id = $1, full_name = $2, role = $3, department = $4, phone = COALESCE($5, phone)
         WHERE email = $6`,
        [userId, userName, userRole, userDepartment, phone || null, email]
      );

      // Update all foreign key references to use the new ID
      await query(
        `UPDATE campus360_dev.enrollments SET student_id = $1 WHERE student_id = $2`,
        [userId, oldId]
      );
      await query(
        `UPDATE campus360_dev.attendance_records SET student_id = $1 WHERE student_id = $2`,
        [userId, oldId]
      );
      await query(
        `UPDATE campus360_dev.assessment_marks SET student_id = $1 WHERE student_id = $2`,
        [userId, oldId]
      );
      await query(
        `UPDATE campus360_dev.placement_applications SET student_id = $1 WHERE student_id = $2`,
        [userId, oldId]
      );

      console.log(`✅ Profile linked successfully for ${email}`);
      
      // Fetch the updated profile
      const updatedProfile = await query(
        `SELECT id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at
         FROM campus360_dev.profiles WHERE id = $1`,
        [userId]
      );

      return res.json({
        message: "Profile linked successfully",
        profile: updatedProfile.rows[0]
      });
    }

    // No existing profile - create new one
    try {
      await query(
        `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, userName, email, userRole, userDepartment, phone || null]
      );
      console.log(`Profile created for user ${userId} with role ${userRole}`);
    } catch (insertError) {
      console.error("Profile insert error:", insertError);
      throw insertError;
    }

    const newProfile = await query(
      `SELECT id, full_name, email, role, department, phone, created_at
       FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );

    res.json({
      message: "Profile created successfully",
      profile: newProfile.rows[0]
    });
  } catch (err) {
    console.error("Create profile error:", err);
    res.status(500).json({
      message: "Failed to create profile",
      error: err.message
    });
  }
});

export default router;

