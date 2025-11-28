// scripts/import-civil-attendance.js
// Import attendance data for 2nd year Civil Engineering students
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Subject code mapping (short_name -> full_code)
const SUBJECT_CODE_MAP = {
  "AC": "22EC301PC",
  "NAS": "22EC302PC",
  "DLD": "22EC303PC",
  "SS": "22EC304PC",
  "PTSP": "22EC305PC",
  "AC-Lab": "22EC306PC",
  "DLD-Lab": "22EC307PC",
  "BS-Lab": "22EC308PC",
  "Col": "22MC309C",
  "LIB/SCM": "ECE21LIB",
  "SPORTS": "ECE21SPOF",
  "DAA": "ECE21DAA"
};

// Subject full names
const SUBJECT_NAMES = {
  "22EC301PC": "Analog Circuits",
  "22EC302PC": "Network Analysis and Synthesis",
  "22EC303PC": "Digital Logic Design",
  "22EC304PC": "Signals and Systems",
  "22EC305PC": "Probability Theory and Stochastic Processes",
  "22EC306PC": "Analog Circuits Laboratory",
  "22EC307PC": "Digital Logic Design Laboratory",
  "22EC308PC": "Basic Skills Laboratory",
  "22MC309C": "Co-curricular",
  "ECE21LIB": "Library/Self-Study/Co-curricular Module",
  "ECE21SPOF": "Sports and Physical Education",
  "ECE21DAA": "Design and Analysis of Algorithms"
};

async function importAttendanceData() {
  try {
    console.log('📊 Starting attendance data import...\n');

    // Load total classes data
    const totalClassesPath = join(__dirname, '../data/civil-2yr-total-classes.json');
    const totalClassesData = JSON.parse(readFileSync(totalClassesPath, 'utf8'));
    console.log('✅ Loaded total classes data\n');

    // Load attendance data
    const attendancePath = join(__dirname, '../data/civil-2yr-attendance.json');
    let attendanceData;
    try {
      attendanceData = JSON.parse(readFileSync(attendancePath, 'utf8'));
    } catch (err) {
      console.error('❌ Error: Could not find civil-2yr-attendance.json');
      console.log('📝 Please create the attendance data file based on civil-2yr-attendance-template.json');
      console.log('   Add all student records with their attendance data.');
      process.exit(1);
    }
    console.log(`✅ Loaded attendance data for ${attendanceData.students.length} students\n`);

    const department = attendanceData.department || "Civil Engineering";
    const year = attendanceData.year || 2;
    const academicYear = attendanceData.academic_year || "2022-2024";

    // Step 1: Get or create faculty for courses
    console.log('👨‍🏫 Setting up faculty...');
    const facultyRes = await query(
      `SELECT id FROM campus360_dev.profiles 
       WHERE role = 'faculty' AND department = $1 
       LIMIT 1`,
      [department]
    );

    let facultyId;
    if (facultyRes.rows.length === 0) {
      console.log('⚠️  No faculty found. Creating a default faculty...');
      const newFaculty = await query(
        `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department)
         VALUES (gen_random_uuid(), $1, $2, 'faculty', $3)
         RETURNING id`,
        [`Default Faculty - ${department}`, `faculty-${department.toLowerCase()}@insightly.com`, department]
      );
      facultyId = newFaculty.rows[0].id;
      console.log(`✅ Created faculty: ${facultyId}`);
    } else {
      facultyId = facultyRes.rows[0].id;
      console.log(`✅ Using existing faculty: ${facultyId}`);
    }
    console.log('');

    // Step 2: Create or update courses
    console.log('📚 Creating/updating courses...');
    const courseMap = new Map();
    const subjectCodes = Object.values(SUBJECT_CODE_MAP);

    for (const code of subjectCodes) {
      const shortName = Object.keys(SUBJECT_CODE_MAP).find(k => SUBJECT_CODE_MAP[k] === code);
      const name = SUBJECT_NAMES[code] || code;
      const totalClasses = totalClassesData.total_classes_completed[code]?.total_classes || 0;

      // Check if course exists first
      let courseRes = await query(
        `SELECT id FROM campus360_dev.courses WHERE code = $1 AND department = $2`,
        [code, department]
      );

      if (courseRes.rows.length === 0) {
        // Create new course
        courseRes = await query(
          `INSERT INTO campus360_dev.courses (id, code, name, department, year, academic_year, faculty_id)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
           RETURNING id, code`,
          [code, name, department, year, academicYear, facultyId]
        );
      } else {
        // Update existing course
        await query(
          `UPDATE campus360_dev.courses 
           SET name = $1, year = $2, academic_year = $3, faculty_id = $4
           WHERE code = $5 AND department = $6`,
          [name, year, academicYear, facultyId, code, department]
        );
        courseRes = { rows: [{ id: courseRes.rows[0].id, code: code }] };
      }

      courseMap.set(code, {
        id: courseRes.rows[0].id,
        code: courseRes.rows[0].code,
        totalClasses: totalClasses
      });
      console.log(`  ✓ ${code} - ${name} (${totalClasses} classes)`);
    }
    console.log(`✅ Processed ${courseMap.size} courses\n`);

    // Step 3: Create or update student profiles
    console.log('👥 Creating/updating student profiles...');
    const studentMap = new Map();
    let studentsCreated = 0;
    let studentsUpdated = 0;

    for (const student of attendanceData.students) {
      const email = `${student.hall_ticket.toLowerCase()}@insightly.com`;
      
      // Check if student exists by hall ticket or email
      const existing = await query(
        `SELECT id, full_name FROM campus360_dev.profiles 
         WHERE email = $1 OR (role = 'student' AND full_name = $2)`,
        [email, student.name]
      );

      let studentId;
      if (existing.rows.length > 0) {
        studentId = existing.rows[0].id;
        // Update student info
        await query(
          `UPDATE campus360_dev.profiles 
           SET full_name = $1, phone = $2, department = $3, student_year = $4, academic_year = $5
           WHERE id = $6`,
          [student.name, student.mobile, department, "II", academicYear, studentId]
        );
        studentsUpdated++;
      } else {
        // Create new student
        const newStudent = await query(
          `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone, student_year, academic_year)
           VALUES (gen_random_uuid(), $1, $2, 'student', $3, $4, $5, $6)
           RETURNING id`,
          [student.name, email, department, student.mobile, "II", academicYear]
        );
        studentId = newStudent.rows[0].id;
        studentsCreated++;
      }

      studentMap.set(student.hall_ticket, {
        id: studentId,
        name: student.name,
        hall_ticket: student.hall_ticket
      });
    }

    console.log(`✅ Created ${studentsCreated} new students`);
    console.log(`✅ Updated ${studentsUpdated} existing students`);
    console.log(`✅ Total students: ${studentMap.size}\n`);

    // Step 4: Create enrollments
    console.log('📝 Creating enrollments...');
    let enrollmentsCreated = 0;
    let enrollmentsSkipped = 0;

    for (const student of attendanceData.students) {
      const studentId = studentMap.get(student.hall_ticket)?.id;
      if (!studentId) {
        console.warn(`⚠️  Student not found: ${student.hall_ticket}`);
        continue;
      }

      for (const [shortName, code] of Object.entries(SUBJECT_CODE_MAP)) {
        if (student.attendance[shortName] !== undefined) {
          const courseId = courseMap.get(code)?.id;
          if (!courseId) {
            console.warn(`⚠️  Course not found: ${code}`);
            continue;
          }

          try {
            const result = await query(
              `INSERT INTO campus360_dev.enrollments (student_id, course_id)
               VALUES ($1, $2)
               ON CONFLICT (student_id, course_id) DO NOTHING`,
              [studentId, courseId]
            );
            if (result.rowCount > 0) {
              enrollmentsCreated++;
            } else {
              enrollmentsSkipped++;
            }
          } catch (err) {
            console.error(`❌ Failed enrollment: ${student.hall_ticket} -> ${code}`, err.message);
          }
        }
      }
    }

    console.log(`✅ Created ${enrollmentsCreated} new enrollments`);
    console.log(`⏭️  Skipped ${enrollmentsSkipped} existing enrollments\n`);

    // Step 5: Create attendance sessions and records
    console.log('📅 Creating attendance sessions and records...');
    const today = new Date();
    let sessionsCreated = 0;
    let recordsCreated = 0;

    for (const [shortName, code] of Object.entries(SUBJECT_CODE_MAP)) {
      const course = courseMap.get(code);
      if (!course) continue;

      const totalClasses = course.totalClasses;
      if (totalClasses === 0) continue;

      // Create attendance sessions for this course
      // We'll create one session per class (simplified approach)
      // In reality, you might want to create sessions based on actual dates
      for (let classNum = 1; classNum <= totalClasses; classNum++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() - (totalClasses - classNum)); // Spread sessions over past days

        const startTime = new Date(sessionDate);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(sessionDate);
        endTime.setHours(10, 30, 0, 0);

        const sessionCode = `${code}-${classNum}-${sessionDate.toISOString().split('T')[0]}`;

        try {
          const sessionRes = await query(
            `INSERT INTO campus360_dev.attendance_sessions 
             (id, faculty_id, course_id, session_code, start_time, end_time, location_required)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, false)
             ON CONFLICT (session_code) DO NOTHING
             RETURNING id`,
            [facultyId, course.id, sessionCode, startTime, endTime]
          );

          if (sessionRes.rows.length > 0) {
            const sessionId = sessionRes.rows[0].id;
            sessionsCreated++;

            // Create attendance records for students who attended this class
            for (const student of attendanceData.students) {
              const studentId = studentMap.get(student.hall_ticket)?.id;
              if (!studentId) continue;

              const attendedClasses = student.attendance[shortName] || 0;
              
              // If this class number is within the attended classes, mark as present
              if (classNum <= attendedClasses) {
                try {
                  await query(
                    `INSERT INTO campus360_dev.attendance_records (session_id, student_id, timestamp)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (session_id, student_id) DO NOTHING`,
                    [sessionId, studentId, startTime]
                  );
                  recordsCreated++;
                } catch (err) {
                  // Ignore duplicate errors
                }
              }
            }
          }
        } catch (err) {
          console.error(`❌ Failed to create session: ${code} class ${classNum}`, err.message);
        }
      }
    }

    console.log(`✅ Created ${sessionsCreated} attendance sessions`);
    console.log(`✅ Created ${recordsCreated} attendance records\n`);

    // Summary
    console.log('🎉 Import completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Courses: ${courseMap.size}`);
    console.log(`   - Students: ${studentMap.size}`);
    console.log(`   - Enrollments: ${enrollmentsCreated} new, ${enrollmentsSkipped} existing`);
    console.log(`   - Sessions: ${sessionsCreated}`);
    console.log(`   - Attendance Records: ${recordsCreated}`);

  } catch (error) {
    console.error('❌ Error importing attendance data:', error);
    throw error;
  }
}

// Run the import
importAttendanceData()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  });

