// src/seed/seedHODData.js
// Comprehensive seed data for HOD dashboard
import { query } from "../config/db.js";

async function seedHODData() {
  try {
    console.log("Seeding HOD dashboard mock data...");

    // Get the HOD user ID (assuming it exists)
    const hodResult = await query(
      `SELECT id, department FROM campus360_dev.profiles WHERE role = 'hod' LIMIT 1`
    );

    if (hodResult.rows.length === 0) {
      console.error("No HOD user found. Please create an HOD user first.");
      process.exit(1);
    }

    const hodId = hodResult.rows[0].id;
    const department = hodResult.rows[0].department || "CS";
    console.log(`Using department: ${department}, HOD ID: ${hodId}`);

    // 1. Create Faculty Members
    console.log("Creating faculty...");
    const facultyData = [
      { name: "Dr. Sarah Johnson", email: "sarah.johnson@campusai.com", phone: "9876543210" },
      { name: "Prof. Michael Chen", email: "michael.chen@campusai.com", phone: "9876543211" },
      { name: "Dr. Emily Davis", email: "emily.davis@campusai.com", phone: "9876543212" },
      { name: "Prof. James Wilson", email: "james.wilson@campusai.com", phone: "9876543213" },
    ];

    const facultyIds = [];
    for (const fac of facultyData) {
      const result = await query(
        `INSERT INTO campus360_dev.profiles (full_name, email, role, department, phone)
         VALUES ($1, $2, 'faculty', $3, $4)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [fac.name, fac.email, department, fac.phone]
      );
      facultyIds.push(result.rows[0].id);
    }
    console.log(`Created ${facultyIds.length} faculty members`);

    // 2. Create Students
    console.log("Creating students...");
    const studentData = [
      { name: "Alice Smith", email: "alice.smith@student.campusai.com", phone: "9876500001" },
      { name: "Bob Williams", email: "bob.williams@student.campusai.com", phone: "9876500002" },
      { name: "Charlie Brown", email: "charlie.brown@student.campusai.com", phone: "9876500003" },
      { name: "Diana Prince", email: "diana.prince@student.campusai.com", phone: "9876500004" },
      { name: "Ethan Hunt", email: "ethan.hunt@student.campusai.com", phone: "9876500005" },
      { name: "Fiona Green", email: "fiona.green@student.campusai.com", phone: "9876500006" },
      { name: "George Martin", email: "george.martin@student.campusai.com", phone: "9876500007" },
      { name: "Hannah Lee", email: "hannah.lee@student.campusai.com", phone: "9876500008" },
      { name: "Ian Cooper", email: "ian.cooper@student.campusai.com", phone: "9876500009" },
      { name: "Julia Roberts", email: "julia.roberts@student.campusai.com", phone: "9876500010" },
    ];

    const studentIds = [];
    for (const stu of studentData) {
      const result = await query(
        `INSERT INTO campus360_dev.profiles (full_name, email, role, department, phone)
         VALUES ($1, $2, 'student', $3, $4)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [stu.name, stu.email, department, stu.phone]
      );
      studentIds.push(result.rows[0].id);
    }
    console.log(`Created ${studentIds.length} students`);

    // 3. Create Courses
    console.log("Creating courses...");
    const coursesData = [
      { code: "CS101", name: "Introduction to Computer Science", year: 1, facultyIndex: 0 },
      { code: "CS201", name: "Data Structures and Algorithms", year: 2, facultyIndex: 1 },
      { code: "CS301", name: "Database Systems", year: 3, facultyIndex: 2 },
      { code: "CS401", name: "Machine Learning", year: 4, facultyIndex: 3 },
      { code: "CS202", name: "Object-Oriented Programming", year: 2, facultyIndex: 0 },
      { code: "CS302", name: "Web Development", year: 3, facultyIndex: 1 },
    ];

    const courseIds = [];
    for (const course of coursesData) {
      const result = await query(
        `INSERT INTO campus360_dev.courses (code, name, department, year, faculty_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [course.code, course.name, department, course.year, facultyIds[course.facultyIndex]]
      );
      if (result.rows.length > 0) {
        courseIds.push(result.rows[0].id);
      } else {
        // Course might already exist, get its ID
        const existing = await query(
          `SELECT id FROM campus360_dev.courses WHERE code = $1 AND department = $2`,
          [course.code, department]
        );
        if (existing.rows.length > 0) {
          courseIds.push(existing.rows[0].id);
        }
      }
    }
    console.log(`Created ${courseIds.length} courses`);

    // 4. Create Timetable Entries
    console.log("Creating timetable entries...");
    const timetableData = [
      { courseIndex: 0, day: "Mon", start: "09:00", end: "10:30", room: "A101", facultyIndex: 0 },
      { courseIndex: 1, day: "Mon", start: "11:00", end: "12:30", room: "A102", facultyIndex: 1 },
      { courseIndex: 2, day: "Tue", start: "09:00", end: "10:30", room: "B201", facultyIndex: 2 },
      { courseIndex: 3, day: "Tue", start: "14:00", end: "15:30", room: "B202", facultyIndex: 3 },
      { courseIndex: 4, day: "Wed", start: "09:00", end: "10:30", room: "A101", facultyIndex: 0 },
      { courseIndex: 5, day: "Wed", start: "11:00", end: "12:30", room: "C301", facultyIndex: 1 },
      { courseIndex: 0, day: "Thu", start: "14:00", end: "15:30", room: "A101", facultyIndex: 0 },
      { courseIndex: 1, day: "Fri", start: "09:00", end: "10:30", room: "A102", facultyIndex: 1 },
    ];

    for (const tt of timetableData) {
      await query(
        `INSERT INTO campus360_dev.timetable (course_id, faculty_id, day_of_week, start_time, end_time, room_no)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          courseIds[tt.courseIndex],
          facultyIds[tt.facultyIndex],
          tt.day,
          tt.start,
          tt.end,
          tt.room,
        ]
      );
    }
    console.log(`Created ${timetableData.length} timetable entries`);

    // 5. Create Enrollments
    console.log("Creating enrollments...");
    for (let i = 0; i < studentIds.length; i++) {
      // Each student enrolled in 2-3 courses
      const coursesToEnroll = [
        courseIds[i % courseIds.length],
        courseIds[(i + 1) % courseIds.length],
        courseIds[(i + 2) % courseIds.length],
      ];
      for (const courseId of coursesToEnroll) {
        await query(
          `INSERT INTO campus360_dev.enrollments (student_id, course_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [studentIds[i], courseId]
        );
      }
    }
    console.log("Created enrollments");

    // 6. Create Attendance Sessions and Records
    console.log("Creating attendance data...");
    const today = new Date();
    const sessionsCreated = [];

    for (let i = 0; i < courseIds.length; i++) {
      // Create 5 attendance sessions per course (past sessions)
      for (let j = 0; j < 5; j++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() - (j * 2)); // 2 days apart

        const startTime = new Date(sessionDate);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(sessionDate);
        endTime.setHours(10, 30, 0, 0);

        const sessionResult = await query(
          `INSERT INTO campus360_dev.attendance_sessions 
           (faculty_id, course_id, session_code, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (session_code) DO NOTHING
           RETURNING id`,
          [
            facultyIds[i % facultyIds.length],
            courseIds[i],
            `SESSION-${courseIds[i].substring(0, 8)}-${j}`,
            startTime.toISOString(),
            endTime.toISOString(),
          ]
        );

        if (sessionResult.rows.length > 0) {
          const sessionId = sessionResult.rows[0].id;
          sessionsCreated.push(sessionId);

          // Create attendance records for enrolled students (70-90% attendance)
          const enrolledStudents = await query(
            `SELECT student_id FROM campus360_dev.enrollments WHERE course_id = $1`,
            [courseIds[i]]
          );

          for (const enrollment of enrolledStudents.rows) {
            // Random attendance (70-90% chance)
            if (Math.random() > 0.2) {
              await query(
                `INSERT INTO campus360_dev.attendance_records (session_id, student_id, timestamp)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [sessionId, enrollment.student_id, startTime.toISOString()]
              );
            }
          }
        }
      }
    }
    console.log(`Created ${sessionsCreated.length} attendance sessions with records`);

    console.log("\n✅ HOD Dashboard mock data seeded successfully!");
    console.log(`\nSummary:`);
    console.log(`- Faculty: ${facultyIds.length}`);
    console.log(`- Students: ${studentIds.length}`);
    console.log(`- Courses: ${courseIds.length}`);
    console.log(`- Timetable entries: ${timetableData.length}`);
    console.log(`- Attendance sessions: ${sessionsCreated.length}`);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedHODData();

