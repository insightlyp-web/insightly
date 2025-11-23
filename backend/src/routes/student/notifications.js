// src/routes/student/notifications.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const sample = [
    { message: "Your HOD updated the timetable", time: "2 hours ago" },
    { message: "New placement posted by TCS", time: "5 hours ago" },
    { message: "Attendance updated for today's class", time: "1 day ago" }
  ];

  res.json({ notifications: sample });
});

export default router;
