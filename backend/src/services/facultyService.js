// src/services/facultyService.js
// Service for managing faculty profiles

import { query } from "../config/db.js";
import { generateEmail, generateUniqueEmail } from "../utils/generateEmail.js";
import supabaseAdmin from "../lib/supabaseAdmin.js";
import { randomUUID } from "crypto";

const DEFAULT_FACULTY_PASSWORD = process.env.DEFAULT_FACULTY_PASSWORD || "Faculty@123";

async function createFacultyAuthUser(email, fullName, department) {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_FACULTY_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "faculty",
        department,
      },
    });
    if (error) {
      if (!error.message?.includes("already registered")) {
        console.error(`[facultyService] Supabase createUser failed for ${email}:`, error.message);
      }
      return null;
    }
    return data?.user?.id || null;
  } catch (err) {
    console.error(`[facultyService] Supabase createUser failed for ${email}:`, err.message || err);
    return null;
  }
}

/**
 * Upsert faculty profile
 * @param {Object} facultyData - Faculty data
 * @param {string} department - Department name
 * @returns {Promise<Object>} - Faculty profile with id
 */
export async function upsertFaculty(facultyData, department) {
  const { name } = facultyData;
  
  if (!name || !name.trim()) {
    throw new Error('Faculty name is required');
  }
  
  const cleanedName = name.trim();
  const baseEmail = generateEmail(cleanedName);
  
  // Check if email exists
  const emailCheck = async (email) => {
    const result = await query(
      `SELECT id FROM campus360_dev.profiles WHERE email = $1`,
      [email]
    );
    return result.rows.length > 0;
  };
  
  // Generate unique email
  const email = await generateUniqueEmail(baseEmail, emailCheck);
  
  // Check if faculty already exists by email
  const existing = await query(
    `SELECT id, full_name, email FROM campus360_dev.profiles WHERE email = $1`,
    [email]
  );
  
  if (existing.rows.length > 0) {
    // Update existing faculty
    await query(
      `UPDATE campus360_dev.profiles 
       SET full_name = $1, department = $2
       WHERE id = $3`,
      [cleanedName, department, existing.rows[0].id]
    );
    
    return {
      id: existing.rows[0].id,
      full_name: cleanedName,
      email: email,
      is_new: false
    };
  }
  
  const authUserId = await createFacultyAuthUser(email, cleanedName, department);
  const profileId = authUserId || randomUUID();

  const result = await query(
    `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department)
     VALUES ($1, $2, $3, 'faculty', $4)
     RETURNING id, full_name, email`,
    [profileId, cleanedName, email, department]
  );
  
  return {
    id: result.rows[0].id,
    full_name: result.rows[0].full_name,
    email: result.rows[0].email,
    is_new: true
  };
}

/**
 * Upsert multiple faculty members
 * @param {Array} facultyList - Array of faculty data
 * @param {string} department - Department name
 * @returns {Promise<Object>} - Summary with added/updated counts
 */
export async function upsertMultipleFaculty(facultyList, department) {
  const results = {
    added: 0,
    updated: 0,
    faculty: []
  };
  
  for (const facultyData of facultyList) {
    try {
      const result = await upsertFaculty(facultyData, department);
      results.faculty.push(result);
      
      if (result.is_new) {
        results.added++;
      } else {
        results.updated++;
      }
    } catch (error) {
      console.error(`Error upserting faculty ${facultyData.name}:`, error);
    }
  }
  
  return results;
}

/**
 * Get faculty by name
 * @param {string} name - Faculty name
 * @param {string} department - Department name
 * @returns {Promise<Object|null>} - Faculty profile or null
 */
export async function getFacultyByName(name, department) {
  const cleanedName = name.trim();
  const email = generateEmail(cleanedName);
  
  const result = await query(
    `SELECT id, full_name, email FROM campus360_dev.profiles 
     WHERE email = $1 AND department = $2 AND role = 'faculty'`,
    [email, department]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

