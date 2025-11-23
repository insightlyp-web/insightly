// src/routes/auth/signup.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";

const router = express.Router();

// POST /auth/signup - Create profile after Supabase signup
// Requires authentication (user must be signed up in Supabase first)
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, department, phone, role } = req.body;

    if (!full_name || !role) {
      return res.status(400).json({ 
        message: "Missing required fields: full_name, role" 
      });
    }

    // Department is required for all roles except admin
    if (role !== "admin" && !department) {
      return res.status(400).json({ 
        message: "Department is required for this role" 
      });
    }

    // Validate role
    const validRoles = ['student', 'faculty', 'admin', 'hod'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Check if profile already exists for this user ID
    const existingById = await query(
      `SELECT id FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );

    if (existingById.rows.length > 0) {
      return res.json({ 
        message: "Profile already exists for this user",
        profile: existingById.rows[0]
      });
    }

    // Check if profile exists with this email (from seed data)
    // If so, update it to link to the Supabase user ID
    const existingByEmail = await query(
      `SELECT id, role, department FROM campus360_dev.profiles WHERE email = $1`,
      [req.user.email]
    );

    if (existingByEmail.rows.length > 0) {
      const existingProfile = existingByEmail.rows[0];
      const oldId = existingProfile.id;
      
      console.log(`Found existing profile with email ${req.user.email}, old ID: ${oldId}, new Supabase ID: ${userId}`);
      
      // If the IDs are the same, just update the profile fields
      if (oldId === userId) {
        await query(
          `UPDATE campus360_dev.profiles 
           SET full_name = $1, role = $2, department = $3, phone = COALESCE($4, phone)
           WHERE id = $5`,
          [full_name, role, department || null, phone || null, userId]
        );
        
        const updatedProfile = await query(
          `SELECT id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at
           FROM campus360_dev.profiles WHERE id = $1`,
          [userId]
        );
        
        return res.json({ 
          message: "Profile updated successfully",
          profile: updatedProfile.rows[0]
        });
      }
      
      // Update all foreign key references FIRST (before changing the profile ID)
      console.log(`Updating foreign key references from ${oldId} to ${userId}...`);
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
      
      // Now update the profile ID
      console.log(`Updating profile ID from ${oldId} to ${userId}...`);
      await query(
        `UPDATE campus360_dev.profiles 
         SET id = $1, full_name = $2, role = $3, department = $4, phone = COALESCE($5, phone)
         WHERE email = $6`,
        [userId, full_name, role, department || null, phone || null, req.user.email]
      );

      console.log(`✅ Linked existing profile (${oldId}) to Supabase user (${userId}) for ${req.user.email}`);

      // Fetch the updated profile
      const updatedProfile = await query(
        `SELECT id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at
         FROM campus360_dev.profiles WHERE id = $1`,
        [userId]
      );

      if (updatedProfile.rows.length === 0) {
        console.error(`❌ Profile not found after update! userId: ${userId}, email: ${req.user.email}`);
        throw new Error("Failed to fetch updated profile after linking");
      }

      return res.json({ 
        message: "Profile linked successfully",
        profile: updatedProfile.rows[0]
      });
    }

    // No existing profile - create new one
    console.log(`Creating new profile for user ${userId} with email ${req.user.email}`);
    await query(
      `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, full_name, req.user.email, role, department || null, phone || null]
    );

    // Fetch the created profile to return complete data
    const newProfile = await query(
      `SELECT id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at
       FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );

    if (newProfile.rows.length === 0) {
      console.error(`❌ Profile not found after creation! userId: ${userId}, email: ${req.user.email}`);
      throw new Error("Failed to fetch created profile");
    }

    console.log(`✅ Profile created successfully for user ${userId}`);
    res.json({ 
      message: "Profile created successfully",
      profile: newProfile.rows[0]
    });
  } catch (err) {
    console.error("Signup profile error:", err);
    res.status(500).json({ 
      message: "Failed to create profile", 
      error: err.message 
    });
  }
});

export default router;

