// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { execSync } from "child_process";
dotenv.config();

import analyticsRoute from "./routes/hod/analytics.js";


import studentsRoute from "./routes/hod/students.js";
import facultyRoute from "./routes/hod/faculty.js";
import coursesRoute from "./routes/hod/courses.js";
import timetableRoute from "./routes/hod/timetable.js";
import attendanceRoute from "./routes/hod/attendance.js";
import hodProfileRoute from "./routes/hod/profile.js";
import hodAI from "./routes/hod/ai.js";
import uploadExcelRoute from "./routes/hod/uploadExcel.js";
import confirmUploadRoute from "./routes/hod/confirmUpload.js";


import studentProfile from "./routes/student/profile.js";
import studentAttendance from "./routes/student/attendance.js";
import studentTimetable from "./routes/student/timetable.js";
import studentPlacement from "./routes/student/placement.js";
import studentResume from "./routes/student/resume.js";
import studentCourses from "./routes/student/courses.js";
import studentDashboard from "./routes/student/dashboard.js";
import studentNotifications from "./routes/student/notifications.js";
import studentEvents from "./routes/student/events.js";
import studentAI from "./routes/student/ai.js";

import facultyProfile from "./routes/faculty/profile.js";
import facultyCourses from "./routes/faculty/courses.js";
import facultyAttendance from "./routes/faculty/attendance.js";
import facultyMarks from "./routes/faculty/marks.js";
import facultyDashboard from "./routes/faculty/dashboard.js";
import facultyAI from "./routes/faculty/ai.js";

import adminProfile from "./routes/admin/profile.js";
import adminPlacement from "./routes/admin/placement.js";
import adminApplications from "./routes/admin/applications.js";
import adminAnalytics from "./routes/admin/analytics.js";
import adminAI from "./routes/admin/ai.js";

import authSignup from "./routes/auth/signup.js";
import authCheckProfile from "./routes/auth/check-profile.js";
import authCreateProfile from "./routes/auth/create-profile.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files (resumes, etc.) - must be before other routes
const uploadsPath = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  
  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const bodyCopy = { ...req.body };
    // Hide sensitive fields
    if (bodyCopy.password) bodyCopy.password = '***';
    if (bodyCopy.token) bodyCopy.token = '***';
    console.log(`  Body:`, JSON.stringify(bodyCopy, null, 2));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTimestamp = new Date().toISOString();
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';
    console.log(`[${responseTimestamp}] ${statusColor} ${method} ${path} - ${statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});

// mount HOD routes
app.use("/hod/profile", hodProfileRoute);
app.use("/hod/students", studentsRoute);
app.use("/hod/faculty", facultyRoute);
app.use("/hod/courses", coursesRoute);
app.use("/hod/timetable", timetableRoute);
app.use("/hod/analytics", analyticsRoute);
app.use("/hod/attendance", attendanceRoute);
app.use("/hod/ai", hodAI);
app.use("/hod/upload-excel", uploadExcelRoute);
app.use("/hod/confirm-upload", confirmUploadRoute);
app.use("/student/profile", studentProfile);
app.use("/student/attendance", studentAttendance);
app.use("/student/timetable", studentTimetable);
app.use("/student/placement", studentPlacement);
app.use("/student/resume", studentResume);

app.use("/student/courses", studentCourses);
app.use("/student/dashboard", studentDashboard);
app.use("/student/notifications", studentNotifications);
app.use("/student/events", studentEvents);
app.use("/student/ai", studentAI);

// mount Faculty routes
app.use("/faculty/profile", facultyProfile);
app.use("/faculty/courses", facultyCourses);
app.use("/faculty/attendance", facultyAttendance);
app.use("/faculty/marks", facultyMarks);
app.use("/faculty/dashboard", facultyDashboard);
app.use("/faculty/ai", facultyAI);

// mount Admin routes
app.use("/admin/profile", adminProfile);
app.use("/admin/placement", adminPlacement);
app.use("/admin/applications", adminApplications);
app.use("/admin/analytics", adminAnalytics);
app.use("/admin/ai", adminAI);

// mount Auth routes
app.use("/auth/signup", authSignup);
app.use("/auth/check-profile", authCheckProfile);
app.use("/auth/create-profile", authCreateProfile);

// health
app.get("/_health", (req, res) => res.json({ status: "ok" }));

// Export app for testing
export default app;

// Only start server if not in test mode
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3001;
  
  const server = app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`🚀 CampusAI Backend Server Started`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('==========================================');
    console.log('');
    console.log('📋 Available Routes:');
    console.log('   HOD: /hod/*');
    console.log('   Student: /student/*');
    console.log('   Faculty: /faculty/*');
    console.log('   Admin: /admin/*');
    console.log('   Health: /_health');
    console.log('');
    console.log('📊 Logs will appear below:');
    console.log('==========================================');
    console.log('');
  });
  
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n⚠️  Port ${PORT} is already in use.`);
      console.error(`   Killing existing process...`);
      try {
        execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: "ignore" });
        console.log(`   Process killed. Please restart the server.\n`);
      } catch (e) {
        console.error(`   Could not kill process. Please manually run:`);
        console.error(`   lsof -ti:${PORT} | xargs kill -9\n`);
      }
      process.exit(1);
    } else {
      throw err;
    }
  });
  
  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });
}
