// seed_student_data.js
// Add mock data for a specific student account
import { query } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Student ID from Supabase
const STUDENT_ID = process.argv[2] || 'a070876b-bdc8-49a7-afc6-e70be95ad7f8';
const STUDENT_EMAIL = process.argv[3] || 'student1@campusai.com';

async function seedStudentData() {
  try {
    console.log(`🌱 Seeding mock data for student: ${STUDENT_EMAIL}`);
    console.log(`   Student ID: ${STUDENT_ID}\n`);

    // Verify student exists
    const studentCheck = await query(
      `SELECT id, full_name, email, department, student_year FROM campus360_dev.profiles WHERE id = $1 AND role = 'student'`,
      [STUDENT_ID]
    );

    if (studentCheck.rows.length === 0) {
      console.error('❌ Student profile not found!');
      console.log('   Please run: npm run fix-profile <student_id> <email>');
      process.exit(1);
    }

    const student = studentCheck.rows[0];
    console.log(`✅ Found student: ${student.full_name}`);
    console.log(`   Department: ${student.department}, Year: ${student.student_year}\n`);

    // 1. Get courses for this student's year
    const studentYear = student.student_year || 'I';
    const yearMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
    const numericYear = yearMap[studentYear] || 1;

    console.log('📚 Finding courses for enrollment...');
    const courses = await query(
      `SELECT id, code, name, year, faculty_id 
       FROM campus360_dev.courses 
       WHERE department = $1 AND (year = $2 OR year = $2 - 1)
       ORDER BY year, code
       LIMIT 5`,
      [student.department, numericYear]
    );

    if (courses.rows.length === 0) {
      console.log('⚠️  No courses found. Creating some courses first...');
      
      // Get a faculty member
      const faculty = await query(
        `SELECT id FROM campus360_dev.profiles WHERE role = 'faculty' AND department = $1 LIMIT 1`,
        [student.department]
      );

      if (faculty.rows.length === 0) {
        console.error('❌ No faculty found. Please seed faculty data first.');
        process.exit(1);
      }

      const facultyId = faculty.rows[0].id;

      // Create some courses
      const courseData = [
        { code: 'CS101', name: 'Introduction to Computer Science', year: 1 },
        { code: 'CS102', name: 'Programming Fundamentals', year: 1 },
        { code: 'CS201', name: 'Data Structures and Algorithms', year: 2 },
      ];

      for (const course of courseData) {
        await query(
          `INSERT INTO campus360_dev.courses (code, name, department, year, faculty_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [course.code, course.name, student.department, course.year, facultyId]
        );
      }

      // Fetch courses again
      const coursesRetry = await query(
        `SELECT id, code, name, year, faculty_id 
         FROM campus360_dev.courses 
         WHERE department = $1 AND (year = $2 OR year = $2 - 1)
         ORDER BY year, code
         LIMIT 5`,
        [student.department, numericYear]
      );
      courses.rows = coursesRetry.rows;
    }

    console.log(`✅ Found ${courses.rows.length} courses\n`);

    // 2. Create Enrollments
    console.log('📝 Creating enrollments...');
    
    // Check existing enrollments
    const existingEnrollments = await query(
      `SELECT course_id FROM campus360_dev.enrollments WHERE student_id = $1`,
      [STUDENT_ID]
    );
    const existingCourseIds = new Set(existingEnrollments.rows.map(r => r.course_id));
    
    let enrollmentCount = 0;
    for (const course of courses.rows) {
      if (existingCourseIds.has(course.id)) {
        console.log(`   ⏭️  Already enrolled in ${course.code} - ${course.name}`);
        enrollmentCount++; // Count existing enrollments too
        continue;
      }
      
      const result = await query(
        `INSERT INTO campus360_dev.enrollments (student_id, course_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [STUDENT_ID, course.id]
      );
      if (result.rowCount > 0) {
        enrollmentCount++;
        console.log(`   ✅ Enrolled in ${course.code} - ${course.name}`);
      }
    }
    console.log(`\n✅ Total enrollments: ${enrollmentCount}\n`);

    // 3. Create Attendance Sessions and Records
    console.log('📊 Creating attendance sessions and records...');
    const today = new Date();
    let sessionCount = 0;
    let attendanceCount = 0;

    for (const course of courses.rows) {
      // Ensure course has a faculty_id
      if (!course.faculty_id) {
        // Get any faculty for this department
        const faculty = await query(
          `SELECT id FROM campus360_dev.profiles WHERE role = 'faculty' AND department = $1 LIMIT 1`,
          [student.department]
        );
        if (faculty.rows.length > 0) {
          course.faculty_id = faculty.rows[0].id;
          // Update the course
          await query(
            `UPDATE campus360_dev.courses SET faculty_id = $1 WHERE id = $2`,
            [course.faculty_id, course.id]
          );
        } else {
          console.log(`   ⚠️  Skipping ${course.code} - no faculty assigned`);
          continue;
        }
      }

      // Check existing sessions for this course
      const existingSessions = await query(
        `SELECT id, session_code FROM campus360_dev.attendance_sessions WHERE course_id = $1 LIMIT 10`,
        [course.id]
      );

      // Use existing sessions or create new ones
      let sessionsToUse = existingSessions.rows;
      
      if (sessionsToUse.length === 0) {
        // Create new sessions
        for (let i = 0; i < 6; i++) {
          const sessionDate = new Date(today);
          sessionDate.setDate(sessionDate.getDate() - (i * 3));

          const startTime = new Date(sessionDate);
          startTime.setHours(9 + (i % 3), 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 1, 30, 0, 0);

          const sessionCode = `SESS-${course.code}-${STUDENT_ID.substring(0, 8)}-${Date.now()}-${i}`;

          const sessionResult = await query(
            `INSERT INTO campus360_dev.attendance_sessions 
             (faculty_id, course_id, session_code, start_time, end_time)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (session_code) DO NOTHING
             RETURNING id`,
            [course.faculty_id, course.id, sessionCode, startTime.toISOString(), endTime.toISOString()]
          );

          if (sessionResult.rows.length > 0) {
            sessionsToUse.push(sessionResult.rows[0]);
            sessionCount++;
          }
        }
      } else {
        sessionCount += sessionsToUse.length;
      }

      // Add attendance records for this student
      for (const session of sessionsToUse) {
        // Check if student already has attendance for this session
        const existingRecord = await query(
          `SELECT id FROM campus360_dev.attendance_records WHERE session_id = $1 AND student_id = $2`,
          [session.id, STUDENT_ID]
        );

        if (existingRecord.rows.length === 0) {
          // Mark attendance (75-90% chance)
          if (Math.random() > 0.15) {
            await query(
              `INSERT INTO campus360_dev.attendance_records (session_id, student_id, timestamp)
               VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              [session.id, STUDENT_ID, new Date().toISOString()]
            );
            attendanceCount++;
          }
        } else {
          attendanceCount++; // Count existing records too
        }
      }
    }
    console.log(`✅ Using ${sessionCount} attendance sessions`);
    console.log(`✅ Marked attendance for ${attendanceCount} sessions\n`);

    // 4. Create Assessments and Marks
    console.log('📋 Creating assessments and marks...');
    let assessmentCount = 0;
    let marksCount = 0;

    for (const course of courses.rows) {
      const assessmentTypes = ['internal_exam', 'assignment', 'quiz', 'lab'];

      // Create 2-3 assessments per course
      for (let j = 0; j < 3; j++) {
        const assessmentType = assessmentTypes[j % assessmentTypes.length];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (j * 7));

        const assessmentResult = await query(
          `INSERT INTO campus360_dev.assessments 
           (course_id, title, type, max_marks, weightage, due_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            course.id,
            `${course.code} - ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} ${j + 1}`,
            assessmentType,
            100,
            10 + j * 5,
            dueDate.toISOString(),
          ]
        );

        if (assessmentResult.rows.length > 0) {
          const assessmentId = assessmentResult.rows[0].id;
          assessmentCount++;

          // Add marks (random between 60-95)
          const marksObtained = Math.floor(Math.random() * 35) + 60;

          await query(
            `INSERT INTO campus360_dev.assessment_marks 
             (assessment_id, student_id, marks_obtained)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [assessmentId, STUDENT_ID, marksObtained]
          );
          marksCount++;
        }
      }
    }
    console.log(`✅ Created ${assessmentCount} assessments`);
    console.log(`✅ Added marks for ${marksCount} assessments\n`);

    // 5. Create Placement Applications (if placements exist)
    console.log('💼 Creating placement applications...');
    const placements = await query(
      `SELECT id FROM campus360_dev.placement_posts 
       ORDER BY created_at DESC 
       LIMIT 3`
    );

    let applicationCount = 0;
    const statuses = ['applied', 'shortlisted', 'selected'];
    for (const placement of placements.rows) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const result = await query(
        `INSERT INTO campus360_dev.placement_applications 
         (post_id, student_id, resume_url, status, applied_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          placement.id,
          STUDENT_ID,
          `https://example.com/resumes/${STUDENT_EMAIL}.pdf`,
          status,
          new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        ]
      );
      if (result.rowCount > 0) {
        applicationCount++;
      }
    }
    console.log(`✅ Created ${applicationCount} placement applications\n`);

    // Summary
    console.log('='.repeat(60));
    console.log('✅ Student Mock Data Seeded Successfully!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary for ${student.full_name}:`);
    console.log(`   - Enrollments: ${enrollmentCount}`);
    console.log(`   - Attendance sessions: ${sessionCount}`);
    console.log(`   - Attendance records: ${attendanceCount}`);
    console.log(`   - Assessments: ${assessmentCount}`);
    console.log(`   - Assessment marks: ${marksCount}`);
    console.log(`   - Placement applications: ${applicationCount}`);
    console.log(`\n💡 The student can now see all this data in their dashboard!\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding student data:', err);
    process.exit(1);
  }
}

seedStudentData();

