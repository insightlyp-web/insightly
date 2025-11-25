// src/services/courseService.js
// Service for managing courses

import { query } from "../config/db.js";

/**
 * Upsert course
 * @param {Object} courseData - Course data
 * @param {string} department - Department name
 * @param {Object} metadata - Metadata with year, semester
 * @param {string|null} facultyId - Faculty ID (optional)
 * @returns {Promise<Object>} - Course with id
 */
export async function upsertCourse(courseData, department, metadata, facultyId = null) {
  const { subject_code, short_code, subject_name, subject_type, elective_group, year, academic_year, semester } = courseData;
  
  if (!subject_code || !subject_code.trim()) {
    throw new Error('Subject code is required');
  }
  
  const code = subject_code.trim();
  // Use subject_name if available, otherwise short_code, otherwise code
  const name = subject_name || short_code || code;
  
  // Use year from courseData if available, otherwise from metadata
  const courseYear = year || metadata.year || null;
  // Use academic_year from courseData if available, otherwise calculate from metadata
  let courseAcademicYear = academic_year || metadata.academic_year || null;
  if (!courseAcademicYear && metadata.fromDate) {
    const fromDate = new Date(metadata.fromDate);
    const yearNum = fromDate.getFullYear();
    const nextYear = yearNum + 1;
    courseAcademicYear = `${yearNum}-${String(nextYear).slice(-2)}`;
  } else if (!courseAcademicYear) {
    // Default to current academic year
    const currentYear = new Date().getFullYear();
    courseAcademicYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
  }
  
  // Use semester from courseData if available, otherwise from metadata
  const courseSemester = courseData.semester || metadata.semester || null;
  
  // Check if course already exists (by code, department, and year for uniqueness)
  const existing = await query(
    `SELECT id, code, name, faculty_id, year, academic_year FROM campus360_dev.courses 
     WHERE code = $1 AND department = $2 AND (year = $3 OR year IS NULL)`,
    [code, department, courseYear]
  );
  
  if (existing.rows.length > 0) {
    // Update existing course
    await query(
      `UPDATE campus360_dev.courses 
       SET name = $1, 
           faculty_id = COALESCE($2, faculty_id),
           year = COALESCE($3, year),
           academic_year = COALESCE($4, academic_year),
           subject_type = COALESCE($5, subject_type),
           elective_group = COALESCE($6, elective_group),
           semester = COALESCE($7, semester)
       WHERE id = $8`,
      [
        name, 
        facultyId, 
        courseYear,
        courseAcademicYear,
        subject_type || null,
        elective_group || null,
        courseSemester,
        existing.rows[0].id
      ]
    );
    
    return {
      id: existing.rows[0].id,
      code: code,
      name: name,
      faculty_id: facultyId || existing.rows[0].faculty_id,
      year: courseYear,
      academic_year: courseAcademicYear,
      is_new: false
    };
  }
  
  // Create new course
  const result = await query(
    `INSERT INTO campus360_dev.courses 
     (id, code, name, department, year, academic_year, faculty_id, subject_type, elective_group, semester)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, code, name, faculty_id`,
    [
      code, 
      name, 
      department, 
      courseYear,
      courseAcademicYear,
      facultyId,
      subject_type || null,
      elective_group || null,
      courseSemester
    ]
  );
  
  return {
    id: result.rows[0].id,
    code: result.rows[0].code,
    name: result.rows[0].name,
    faculty_id: result.rows[0].faculty_id,
    is_new: true
  };
}

/**
 * Upsert multiple courses
 * @param {Array} courseList - Array of course data
 * @param {string} department - Department name
 * @param {Object} metadata - Metadata
 * @param {Map} facultyMap - Map of faculty name to faculty ID
 * @returns {Promise<Object>} - Summary with added/updated counts
 */
export async function upsertMultipleCourses(courseList, department, metadata, facultyMap) {
  const results = {
    added: 0,
    updated: 0,
    courses: []
  };
  
  for (const courseData of courseList) {
    try {
      const facultyId = courseData.faculty_name 
        ? (facultyMap.get(courseData.faculty_name) || null)
        : null;
      
      const result = await upsertCourse(courseData, department, metadata, facultyId);
      results.courses.push(result);
      
      if (result.is_new) {
        results.added++;
      } else {
        results.updated++;
      }
    } catch (error) {
      console.error(`Error upserting course ${courseData.subject_code}:`, error);
    }
  }
  
  return results;
}

