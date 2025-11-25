// src/routes/hod/courses.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

router.post("/", requireAuth, requireHOD, async (req, res) => {
  const { code, name, year } = req.body;
  if (!code || !name) return res.status(400).json({ message: "code and name required" });
  try {
    const r = await query(
      `INSERT INTO campus360_dev.courses (code, name, year, department) VALUES ($1,$2,$3,$4) RETURNING *`,
      [code, name, year || null, req.department]
    );
    res.json({ course: r.rows[0] });
  } catch (err) {
    console.error("create course error", err);
    res.status(500).json({ message: "Server error creating course" });
  }
});

router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const r = await query(
      `SELECT 
        c.id, c.code, c.name, c.department, c.year, c.academic_year, c.semester, 
        c.subject_type, c.elective_group, c.faculty_id, c.created_at,
        p.full_name AS faculty_name
       FROM campus360_dev.courses c
       LEFT JOIN campus360_dev.profiles p ON c.faculty_id = p.id
       WHERE c.department=$1 
       ORDER BY c.year DESC, c.semester DESC, c.code`, 
      [req.department]
    );
    res.json({ courses: r.rows });
  } catch (err) {
    console.error("list courses error", err);
    res.status(500).json({ message: "Server error listing courses" });
  }
});

router.put("/:id/map-faculty", requireAuth, requireHOD, async (req, res) => {
  const courseId = req.params.id;
  const { faculty_id } = req.body;
  try {
    await query(`UPDATE campus360_dev.courses SET faculty_id=$1 WHERE id=$2 AND department=$3`, [faculty_id, courseId, req.department]);
    res.json({ message: "Faculty mapped successfully" });
  } catch (err) {
    console.error("map faculty error", err);
    res.status(500).json({ message: "Server error mapping faculty" });
  }
});

export default router;
