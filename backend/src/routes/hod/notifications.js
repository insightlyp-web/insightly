// src/routes/hod/notifications.js
import express from "express";
import { query } from "../../config/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireHOD } from "../../middleware/hodCheck.js";

const router = express.Router();

// POST /hod/notifications/send
// Send notification to at-risk students
// Body: { student_ids: [], title, message, type }
router.post("/send", requireAuth, requireHOD, async (req, res) => {
  const hodId = req.hodProfile.id;
  const hodDepartment = req.hodProfile.department;
  const { student_ids, title, message, type } = req.body;

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ message: "student_ids array is required" });
  }

  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required" });
  }

  const notificationType = type || "attendance_warning";

  try {
    // Verify all students belong to HOD's department
    const studentsCheck = await query(
      `SELECT id FROM campus360_dev.profiles 
       WHERE id = ANY($1::uuid[]) 
       AND department = $2 
       AND role = 'student'`,
      [student_ids, hodDepartment]
    );

    if (studentsCheck.rows.length !== student_ids.length) {
      return res.status(403).json({ 
        message: "Some students do not belong to your department" 
      });
    }

    // Insert notifications
    const notifications = [];
    for (const studentId of student_ids) {
      const result = await query(
        `INSERT INTO campus360_dev.notifications 
         (sender_id, sender_type, recipient_id, recipient_type, title, message, type)
         VALUES ($1, 'hod', $2, 'student', $3, $4, $5)
         RETURNING id`,
        [hodId, studentId, title, message, notificationType]
      );
      notifications.push(result.rows[0].id);
    }

    res.json({ 
      message: `Notifications sent to ${notifications.length} students`,
      notifications_sent: notifications.length
    });
  } catch (err) {
    console.error("HOD send notification error:", err);
    res.status(500).json({ message: "Failed to send notifications" });
  }
});

// GET /hod/notifications
// Get all notifications sent by this HOD
router.get("/", requireAuth, requireHOD, async (req, res) => {
  const hodId = req.hodProfile.id;

  try {
    const result = await query(
      `SELECT n.id, n.recipient_id, n.title, n.message, n.type, n.read, n.created_at,
              p.full_name AS student_name, p.email AS student_email
       FROM campus360_dev.notifications n
       JOIN campus360_dev.profiles p ON p.id = n.recipient_id
       WHERE n.sender_id = $1 AND n.sender_type = 'hod'
       ORDER BY n.created_at DESC`,
      [hodId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("HOD get notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// POST /hod/notifications/send-to-at-risk
// Send notification to all at-risk students in the department
router.post("/send-to-at-risk", requireAuth, requireHOD, async (req, res) => {
  const hodId = req.hodProfile.id;
  const hodDepartment = req.hodProfile.department;
  const { title, message, attendance_threshold } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required" });
  }

  const threshold = attendance_threshold || 65;

  try {
    // Get all at-risk students in the department
    const atRiskStudents = await query(
      `WITH student_attendance AS (
        SELECT 
          p.id AS student_id,
          AVG(
            CASE 
              WHEN sc.total_sessions > 0 
              THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
              ELSE 0 
            END
          ) AS avg_attendance_percentage
        FROM campus360_dev.profiles p
        JOIN campus360_dev.enrollments e ON e.student_id = p.id
        LEFT JOIN (
          SELECT 
            e2.student_id,
            e2.course_id,
            COUNT(DISTINCT s.id) AS total_sessions,
            COUNT(DISTINCT ar.id) AS attended_sessions
          FROM campus360_dev.enrollments e2
          CROSS JOIN campus360_dev.attendance_sessions s
          LEFT JOIN campus360_dev.attendance_records ar 
            ON ar.student_id = e2.student_id AND ar.session_id = s.id
          WHERE s.course_id = e2.course_id
          GROUP BY e2.student_id, e2.course_id
        ) sc ON sc.student_id = e.student_id AND sc.course_id = e.course_id
        WHERE p.department = $1 AND p.role = 'student'
        GROUP BY p.id
        HAVING AVG(
          CASE 
            WHEN sc.total_sessions > 0 
            THEN (sc.attended_sessions::numeric / sc.total_sessions::numeric) * 100
            ELSE 0 
          END
        ) < $2
      )
      SELECT student_id FROM student_attendance`,
      [hodDepartment, threshold]
    );

    if (atRiskStudents.rows.length === 0) {
      return res.json({ 
        message: "No at-risk students found",
        notifications_sent: 0
      });
    }

    const studentIds = atRiskStudents.rows.map(row => row.student_id);
    const notifications = [];

    for (const studentId of studentIds) {
      const result = await query(
        `INSERT INTO campus360_dev.notifications 
         (sender_id, sender_type, recipient_id, recipient_type, title, message, type)
         VALUES ($1, 'hod', $2, 'student', $3, $4, 'attendance_warning')
         RETURNING id`,
        [hodId, studentId, title, message]
      );
      notifications.push(result.rows[0].id);
    }

    res.json({ 
      message: `Notifications sent to ${notifications.length} at-risk students`,
      notifications_sent: notifications.length,
      students_notified: studentIds.length
    });
  } catch (err) {
    console.error("HOD send to at-risk error:", err);
    res.status(500).json({ message: "Failed to send notifications" });
  }
});

export default router;

