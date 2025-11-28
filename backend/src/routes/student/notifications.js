// src/routes/student/notifications.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireStudent } from "../../middleware/studentCheck.js";
import { query } from "../../config/db.js";

const router = express.Router();

// GET /student/notifications
// Get all notifications for the logged-in student
router.get("/", requireAuth, requireStudent, async (req, res) => {
  const studentId = req.studentProfile.id;

  try {
    const result = await query(
      `SELECT n.id, n.title, n.message, n.type, n.read, n.created_at
       FROM campus360_dev.notifications n
       WHERE n.recipient_id = $1 AND n.recipient_type = 'student'
       ORDER BY n.created_at DESC`,
      [studentId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Student get notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /student/notifications/:id/read
// Mark a notification as read
router.patch("/:id/read", requireAuth, requireStudent, async (req, res) => {
  const studentId = req.studentProfile.id;
  const notificationId = req.params.id;

  try {
    await query(
      `UPDATE campus360_dev.notifications 
       SET read = true, read_at = NOW()
       WHERE id = $1 AND recipient_id = $2 AND recipient_type = 'student'`,
      [notificationId, studentId]
    );

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Student mark notification read error:", err);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// DELETE /student/notifications/:id
// Delete a notification
router.delete("/:id", requireAuth, requireStudent, async (req, res) => {
  const studentId = req.studentProfile.id;
  const notificationId = req.params.id;

  try {
    const result = await query(
      `DELETE FROM campus360_dev.notifications 
       WHERE id = $1 AND recipient_id = $2 AND recipient_type = 'student'
       RETURNING id`,
      [notificationId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Student delete notification error:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

export default router;
