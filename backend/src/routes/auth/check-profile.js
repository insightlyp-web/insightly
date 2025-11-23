// src/routes/auth/check-profile.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /auth/check-profile - Diagnostic endpoint to check user profile status
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    console.log(`[check-profile] Checking profile for userId: ${userId}, email: ${email}`);

    // Check if profile exists by user ID
    let r = await query(
      `SELECT id, full_name, email, role, department, phone, created_at 
       FROM campus360_dev.profiles 
       WHERE id = $1`,
      [userId]
    );

    let profile = r.rows[0];

    // If not found by ID, check by email (in case profile exists but ID doesn't match)
    if (!profile) {
      console.log(`[check-profile] Profile not found by ID, checking by email...`);
      r = await query(
        `SELECT id, full_name, email, role, department, phone, created_at 
         FROM campus360_dev.profiles 
         WHERE email = $1`,
        [email]
      );
      profile = r.rows[0];
      
      if (profile && profile.id !== userId) {
        console.log(`[check-profile] Found profile by email but ID mismatch. Profile ID: ${profile.id}, Supabase ID: ${userId}`);
        console.log(`[check-profile] Attempting to migrate profile...`);
        
        const oldId = profile.id;
        
        try {
          // Get full profile data
          const fullProfile = await query(
            `SELECT * FROM campus360_dev.profiles WHERE id = $1`,
            [oldId]
          );
          
          if (fullProfile.rows.length === 0) {
            throw new Error("Could not fetch full profile data");
          }
          
          const profileData = fullProfile.rows[0];
          
          // Check if profile with new ID already exists
          const existingNewProfile = await query(
            `SELECT id FROM campus360_dev.profiles WHERE id = $1`,
            [userId]
          );
          
          if (existingNewProfile.rows.length === 0) {
            // Clear unique constraints on old profile
            await query(
              `UPDATE campus360_dev.profiles 
               SET email = $1, 
                   roll_number = NULL,
                   academic_year = NULL,
                   student_year = NULL,
                   section = NULL
               WHERE id = $2`,
              [`${email}.old.${oldId.substring(0, 8)}`, oldId]
            );
            
            // Create new profile with new ID
            await query(
              `INSERT INTO campus360_dev.profiles 
               (id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                userId,
                profileData.full_name,
                profileData.email,
                profileData.role,
                profileData.department,
                profileData.phone,
                profileData.academic_year,
                profileData.student_year,
                profileData.section,
                profileData.roll_number,
                profileData.created_at
              ]
            );
          }
          
          // Update all foreign key references
          await query(`UPDATE campus360_dev.enrollments SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.attendance_records SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.assessment_marks SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.placement_applications SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          
          // Delete the old profile
          await query(`DELETE FROM campus360_dev.profiles WHERE id = $1`, [oldId]);
          
          // Fetch the new profile
          r = await query(
            `SELECT id, full_name, email, role, department, phone, created_at 
             FROM campus360_dev.profiles 
             WHERE id = $1`,
            [userId]
          );
          profile = r.rows[0];
          
          console.log(`[check-profile] ✅ Successfully migrated profile!`);
        } catch (updateError) {
          console.error(`[check-profile] ❌ Failed to migrate profile:`, updateError);
          // Return the profile anyway if migration failed
        }
      }
    }

    if (!profile) {
      console.log(`[check-profile] Profile not found for userId: ${userId}, email: ${email}`);
      
      // Try to find if there's a profile with a different ID but same email (orphaned profile)
      const orphanedProfile = await query(
        `SELECT * FROM campus360_dev.profiles WHERE email = $1`,
        [email]
      );
      
      if (orphanedProfile.rows.length > 0) {
        const orphaned = orphanedProfile.rows[0];
        console.log(`[check-profile] Found orphaned profile with different ID: ${orphaned.id}`);
        
        // Try to migrate it
        try {
          const oldId = orphaned.id;
          
          // Clear unique constraints on old profile
          await query(
            `UPDATE campus360_dev.profiles 
             SET email = $1, 
                 roll_number = NULL,
                 academic_year = NULL,
                 student_year = NULL,
                 section = NULL
             WHERE id = $2`,
            [`${email}.old.${oldId.substring(0, 8)}`, oldId]
          );
          
          // Create new profile
          await query(
            `INSERT INTO campus360_dev.profiles 
             (id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              userId,
              orphaned.full_name,
              orphaned.email,
              orphaned.role,
              orphaned.department,
              orphaned.phone,
              orphaned.academic_year,
              orphaned.student_year,
              orphaned.section,
              orphaned.roll_number,
              orphaned.created_at
            ]
          );
          
          // Update foreign keys
          await query(`UPDATE campus360_dev.enrollments SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.attendance_records SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.assessment_marks SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.placement_applications SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          
          // Delete old profile
          await query(`DELETE FROM campus360_dev.profiles WHERE id = $1`, [oldId]);
          
          // Fetch new profile
          r = await query(
            `SELECT id, full_name, email, role, department, phone, created_at 
             FROM campus360_dev.profiles 
             WHERE id = $1`,
            [userId]
          );
          profile = r.rows[0];
          
          console.log(`[check-profile] ✅ Successfully migrated orphaned profile!`);
        } catch (migrateError) {
          console.error(`[check-profile] ❌ Failed to migrate orphaned profile:`, migrateError);
        }
      }
      
      if (!profile) {
        return res.status(404).json({
          status: "no_profile",
          message: "Profile not found in database",
          user: {
            id: userId,
            email: email
          },
          hint: "You may need to complete signup or the profile may not have been created properly"
        });
      }
    }

    console.log(`[check-profile] Profile found: ${profile.email}, role: ${profile.role}`);
    // Return profile regardless of role
    return res.json({
      status: "ok",
      message: "Profile found",
      profile: profile
    });
  } catch (err) {
    console.error("Check profile error:", err);
    res.status(500).json({ 
      message: "Failed to check profile", 
      error: err.message 
    });
  }
});

export default router;

