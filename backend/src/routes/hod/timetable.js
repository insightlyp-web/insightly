// src/routes/hod/timetable.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

router.post("/", requireAuth, requireHOD, async (req, res) => {
  const { course_id, faculty_id, day_of_week, start_time, end_time, room_no } = req.body;
  if (!course_id || !day_of_week || !start_time || !end_time) return res.status(400).json({ message: "Missing required fields" });
  try {
    const r = await query(
      `INSERT INTO campus360_dev.timetable (course_id, faculty_id, day_of_week, start_time, end_time, room_no) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [course_id, faculty_id || null, day_of_week, start_time, end_time, room_no || null]
    );
    res.json({ entry: r.rows[0] });
  } catch (err) {
    console.error("create timetable error", err);
    res.status(500).json({ message: "Server error creating timetable entry" });
  }
});

router.get("/", requireAuth, requireHOD, async (req, res) => {
  try {
    const r = await query(
      `SELECT t.*, c.code AS course_code, c.name AS course_name
       FROM campus360_dev.timetable t
       JOIN campus360_dev.courses c ON c.id = t.course_id
       WHERE c.department = $1
       ORDER BY t.day_of_week, t.start_time`,
      [req.department]
    );
    res.json({ timetable: r.rows });
  } catch (err) {
    console.error("list timetable error", err);
    res.status(500).json({ message: "Server error listing timetable" });
  }
});

router.put("/:id", requireAuth, requireHOD, async (req, res) => {
  const id = req.params.id;
  const { start_time, end_time, room_no } = req.body;
  try {
    await query(`UPDATE campus360_dev.timetable SET start_time=$1, end_time=$2, room_no=$3 WHERE id=$4`, [start_time, end_time, room_no, id]);
    res.json({ message: "Timetable updated" });
  } catch (err) {
    console.error("update timetable error", err);
    res.status(500).json({ message: "Server error updating timetable" });
  }
});

router.delete("/:id", requireAuth, requireHOD, async (req, res) => {
  const id = req.params.id;
  try {
    await query(`DELETE FROM campus360_dev.timetable WHERE id=$1`, [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("delete timetable error", err);
    res.status(500).json({ message: "Server error deleting timetable entry" });
  }
});

export default router;
