// src/routes/hod/confirmUpload.js
// Route for confirming and saving Excel upload data

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";
import { query } from "../../config/db.js";
import { upsertMultipleFaculty } from "../../services/facultyService.js";
import { upsertMultipleStudents } from "../../services/studentService.js";
import { upsertMultipleCourses } from "../../services/courseService.js";
import { generateEmail } from "../../utils/generateEmail.js";

const router = express.Router();

/**
 * POST /hod/confirm-upload
 * Accept preview JSON and perform database operations
 */
router.post("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const { full_data } = req.body;
    
    if (!full_data) {
      return res.status(400).json({ message: "Full data is required" });
    }
    
    const { metadata, subjects, students, faculty } = full_data;
    const department = req.department;
    
    if (!metadata || !metadata.branch) {
      return res.status(400).json({ message: "Invalid metadata" });
    }
    
    // Step 1: Upsert faculty
    const facultyResults = await upsertMultipleFaculty(faculty, department);
    
    // Create faculty map (name -> id)
    const facultyMap = new Map();
    facultyResults.faculty.forEach(f => {
      // Find original faculty name from subjects
      const originalFaculty = faculty.find(orig => {
        const email = generateEmail(orig.name);
        return f.email === email;
      });
      if (originalFaculty) {
        facultyMap.set(originalFaculty.name, f.id);
      }
    });
    
    // Step 2: Upsert courses
    const courseResults = await upsertMultipleCourses(subjects, department, metadata, facultyMap);
    
    // Create course map (code -> id)
    const courseMap = new Map();
    courseResults.courses.forEach(c => {
      courseMap.set(c.code, c.id);
    });
    
    // Step 3: Upsert students
    const studentResults = await upsertMultipleStudents(students, department, metadata);
    
    // Create student map (hall_ticket/name -> id)
    const studentMap = new Map();
    studentResults.students.forEach(s => {
      // Map by roll_number (hall_ticket)
      if (s.roll_number) {
        studentMap.set(s.roll_number, s.id);
      }
      // Also map by name as fallback
      if (s.full_name) {
        studentMap.set(s.full_name, s.id);
      }
    });
    
    // Step 4: Create enrollments (link students to courses)
    let enrollmentCount = 0;
    
    console.log(`[confirm-upload] Creating enrollments for ${students.length} students in ${subjects.length} subjects`);
    console.log(`[confirm-upload] Course map has ${courseMap.size} courses`);
    
    for (const student of students) {
      const studentId = studentMap.get(student.hall_ticket || student.name);
      if (!studentId) {
        console.warn(`[confirm-upload] Student not found in map: ${student.hall_ticket || student.name}`);
        continue;
      }
      
      // Enroll student in all subjects from the Excel
      for (const subject of subjects) {
        const courseId = courseMap.get(subject.subject_code);
        if (!courseId) {
          console.warn(`[confirm-upload] Course not found in map for subject code: ${subject.subject_code}`);
          continue;
        }
        
        try {
          const result = await query(
            `INSERT INTO campus360_dev.enrollments (student_id, course_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, course_id) DO NOTHING`,
            [studentId, courseId]
          );
          if (result.rowCount > 0) {
            enrollmentCount++;
          }
        } catch (err) {
          console.warn(`[confirm-upload] Failed to create enrollment for student ${studentId} and course ${courseId}:`, err.message);
        }
      }
    }
    
    console.log(`[confirm-upload] Created ${enrollmentCount} enrollments`);
    
    // Step 5: Attendance seeding is now handled separately via attendance import scripts
    // Skipping attendance seeding in confirm upload to keep it simple
    const attendanceResults = {
      added: 0,
      updated: 0,
      records: []
    };
    
    // Return summary
    res.json({
      success: true,
      students_added: studentResults.added,
      students_updated: studentResults.updated,
      faculty_added: facultyResults.added,
      faculty_updated: facultyResults.updated,
      courses_added: courseResults.added,
      courses_updated: courseResults.updated,
      enrollments_created: enrollmentCount,
      attendance_records_added: attendanceResults.added,
      attendance_records_updated: attendanceResults.updated,
      summary: {
        total_students: studentResults.students.length,
        total_faculty: facultyResults.faculty.length,
        total_courses: courseResults.courses.length,
        total_enrollments: enrollmentCount,
        total_attendance_records: attendanceResults.records.length
      }
    });
    
  } catch (error) {
    console.error("Confirm upload error:", error);
    res.status(500).json({ 
      message: "Failed to save data", 
      error: error.message 
    });
  }
});

export default router;

