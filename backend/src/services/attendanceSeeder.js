// src/services/attendanceSeeder.js
// Service for seeding attendance data from Excel

import { query } from "../config/db.js";

/**
 * Seed attendance summary for a student and course
 * @param {string} studentId - Student ID
 * @param {string} courseId - Course ID
 * @param {number} attendedClasses - Number of classes attended
 * @param {number} totalClasses - Total number of classes
 * @param {number} percentage - Attendance percentage
 * @param {Object} metadata - Metadata with fromDate
 * @returns {Promise<Object>} - Attendance summary record
 */
export async function seedAttendanceSummary(
  studentId,
  courseId,
  attendedClasses,
  totalClasses,
  percentage,
  metadata
) {
  if (!metadata.fromDate) {
    throw new Error('FromDate is required for attendance summary');
  }
  
  const fromDate = new Date(metadata.fromDate);
  const month = fromDate.toLocaleString('default', { month: 'long' });
  const year = fromDate.getFullYear();
  
  // Check if attendance summary already exists
  const existing = await query(
    `SELECT id FROM campus360_dev.attendance_summary 
     WHERE student_id = $1 AND course_id = $2 AND month = $3 AND year = $4`,
    [studentId, courseId, month, year]
  );
  
  if (existing.rows.length > 0) {
    // Update existing record
    await query(
      `UPDATE campus360_dev.attendance_summary 
       SET attended_classes = $1, 
           total_classes = $2, 
           percentage = $3,
           updated_at = now()
       WHERE id = $4`,
      [attendedClasses, totalClasses, percentage, existing.rows[0].id]
    );
    
    return {
      id: existing.rows[0].id,
      is_new: false
    };
  }
  
  // Create new attendance summary
  const result = await query(
    `INSERT INTO campus360_dev.attendance_summary 
     (id, student_id, course_id, attended_classes, total_classes, percentage, month, year)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [studentId, courseId, attendedClasses, totalClasses, percentage, month, year]
  );
  
  return {
    id: result.rows[0].id,
    is_new: true
  };
}

/**
 * Seed attendance for multiple students and courses
 * @param {Array} students - Array of student data with attendance
 * @param {Map} studentMap - Map of student identifier to student ID
 * @param {Map} courseMap - Map of course code to course ID
 * @param {Object} metadata - Metadata
 * @returns {Promise<Object>} - Summary with added/updated counts
 */
export async function seedMultipleAttendance(
  students,
  studentMap,
  courseMap,
  metadata
) {
  const results = {
    added: 0,
    updated: 0,
    records: []
  };
  
  for (const studentData of students) {
    // Try to find student by hall_ticket first, then by name
    let studentId = null;
    if (studentData.hall_ticket) {
      studentId = studentMap.get(studentData.hall_ticket);
    }
    if (!studentId && studentData.name) {
      studentId = studentMap.get(studentData.name);
    }
    
    if (!studentId) {
      console.warn(`Student not found: ${studentData.name} (${studentData.hall_ticket || 'no hall ticket'})`);
      continue;
    }
    
    const totalClasses = studentData.total_classes || 0;
    
    // Process attendance for each subject
    for (const [subjectCode, attendedClasses] of Object.entries(studentData.attendance || {})) {
      const courseId = courseMap.get(subjectCode);
      
      if (!courseId) {
        console.warn(`Course not found: ${subjectCode}`);
        continue;
      }
      
      // Calculate percentage if not provided
      let percentage = studentData.percentage || 0;
      if (totalClasses > 0 && !percentage) {
        percentage = (attendedClasses / totalClasses) * 100;
      }
      
      try {
        const result = await seedAttendanceSummary(
          studentId,
          courseId,
          attendedClasses,
          totalClasses,
          percentage,
          metadata
        );
        
        results.records.push({
          student_id: studentId,
          course_id: courseId,
          subject_code: subjectCode
        });
        
        if (result.is_new) {
          results.added++;
        } else {
          results.updated++;
        }
      } catch (error) {
        console.error(`Error seeding attendance for ${studentData.name} - ${subjectCode}:`, error);
      }
    }
  }
  
  return results;
}

