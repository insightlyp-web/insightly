// src/services/studentService.js
// Service for managing student profiles

import { query } from "../config/db.js";
import { generateEmail, generateUniqueEmail } from "../utils/generateEmail.js";
import supabaseAdmin from "../lib/supabaseAdmin.js";
import { randomUUID } from "crypto";

const DEFAULT_STUDENT_PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || "Student@123";

async function createStudentAuthUser(email, fullName, department) {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_STUDENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "student",
        department,
      },
    });
    if (error) {
      if (!error.message?.includes("already registered")) {
        console.error(`[studentService] Supabase createUser failed for ${email}:`, error.message);
      }
      return null;
    }
    return data?.user?.id || null;
  } catch (err) {
    console.error(`[studentService] Supabase createUser failed for ${email}:`, err.message || err);
    return null;
  }
}

/**
 * Upsert student profile
 * @param {Object} studentData - Student data
 * @param {string} department - Department name
 * @param {Object} metadata - Metadata with year, semester, section
 * @returns {Promise<Object>} - Student profile with id
 */
export async function upsertStudent(studentData, department, metadata) {
  const { name, hall_ticket, mobile } = studentData;
  
  if (!name || !name.trim()) {
    throw new Error('Student name is required');
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
  
  // Check if student already exists by email or hall ticket
  let existing = null;
  
  if (hall_ticket) {
    const result = await query(
      `SELECT id, full_name, email, roll_number FROM campus360_dev.profiles 
       WHERE roll_number = $1 AND role = 'student'`,
      [hall_ticket]
    );
    if (result.rows.length > 0) {
      existing = result.rows[0];
    }
  }
  
  if (!existing) {
    const result = await query(
      `SELECT id, full_name, email, roll_number FROM campus360_dev.profiles 
       WHERE email = $1 AND role = 'student'`,
      [email]
    );
    if (result.rows.length > 0) {
      existing = result.rows[0];
    }
  }
  
  // Determine academic year from metadata
  let academicYear = null;
  if (metadata.fromDate) {
    const fromDate = new Date(metadata.fromDate);
    const year = fromDate.getFullYear();
    const nextYear = year + 1;
    academicYear = `${year}-${String(nextYear).slice(-2)}`;
  }
  
  // Determine student year from metadata
  let studentYear = null;
  if (metadata.year) {
    const yearMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    studentYear = yearMap[metadata.year] || null;
  }
  
  const section = null;
  
  if (existing) {
    // Update existing student
    await query(
      `UPDATE campus360_dev.profiles 
       SET full_name = $1, 
           department = $2,
           phone = COALESCE($3, phone),
           roll_number = COALESCE($4, roll_number),
           academic_year = COALESCE($5, academic_year),
           student_year = COALESCE($6, student_year),
           section = NULL
       WHERE id = $7`,
      [
        cleanedName,
        department,
        mobile || null,
        hall_ticket || null,
        academicYear,
        studentYear,
        existing.id
      ]
    );
    
    return {
      id: existing.id,
      full_name: cleanedName,
      email: existing.email,
      roll_number: hall_ticket || existing.roll_number,
      is_new: false
    };
  }
  
  const authUserId = await createStudentAuthUser(email, cleanedName, department);
  const profileId = authUserId || randomUUID();

  const result = await query(
    `INSERT INTO campus360_dev.profiles 
     (id, full_name, email, role, department, phone, roll_number, academic_year, student_year)
     VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8)
     RETURNING id, full_name, email, roll_number`,
    [
      profileId,
      cleanedName,
      email,
      department,
      mobile || null,
      hall_ticket || null,
      academicYear,
      studentYear
    ]
  );
  
  return {
    id: result.rows[0].id,
    full_name: result.rows[0].full_name,
    email: result.rows[0].email,
    roll_number: result.rows[0].roll_number,
    is_new: true
  };
}

/**
 * Upsert multiple students
 * @param {Array} studentList - Array of student data
 * @param {string} department - Department name
 * @param {Object} metadata - Metadata
 * @returns {Promise<Object>} - Summary with added/updated counts
 */
export async function upsertMultipleStudents(studentList, department, metadata) {
  const results = {
    added: 0,
    updated: 0,
    students: []
  };
  
  for (const studentData of studentList) {
    try {
      const result = await upsertStudent(studentData, department, metadata);
      results.students.push(result);
      
      if (result.is_new) {
        results.added++;
      } else {
        results.updated++;
      }
    } catch (error) {
      console.error(`Error upserting student ${studentData.name}:`, error);
    }
  }
  
  return results;
}

