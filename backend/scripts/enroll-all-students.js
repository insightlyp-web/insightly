import { query } from "../src/config/db.js";

const SUBJECT_CODES = [
  "22EC301PC",
  "22EC302PC",
  "22EC303PC",
  "22EC304PC",
  "22EC305PC",
  "22EC306PC",
  "22EC307PC",
  "22EC308PC",
  "22MC309CI",
  "ECE21LIB",
  "ECE21SPORT",
  "ECE21DAA"
];

async function enrollAllStudents() {
  try {
    console.log("🔄 Fetching target courses...");
    const coursesRes = await query(
      `SELECT id, code FROM campus360_dev.courses WHERE code = ANY($1)`,
      [SUBJECT_CODES]
    );
    const courseMap = new Map();
    coursesRes.rows.forEach((row) => courseMap.set(row.code, row.id));

    const missingCodes = SUBJECT_CODES.filter((code) => !courseMap.has(code));
    if (missingCodes.length) {
      console.warn("⚠️ Missing courses for codes:", missingCodes.join(", "));
    }

    const courseIds = Array.from(courseMap.values());
    if (courseIds.length === 0) {
      console.error("❌ No courses found. Aborting.");
      process.exit(1);
    }

    console.log(`✅ Found ${courseIds.length} courses`);

    console.log("🔄 Fetching students...");
    const studentsRes = await query(
      `SELECT id, full_name, department FROM campus360_dev.profiles WHERE role = 'student'`
    );

    console.log(`✅ Found ${studentsRes.rows.length} students`);

    let inserted = 0;
    let skipped = 0;

    for (const student of studentsRes.rows) {
      for (const courseId of courseIds) {
        try {
          const result = await query(
            `INSERT INTO campus360_dev.enrollments (student_id, course_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, course_id) DO NOTHING`,
            [student.id, courseId]
          );
          if (result.rowCount > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch (err) {
          console.error(
            `❌ Failed enrollment for student ${student.id} into course ${courseId}:`,
            err.message
          );
        }
      }
    }

    console.log("\n🎉 Enrollment complete!");
    console.log(`   ➕ Inserted: ${inserted}`);
    console.log(`   ↺ Already existed: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Enrollment script failed:", err);
    process.exit(1);
  }
}

enrollAllStudents();
