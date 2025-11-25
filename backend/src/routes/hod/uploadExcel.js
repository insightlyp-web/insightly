// src/routes/hod/uploadExcel.js
// Route for uploading and parsing Excel files

import express from "express";
import multer from "multer";
import fs from "fs";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";
import { parseExcelFile } from "../../services/excelParser.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * POST /hod/upload-excel
 * Upload Excel file and return preview data (no DB writes)
 */
router.post("/", requireAuth, requireHOD, upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.error("[upload-excel] No file uploaded");
    return res.status(400).json({ message: "File required" });
  }
  
  const filePath = req.file.path;
  const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
  
  console.log(`[upload-excel] File uploaded: ${req.file.originalname}, extension: ${ext}`);
  
  // Only allow Excel files
  if (ext !== "xlsx" && ext !== "xls") {
    console.error(`[upload-excel] Invalid file extension: ${ext}`);
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: "Only Excel files (.xlsx, .xls) are allowed" });
  }
  
  try {
    console.log(`[upload-excel] Parsing Excel file: ${filePath}`);
    // Parse Excel file (pass filename for year/semester extraction)
    const parsedData = parseExcelFile(filePath, req.file.originalname);
    
    console.log(`[upload-excel] Parsed data:`, {
      hasMetadata: !!parsedData.metadata,
      metadata: parsedData.metadata,
      subjectsCount: parsedData.subjects?.length || 0,
      studentsCount: parsedData.students?.length || 0,
      facultyCount: parsedData.faculty?.length || 0
    });
    
    // Validate parsed data
    // Use HOD's department if branch is not found in Excel
    if (!parsedData.metadata) {
      console.error("[upload-excel] No metadata found");
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: "Invalid Excel format: Could not extract metadata. Please ensure the file contains Program and Branch information." 
      });
    }
    
    // If branch is not in Excel, use HOD's department
    if (!parsedData.metadata.branch || parsedData.metadata.branch.trim() === '') {
      parsedData.metadata.branch = req.department;
      console.log(`[upload-excel] Using HOD department as branch: ${req.department}`);
    }
    
    // If program is not in Excel, set a default
    if (!parsedData.metadata.program || parsedData.metadata.program.trim() === '') {
      parsedData.metadata.program = 'B.TECH';
      console.log(`[upload-excel] Using default program: B.TECH`);
    }
    
    // Extract year from filename (prioritize filename over Excel metadata)
    const filename = req.file.originalname.toUpperCase();
    let yearFromFilename = null;
    
    // Check for "4th", "4TH", "IV", "4 YEAR", "4THYEAR", "4TH YEAR" (with or without spaces)
    if (filename.match(/\b(4TH|IV|4\s*YEAR|4THYEAR|4TH\s*YEAR)\b/) || filename.includes('4THYEAR')) {
      yearFromFilename = 4;
    } else if (filename.match(/\b(3RD|III|3\s*YEAR|3RDYEAR|3RD\s*YEAR)\b/) || filename.includes('3RDYEAR')) {
      yearFromFilename = 3;
    } else if (filename.match(/\b(2ND|II|2\s*YEAR|2NDYEAR|2ND\s*YEAR)\b/) || filename.includes('2NDYEAR')) {
      yearFromFilename = 2;
    } else if (filename.match(/\b(1ST|I\s*YEAR|1STYEAR|1ST\s*YEAR|1\s*YEAR)\b/) || filename.includes('1STYEAR')) {
      yearFromFilename = 1;
    }
    
    // Use filename year if found, otherwise use Excel metadata
    if (yearFromFilename !== null) {
      parsedData.metadata.year = yearFromFilename;
      console.log(`[upload-excel] Extracted year from filename: ${parsedData.metadata.year} (overriding Excel metadata)`);
      // Update all subjects with the extracted year
      parsedData.subjects.forEach(subject => {
        subject.year = parsedData.metadata.year;
      });
    } else if (parsedData.metadata.year) {
      console.log(`[upload-excel] Using year from Excel metadata: ${parsedData.metadata.year}`);
      // Update all subjects with the metadata year
      parsedData.subjects.forEach(subject => {
        subject.year = parsedData.metadata.year;
      });
    }
    
    // Extract semester from filename (prioritize filename over Excel metadata)
    // Look for "SEM I", "SEMESTER I", "SEM-I", "Sem-I", etc.
    // Reuse filename from above
    let semesterFromFilename = null;
    
    // Check for semester I indicators (with space, hyphen, or parentheses)
    // Match: SEM I, SEM-I, SEM(I), (SEM-I), SEMESTER I, SEMESTER-I, etc.
    // First check for II to avoid false positives
    if (filename.match(/(SEM|SEMESTER)[\s\-\(]*II[\s\-\)]*/)) {
      semesterFromFilename = 2;
    } else if (filename.match(/(SEM|SEMESTER)[\s\-\(]*I[\s\-\)]*/)) {
      semesterFromFilename = 1;
    }
    
    // Use filename semester if found, otherwise use Excel metadata
    if (semesterFromFilename !== null) {
      parsedData.metadata.semester = semesterFromFilename;
      console.log(`[upload-excel] Extracted semester from filename: ${parsedData.metadata.semester} (overriding Excel metadata)`);
      // Update all subjects with the extracted semester
      parsedData.subjects.forEach(subject => {
        subject.semester = parsedData.metadata.semester;
      });
    } else if (parsedData.metadata.semester) {
      console.log(`[upload-excel] Using semester from Excel metadata: ${parsedData.metadata.semester}`);
      // Update all subjects with the metadata semester
      parsedData.subjects.forEach(subject => {
        subject.semester = parsedData.metadata.semester;
      });
    }
    
    // Set default academic year if not found
    if (!parsedData.metadata.academic_year) {
      // Try to extract from filename or use 2025-26 as default
      // Reuse filename from above
      const yearMatch = filename.match(/(\d{4})[-/](\d{2,4})/);
      if (yearMatch) {
        parsedData.metadata.academic_year = `${yearMatch[1]}-${yearMatch[2].slice(-2)}`;
      } else {
        // Default to 2025-26 for now (can be changed based on requirements)
        parsedData.metadata.academic_year = '2025-26';
      }
      console.log(`[upload-excel] Set academic year: ${parsedData.metadata.academic_year}`);
      // Update all subjects with the academic year
      parsedData.subjects.forEach(subject => {
        subject.academic_year = parsedData.metadata.academic_year;
      });
    }
    
    if (!parsedData.subjects || parsedData.subjects.length === 0) {
      console.error("[upload-excel] No subjects found");
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: "Invalid Excel format: No subjects found. Please check the subject table or subject code row." 
      });
    }
    
    // Students are optional - file might only have subject list
    if (!parsedData.students || parsedData.students.length === 0) {
      console.log("[upload-excel] No students found - file may only contain subject list");
      // Don't fail - allow subject-only uploads
    }
    
    // Return preview data
    res.json({
      success: true,
      preview: {
        metadata: parsedData.metadata,
        subjects: parsedData.subjects.map(s => ({
          subject_code: s.subject_code,
          short_code: s.short_code,
          subject_name: s.subject_name || s.short_code,
          subject_type: s.subject_type,
          elective_group: s.elective_group,
          faculty_name: s.faculty_name,
          year: s.year || parsedData.metadata.year,
          academic_year: s.academic_year || parsedData.metadata.academic_year,
          semester: s.semester || parsedData.metadata.semester
        })),
        faculty: parsedData.faculty.map(f => ({
          name: f.name,
          subject_count: f.subjects.length
        })),
        students: parsedData.students.map(st => ({
          name: st.name,
          hall_ticket: st.hall_ticket,
          mobile: st.mobile,
          subject_count: Object.keys(st.attendance || {}).length
        })),
        summary: {
          total_subjects: parsedData.subjects.length,
          total_faculty: parsedData.faculty.length,
          total_students: parsedData.students.length
        }
      },
      // Include full data for confirmation endpoint
      full_data: parsedData
    });
    
    // Clean up file after parsing (we'll store it temporarily if needed)
    // For now, delete it since we've parsed everything
    // fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error("[upload-excel] Excel upload error:", error);
    console.error("[upload-excel] Error stack:", error.stack);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ 
      message: "Failed to parse Excel file", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;

