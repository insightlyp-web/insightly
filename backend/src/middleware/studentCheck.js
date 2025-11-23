// src/middleware/studentCheck.js
import { query } from "../config/db.js";

export async function requireStudent(req, res, next) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    
    if (!userId) {
      return res.status(401).json({ message: "Missing user id in token" });
    }

    // Check by ID first
    let r = await query(
      `SELECT id, role, department 
       FROM campus360_dev.profiles 
       WHERE id = $1`,
      [userId]
    );

    let profile = r.rows[0];
    
    // If not found by ID, check by email (profile might exist but ID mismatch)
    if (!profile && email) {
      console.log(`[requireStudent] Profile not found by ID, checking by email: ${email}`);
      r = await query(
        `SELECT id, role, department 
         FROM campus360_dev.profiles 
         WHERE email = $1 AND role = 'student'`,
        [email]
      );
      profile = r.rows[0];
      
      // If found by email but ID mismatch, fix it
      if (profile && profile.id !== userId) {
        console.log(`[requireStudent] Found profile by email but ID mismatch. Fixing...`);
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
          
          // Use a transaction-like approach: Create new profile, update FKs, delete old
          // Step 1: Check if profile with new ID already exists (from previous attempt)
          const existingNewProfile = await query(
            `SELECT id FROM campus360_dev.profiles WHERE id = $1`,
            [userId]
          );
          
          if (existingNewProfile.rows.length === 0) {
            // Step 1a: Temporarily clear unique constraints on old profile
            // (We'll delete it anyway, so this is safe)
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
            
            // Step 1b: Create new profile with new ID (copy all data from old)
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
          
          // Step 2: Update all foreign key references
          await query(`UPDATE campus360_dev.enrollments SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.attendance_records SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.assessment_marks SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          await query(`UPDATE campus360_dev.placement_applications SET student_id = $1 WHERE student_id = $2`, [userId, oldId]);
          
          // Step 3: Delete the old profile (now that all FKs are updated)
          await query(`DELETE FROM campus360_dev.profiles WHERE id = $1`, [oldId]);
          
          // Fetch the new profile
          r = await query(
            `SELECT id, role, department 
             FROM campus360_dev.profiles 
             WHERE id = $1`,
            [userId]
          );
          profile = r.rows[0];
          
          console.log(`[requireStudent] ✅ Successfully fixed ID mismatch! Profile migrated from ${oldId} to ${userId}`);
        } catch (updateError) {
          console.error(`[requireStudent] ❌ Failed to fix ID mismatch:`, updateError);
          // Continue with the profile we found, but it won't work for subsequent queries
          // The profile will still work for this request since we found it by email
        }
      }
    }

    if (!profile) {
      console.log(`[requireStudent] Profile not found for user: ${userId}, email: ${email}`);
      return res.status(403).json({ 
        message: "Profile not found. Please complete onboarding.",
        currentRole: null
      });
    }

    if (profile.role !== "student") {
      console.log(`[requireStudent] Access denied - User ${userId} has role '${profile.role}', requires 'student'`);
      return res.status(403).json({ 
        message: `Forbidden: requires student role. Your role is '${profile.role}'.`,
        currentRole: profile.role
      });
    }

    req.studentProfile = profile;
    next();
  } catch (err) {
    console.error("requireStudent error", err);
    res.status(500).json({ message: "Server error in student role check" });
  }
}

