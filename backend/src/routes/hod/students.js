// src/routes/hod/students.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import XLSX from "xlsx";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// Helper function to find column value with case-insensitive matching and synonyms
function getColumnValue(row, synonyms) {
  // First try exact match (case-insensitive)
  for (const key in row) {
    const lowerKey = key.toLowerCase().trim();
    for (const synonym of synonyms) {
      if (lowerKey === synonym.toLowerCase().trim()) {
        return row[key];
      }
    }
  }
  // Try partial match
  for (const key in row) {
    const lowerKey = key.toLowerCase().trim();
    for (const synonym of synonyms) {
      if (lowerKey.includes(synonym.toLowerCase().trim()) || synonym.toLowerCase().trim().includes(lowerKey)) {
        return row[key];
      }
    }
  }
  return null;
}

router.post("/upload", requireAuth, requireHOD, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File required" });

  const filePath = req.file.path;
  const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
  let rows = [];

  try {
    if (ext === "csv") {
      rows = await new Promise((resolve, reject) => {
        const tmp = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (row) => tmp.push(row))
          .on("end", () => resolve(tmp))
          .on("error", reject);
      });
    } else if (ext === "xlsx" || ext === "xls") {
      rows = parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Only CSV or Excel allowed" });
    }

    // Validate required columns
    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "File is empty" });
    }

    // Check for required columns in first row
    const firstRow = rows[0];
    const missingColumns = [];
    
    const fullNameValue = getColumnValue(firstRow, ["full_name", "name", "full name", "student name"]);
    const emailValue = getColumnValue(firstRow, ["email"]);
    
    if (!fullNameValue) missingColumns.push("full_name");
    if (!emailValue) missingColumns.push("email");
    
    if (missingColumns.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: `Required columns missing: ${missingColumns.join(", ")}` 
      });
    }

    let inserted = 0;
    const errors = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const full_name = (getColumnValue(row, ["full_name", "name", "full name", "student name"]) || "").toString().trim();
      const email = (getColumnValue(row, ["email"]) || "").toString().trim() || null;
      const phone = (getColumnValue(row, ["phone", "mobile", "contact"]) || "").toString().trim() || null;
      const academic_year = (getColumnValue(row, ["academic_year", "academic year", "academic_year"]) || "").toString().trim() || null;
      const student_year = (getColumnValue(row, ["student_year", "student year", "student_year", "year"]) || "").toString().trim().toUpperCase() || null;
      const roll_number = (getColumnValue(row, ["roll_number", "roll number", "roll_number", "rollno", "roll", "roll no"]) || "").toString().trim() || null;
      
      if (!full_name || !email) {
        errors.push(`Row ${i + 2}: Missing full_name or email`);
        continue;
      }
      if (student_year && !['I', 'II', 'III', 'IV'].includes(student_year)) {
        console.warn(`Invalid student_year "${student_year}" for ${full_name}, skipping...`);
        continue;
      }

      try {
        await query(
          `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone, academic_year, student_year, roll_number)
           VALUES (gen_random_uuid(), $1, $2, 'student', $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET 
             full_name = EXCLUDED.full_name, 
             phone = EXCLUDED.phone,
             academic_year = EXCLUDED.academic_year,
             student_year = EXCLUDED.student_year,
             roll_number = EXCLUDED.roll_number`,
          [full_name, email, req.department, phone, academic_year, student_year, roll_number]
        );
        inserted++;
      } catch (err) {
        console.warn("Row insert failed:", err?.message ?? err);
      }
    }

    fs.unlinkSync(filePath);
    res.json({ 
      message: "Upload complete", 
      total: rows.length, 
      inserted,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Show first 10 errors
    });
  } catch (err) {
    console.error("UPLOAD STUDENTS ERROR:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: "Failed to import students", error: err.message });
  }
});

// Upload resume for a specific student
router.post("/:studentId/resume", requireAuth, requireHOD, upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Resume file required" });
  
  const { studentId } = req.params;
  const filePath = req.file.path;
  const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
  
  // Only allow PDF files
  if (ext !== "pdf") {
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: "Only PDF files are allowed" });
  }

  try {
    // Verify student belongs to HOD's department
    const studentCheck = await query(
      `SELECT id, department FROM campus360_dev.profiles WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(404).json({ message: "Student not found" });
    }

    if (studentCheck.rows[0].department !== req.department) {
      fs.unlinkSync(filePath);
      return res.status(403).json({ message: "Student does not belong to your department" });
    }

    // Generate a unique filename
    const uniqueFilename = `resume_${studentId}_${Date.now()}.pdf`;
    const newPath = path.join("uploads", "resumes", uniqueFilename);
    
    // Create resumes directory if it doesn't exist
    const resumesDir = path.join("uploads", "resumes");
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }

    // Move file to resumes directory
    fs.renameSync(filePath, newPath);

    // Delete old resume if exists
    const oldResume = await query(
      `SELECT resume_url FROM campus360_dev.profiles WHERE id = $1`,
      [studentId]
    );
    
    if (oldResume.rows[0]?.resume_url && fs.existsSync(oldResume.rows[0].resume_url)) {
      try {
        fs.unlinkSync(oldResume.rows[0].resume_url);
      } catch (err) {
        console.warn("Failed to delete old resume:", err);
      }
    }

    // Update student profile with resume path
    await query(
      `UPDATE campus360_dev.profiles SET resume_url = $1 WHERE id = $2`,
      [newPath, studentId]
    );

    res.json({ 
      message: "Resume uploaded successfully", 
      resume_url: newPath 
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: "Failed to upload resume", error: err.message });
  }
});

router.delete("/:studentId", requireAuth, requireHOD, async (req, res) => {
  const { studentId } = req.params;
  
  try {
    // Verify student belongs to HOD's department
    const studentCheck = await query(
      `SELECT id, department, resume_url FROM campus360_dev.profiles WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (studentCheck.rows[0].department !== req.department) {
      return res.status(403).json({ message: "Student does not belong to your department" });
    }

    // Delete resume file if exists
    const resumeUrl = studentCheck.rows[0].resume_url;
    if (resumeUrl && fs.existsSync(resumeUrl)) {
      try {
        fs.unlinkSync(resumeUrl);
      } catch (err) {
        console.warn("Failed to delete resume file:", err);
      }
    }

    // Delete student enrollments first (foreign key constraint)
    await query(
      `DELETE FROM campus360_dev.enrollments WHERE student_id = $1`,
      [studentId]
    );

    // Delete attendance records
    await query(
      `DELETE FROM campus360_dev.attendance_records WHERE student_id = $1`,
      [studentId]
    );

    // Delete placement applications
    await query(
      `DELETE FROM campus360_dev.placement_applications WHERE student_id = $1`,
      [studentId]
    );

    // Delete student profile
    await query(
      `DELETE FROM campus360_dev.profiles WHERE id = $1`,
      [studentId]
    );

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ message: "Failed to delete student", error: err.message });
  }
});

router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const r = await query(
      `SELECT 
        p.id, 
        p.full_name, 
        p.email, 
        p.phone, 
        p.academic_year, 
        p.student_year, 
        p.roll_number, 
        p.resume_url, 
        p.created_at,
        COUNT(e.id) AS subject_count
       FROM campus360_dev.profiles p
       LEFT JOIN campus360_dev.enrollments e ON e.student_id = p.id
       WHERE p.department = $1 AND p.role='student' 
       GROUP BY p.id, p.full_name, p.email, p.phone, p.academic_year, p.student_year, p.roll_number, p.resume_url, p.created_at
       ORDER BY p.academic_year DESC NULLS LAST, p.student_year, p.roll_number, p.full_name`,
      [req.department]
    );
    res.json({ students: r.rows });
  } catch (err) {
    console.error("get students error", err);
    res.status(500).json({ message: "Server error fetching students" });
  }
});

export default router;
