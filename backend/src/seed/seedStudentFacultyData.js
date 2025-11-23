// src/seed/seedStudentFacultyData.js
// Comprehensive seed data for Student and Faculty dashboards
import { query } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

async function seedStudentFacultyData() {
  try {
    console.log("🌱 Seeding Student and Faculty mock data...\n");

    // Get or create a department (use CS as default)
    const department = "CS";

    // 1. Create Faculty Members with credentials
    console.log("📚 Creating Faculty Members...");
    const facultyData = [
      {
        name: "Dr. Sarah Johnson",
        email: "faculty1@campusai.com",
        phone: "9876543210",
        password: "faculty123", // Password for Supabase signup
      },
      {
        name: "Prof. Michael Chen",
        email: "faculty2@campusai.com",
        phone: "9876543211",
        password: "faculty123",
      },
      {
        name: "Dr. Emily Davis",
        email: "faculty3@campusai.com",
        phone: "9876543212",
        password: "faculty123",
      },
      {
        name: "Prof. James Wilson",
        email: "faculty4@campusai.com",
        phone: "9876543213",
        password: "faculty123",
      },
    ];

    const facultyIds = [];
    for (const fac of facultyData) {
      const result = await query(
        `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
         VALUES ($1, $2, $3, 'faculty', $4, $5)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, department = EXCLUDED.department
         RETURNING id`,
        [uuidv4(), fac.name, fac.email, department, fac.phone]
      );
      facultyIds.push({ id: result.rows[0].id, ...fac });
    }
    console.log(`✅ Created ${facultyIds.length} faculty members\n`);

    // 2. Create Students with credentials and student-specific fields
    console.log("🎓 Creating Students...");
    const studentData = [
      {
        name: "Alice Smith",
        email: "student1@campusai.com",
        phone: "9876500001",
        password: "student123",
        academic_year: "2024-2025",
        student_year: "I",
        section: "A",
        roll_number: "CS001",
      },
      {
        name: "Bob Williams",
        email: "student2@campusai.com",
        phone: "9876500002",
        password: "student123",
        academic_year: "2024-2025",
        student_year: "I",
        section: "A",
        roll_number: "CS002",
      },
      {
        name: "Charlie Brown",
        email: "student3@campusai.com",
        phone: "9876500003",
        password: "student123",
        academic_year: "2024-2025",
        student_year: "II",
        section: "B",
        roll_number: "CS101",
      },
      {
        name: "Diana Prince",
        email: "student4@campusai.com",
        phone: "9876500004",
        password: "student123",
        academic_year: "2024-2025",
        student_year: "II",
        section: "B",
        roll_number: "CS102",
      },
      {
        name: "Ethan Hunt",
        email: "student5@campusai.com",
        phone: "9876500005",
        password: "student123",
        academic_year: "2023-2024",
        student_year: "III",
        section: "A",
        roll_number: "CS201",
      },
      {
        name: "Fiona Green",
        email: "student6@campusai.com",
        phone: "9876500006",
        password: "student123",
        academic_year: "2023-2024",
        student_year: "III",
        section: "A",
        roll_number: "CS202",
      },
      {
        name: "George Martin",
        email: "student7@campusai.com",
        phone: "9876500007",
        password: "student123",
        academic_year: "2022-2023",
        student_year: "IV",
        section: "A",
        roll_number: "CS301",
      },
      {
        name: "Hannah Lee",
        email: "student8@campusai.com",
        phone: "9876500008",
        password: "student123",
        academic_year: "2022-2023",
        student_year: "IV",
        section: "B",
        roll_number: "CS302",
      },
    ];

    const studentIds = [];
    for (const stu of studentData) {
      const result = await query(
        `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number)
         VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET 
           full_name = EXCLUDED.full_name, 
           department = EXCLUDED.department,
           academic_year = EXCLUDED.academic_year,
           student_year = EXCLUDED.student_year,
           section = EXCLUDED.section,
           roll_number = EXCLUDED.roll_number
         RETURNING id`,
        [
          uuidv4(),
          stu.name,
          stu.email,
          department,
          stu.phone,
          stu.academic_year,
          stu.student_year,
          stu.section,
          stu.roll_number,
        ]
      );
      studentIds.push({ id: result.rows[0].id, ...stu });
    }
    console.log(`✅ Created ${studentIds.length} students\n`);

    // 3. Create Courses
    console.log("📖 Creating Courses...");
    const coursesData = [
      {
        code: "CS101",
        name: "Introduction to Computer Science",
        year: 1,
        facultyIndex: 0,
      },
      {
        code: "CS102",
        name: "Programming Fundamentals",
        year: 1,
        facultyIndex: 0,
      },
      {
        code: "CS201",
        name: "Data Structures and Algorithms",
        year: 2,
        facultyIndex: 1,
      },
      {
        code: "CS202",
        name: "Object-Oriented Programming",
        year: 2,
        facultyIndex: 1,
      },
      {
        code: "CS301",
        name: "Database Systems",
        year: 3,
        facultyIndex: 2,
      },
      {
        code: "CS302",
        name: "Web Development",
        year: 3,
        facultyIndex: 2,
      },
      {
        code: "CS401",
        name: "Machine Learning",
        year: 4,
        facultyIndex: 3,
      },
    ];

    const courseIds = [];
    for (const course of coursesData) {
      const result = await query(
        `INSERT INTO campus360_dev.courses (id, code, name, department, year, faculty_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          uuidv4(),
          course.code,
          course.name,
          department,
          course.year,
          facultyIds[course.facultyIndex].id,
        ]
      );
      if (result.rows.length > 0) {
        courseIds.push({ id: result.rows[0].id, ...course });
      } else {
        // Course might already exist, get its ID
        const existing = await query(
          `SELECT id FROM campus360_dev.courses WHERE code = $1 AND department = $2`,
          [course.code, department]
        );
        if (existing.rows.length > 0) {
          courseIds.push({ id: existing.rows[0].id, ...course });
        }
      }
    }
    console.log(`✅ Created ${courseIds.length} courses\n`);

    // 4. Create Enrollments
    console.log("📝 Creating Enrollments...");
    let enrollmentCount = 0;
    
    // Map student_year to numeric year for enrollment matching
    const yearMap = { "I": 1, "II": 2, "III": 3, "IV": 4 };
    
    for (let i = 0; i < studentIds.length; i++) {
      const student = studentIds[i];
      const studentNumericYear = yearMap[student.student_year] || 1;
      
      // Enroll students in courses matching their year
      const relevantCourses = courseIds.filter(
        (c) => c.year === studentNumericYear || c.year === studentNumericYear - 1
      );

      for (const course of relevantCourses.slice(0, 3)) {
        // Each student enrolled in up to 3 courses
        await query(
          `INSERT INTO campus360_dev.enrollments (student_id, course_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [student.id, course.id]
        );
        enrollmentCount++;
      }
    }
    console.log(`✅ Created ${enrollmentCount} enrollments\n`);

    // 5. Create Timetable Entries
    console.log("🕐 Creating Timetable Entries...");
    const timetableData = [
      { courseIndex: 0, day: "Mon", start: "09:00", end: "10:30", room: "A101", facultyIndex: 0 },
      { courseIndex: 1, day: "Mon", start: "11:00", end: "12:30", room: "A102", facultyIndex: 1 },
      { courseIndex: 2, day: "Tue", start: "09:00", end: "10:30", room: "B201", facultyIndex: 2 },
      { courseIndex: 3, day: "Tue", start: "14:00", end: "15:30", room: "B202", facultyIndex: 3 },
      { courseIndex: 4, day: "Wed", start: "09:00", end: "10:30", room: "A101", facultyIndex: 0 },
      { courseIndex: 5, day: "Wed", start: "11:00", end: "12:30", room: "C301", facultyIndex: 1 },
      { courseIndex: 6, day: "Thu", start: "14:00", end: "15:30", room: "A101", facultyIndex: 2 },
      { courseIndex: 0, day: "Fri", start: "09:00", end: "10:30", room: "A102", facultyIndex: 0 },
    ];

    let timetableCount = 0;
    for (const tt of timetableData) {
      const result = await query(
        `INSERT INTO campus360_dev.timetable (course_id, faculty_id, day_of_week, start_time, end_time, room_no)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          courseIds[tt.courseIndex].id,
          facultyIds[tt.facultyIndex].id,
          tt.day,
          tt.start,
          tt.end,
          tt.room,
        ]
      );
      if (result.rowCount > 0) timetableCount++;
    }
    console.log(`✅ Created ${timetableCount} timetable entries\n`);

    // 6. Create Attendance Sessions and Records
    console.log("📊 Creating Attendance Sessions...");
    const today = new Date();
    const sessionsCreated = [];

    for (let i = 0; i < courseIds.length; i++) {
      const course = courseIds[i];
      const facultyId = facultyIds[course.facultyIndex].id;

      // Create 5-7 attendance sessions per course (past sessions)
      for (let j = 0; j < 6; j++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() - (j * 3)); // 3 days apart

        const startTime = new Date(sessionDate);
        startTime.setHours(9 + (j % 3), 0, 0, 0); // Vary start times
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1, 30, 0, 0);

        const sessionCode = `SESS-${course.code}-${sessionDate.toISOString().split("T")[0]}-${j}`;

        const sessionResult = await query(
          `INSERT INTO campus360_dev.attendance_sessions 
           (id, faculty_id, course_id, session_code, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (session_code) DO NOTHING
           RETURNING id`,
          [
            uuidv4(),
            facultyId,
            course.id,
            sessionCode,
            startTime.toISOString(),
            endTime.toISOString(),
          ]
        );

        if (sessionResult.rows.length > 0) {
          const sessionId = sessionResult.rows[0].id;
          sessionsCreated.push(sessionId);

          // Create attendance records for enrolled students (75-90% attendance)
          const enrolledStudents = await query(
            `SELECT student_id FROM campus360_dev.enrollments WHERE course_id = $1`,
            [course.id]
          );

          for (const enrollment of enrolledStudents.rows) {
            // Random attendance (75-90% chance)
            if (Math.random() > 0.15) {
              await query(
                `INSERT INTO campus360_dev.attendance_records (id, session_id, student_id, timestamp)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [uuidv4(), sessionId, enrollment.student_id, startTime.toISOString()]
              );
            }
          }
        }
      }
    }
    console.log(`✅ Created ${sessionsCreated.length} attendance sessions with records\n`);

    // 7. Create Assessments and Marks
    console.log("📋 Creating Assessments and Marks...");
    const assessmentsCreated = [];

    for (let i = 0; i < courseIds.length; i++) {
      const course = courseIds[i];
      const assessmentTypes = ["internal_exam", "assignment", "quiz", "lab"];

      // Create 2-3 assessments per course
      for (let j = 0; j < 3; j++) {
        const assessmentType = assessmentTypes[j % assessmentTypes.length];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (j * 7)); // 7 days apart

        const assessmentResult = await query(
          `INSERT INTO campus360_dev.assessments 
           (id, course_id, title, type, max_marks, weightage, due_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            uuidv4(),
            course.id,
            `${course.code} - ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} ${j + 1}`,
            assessmentType,
            100,
            10 + j * 5, // Weightage: 10, 15, 20
            dueDate.toISOString(),
          ]
        );

        const assessmentId = assessmentResult.rows[0].id;
        assessmentsCreated.push(assessmentId);

        // Add marks for enrolled students
        const enrolledStudents = await query(
          `SELECT student_id FROM campus360_dev.enrollments WHERE course_id = $1`,
          [course.id]
        );

        for (const enrollment of enrolledStudents.rows) {
          // Random marks between 60-95
          const marksObtained = Math.floor(Math.random() * 35) + 60;

          await query(
            `INSERT INTO campus360_dev.assessment_marks 
             (id, assessment_id, student_id, marks_obtained)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [uuidv4(), assessmentId, enrollment.student_id, marksObtained]
          );
        }
      }
    }
    console.log(`✅ Created ${assessmentsCreated.length} assessments with marks\n`);

    // 8. Create Placement Posts
    console.log("💼 Creating Placement Posts...");
    const placementPosts = [
      {
        title: "Software Engineer Intern",
        company_name: "Tech Corp",
        job_type: "internship",
        package: "8 LPA",
        required_skills: ["JavaScript", "React", "Node.js"],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: "Looking for motivated interns to join our development team.",
      },
      {
        title: "Full Stack Developer",
        company_name: "StartupXYZ",
        job_type: "fulltime",
        package: "15 LPA",
        required_skills: ["Python", "Django", "PostgreSQL", "AWS"],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        description: "Join our fast-growing startup as a full stack developer.",
      },
      {
        title: "Data Science Intern",
        company_name: "DataTech Inc",
        job_type: "internship",
        package: "10 LPA",
        required_skills: ["Python", "Machine Learning", "SQL"],
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        description: "Work on real-world data science projects.",
      },
    ];

    const placementPostIds = [];
    for (const post of placementPosts) {
      // Use first faculty as creator
      const result = await query(
        `INSERT INTO campus360_dev.placement_posts 
         (id, created_by, title, company_name, job_type, package, required_skills, deadline, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          uuidv4(),
          facultyIds[0].id,
          post.title,
          post.company_name,
          post.job_type,
          post.package,
          post.required_skills,
          post.deadline.toISOString(),
          post.description,
        ]
      );
      placementPostIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${placementPostIds.length} placement posts\n`);

    // 9. Create Placement Applications
    console.log("📄 Creating Placement Applications...");
    let applicationCount = 0;
    const statuses = ["applied", "shortlisted", "selected", "rejected"];

    for (let i = 0; i < placementPostIds.length; i++) {
      const postId = placementPostIds[i];
      // Each post gets 2-4 applications
      const numApplications = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < numApplications && j < studentIds.length; j++) {
        const student = studentIds[j];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await query(
          `INSERT INTO campus360_dev.placement_applications 
           (id, post_id, student_id, resume_url, status, applied_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            uuidv4(),
            postId,
            student.id,
            `https://example.com/resumes/${student.email}.pdf`,
            status,
            new Date(Date.now() - j * 24 * 60 * 60 * 1000).toISOString(), // Staggered dates
          ]
        );
        applicationCount++;
      }
    }
    console.log(`✅ Created ${applicationCount} placement applications\n`);

    // Print Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Student & Faculty Mock Data Seeded Successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   - Faculty: ${facultyIds.length}`);
    console.log(`   - Students: ${studentIds.length}`);
    console.log(`   - Courses: ${courseIds.length}`);
    console.log(`   - Enrollments: ${enrollmentCount}`);
    console.log(`   - Timetable entries: ${timetableCount}`);
    console.log(`   - Attendance sessions: ${sessionsCreated.length}`);
    console.log(`   - Assessments: ${assessmentsCreated.length}`);
    console.log(`   - Placement posts: ${placementPostIds.length}`);
    console.log(`   - Placement applications: ${applicationCount}`);

    console.log("\n🔐 Login Credentials:");
    console.log("\n   Faculty Accounts:");
    facultyIds.forEach((fac, idx) => {
      console.log(`   ${idx + 1}. ${fac.name}`);
      console.log(`      Email: ${fac.email}`);
      console.log(`      Password: ${fac.password}`);
    });

    console.log("\n   Student Accounts:");
    studentIds.slice(0, 5).forEach((stu, idx) => {
      console.log(`   ${idx + 1}. ${stu.name}`);
      console.log(`      Email: ${stu.email}`);
      console.log(`      Password: ${stu.password}`);
      console.log(`      Roll: ${stu.roll_number}, Year: ${stu.student_year}, Section: ${stu.section}`);
    });
    console.log(`   ... and ${studentIds.length - 5} more students`);
    console.log("\n💡 Note: You need to sign up these users in Supabase first!");
    console.log("   Use the signup page or Supabase Dashboard to create accounts.\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seedStudentFacultyData();

