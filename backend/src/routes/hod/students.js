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

    let inserted = 0;
    for (const row of rows) {
      const full_name = (row.full_name || row.name || row["Full Name"] || "").trim();
      const email = (row.email || row["Email"] || "").trim() || null;
      const phone = (row.phone || row["Phone"] || "").trim() || null;
      const academic_year = (row.academic_year || row["Academic Year"] || row["Academic_Year"] || "").trim() || null;
      const student_year = (row.student_year || row["Student Year"] || row["Student_Year"] || row.year || "").trim().toUpperCase() || null;
      const roll_number = (row.roll_number || row["Roll Number"] || row["Roll_Number"] || row.rollno || row.roll || "").trim() || null;
      
      if (!full_name || !email) continue;
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
    res.json({ message: "Upload complete", total: rows.length, inserted });
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
