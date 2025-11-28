// scripts/fix-civil-department-correct.js
// Fix department name to "Civil" for Civil Engineering students and courses
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixDepartment() {
  try {
    console.log('🔍 Fixing department names to "Civil"...\n');

    // Update students from "CS" back to "Civil"
    const updateStudents = await query(
      `UPDATE campus360_dev.profiles 
       SET department = 'Civil' 
       WHERE role = 'student' 
       AND department = 'CS' 
       AND (full_name LIKE '%PAVAN%' OR full_name LIKE '%ASHWINI%' OR email LIKE '%247Z1A%')`,
      []
    );
    console.log(`✅ Updated ${updateStudents.rowCount} students to "Civil"`);

    // Update courses from "CS" back to "Civil" (courses with Civil Engineering codes)
    const updateCourses = await query(
      `UPDATE campus360_dev.courses 
       SET department = 'Civil' 
       WHERE department = 'CS' 
       AND (code LIKE '22EC%' OR code LIKE '22MC%' OR code LIKE 'ECE21%')`,
      []
    );
    console.log(`✅ Updated ${updateCourses.rowCount} courses to "Civil"`);

    // Verify
    const verifyStudents = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.profiles 
       WHERE role = 'student' AND department = 'Civil'`
    );
    console.log(`\n👥 Students with "Civil": ${verifyStudents.rows[0].count}`);

    const verifyCourses = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.courses 
       WHERE department = 'Civil'`
    );
    console.log(`📚 Courses with "Civil": ${verifyCourses.rows[0].count}`);

    console.log('\n🎉 Department names fixed to "Civil"!');
    console.log('   The HOD dashboard should now show the data.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixDepartment()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });

