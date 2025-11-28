// src/routes/hod/faculty.js
import express from "express";
import multer from "multer";
import fs from "fs";
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
      const full_name = (row.full_name || row.name || "").trim();
      const email = (row.email || "").trim() || null;
      const phone = (row.phone || "").trim() || null;
      if (!full_name || !email) continue;

      try {
        await query(
          `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
           VALUES (gen_random_uuid(), $1, $2, 'faculty', $3, $4)
           ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone`,
          [full_name, email, req.department, phone]
        );
        inserted++;
      } catch (err) {
        console.warn("Faculty insert failed:", err?.message ?? err);
      }
    }

    fs.unlinkSync(filePath);
    res.json({ message: "Faculty upload complete", total: rows.length, inserted });
  } catch (err) {
    console.error("UPLOAD FACULTY ERROR:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: "Failed to import faculty", error: err.message });
  }
});

router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const r = await query(
      `SELECT id, full_name, email, phone FROM campus360_dev.profiles WHERE department = $1 AND role='faculty' ORDER BY full_name`,
      [req.department]
    );
    res.json({ faculty: r.rows });
  } catch (err) {
    console.error("get faculty error", err);
    res.status(500).json({ message: "Server error fetching faculty" });
  }
});

router.delete("/:id", requireAuth, requireHOD, async (req, res) => {
  const facultyId = req.params.id;
  try {
    // Verify faculty belongs to the HOD's department
    const facultyCheck = await query(
      `SELECT id FROM campus360_dev.profiles WHERE id = $1 AND department = $2 AND role = 'faculty'`,
      [facultyId, req.department]
    );

    if (facultyCheck.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found or does not belong to your department" });
    }

    // Check if faculty has courses assigned
    const coursesCheck = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.courses WHERE faculty_id = $1`,
      [facultyId]
    );
    const coursesCount = parseInt(coursesCheck.rows[0]?.count || 0);

    // Delete faculty (courses will have faculty_id set to NULL due to ON DELETE SET NULL)
    await query(
      `DELETE FROM campus360_dev.profiles WHERE id = $1`,
      [facultyId]
    );

    res.json({ 
      message: "Faculty deleted successfully",
      courses_unassigned: coursesCount
    });
  } catch (err) {
    console.error("delete faculty error", err);
    res.status(500).json({ message: "Server error deleting faculty" });
  }
});

export default router;
