// scripts/fix-civil-department.js
// Fix department name for Civil Engineering students and courses
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixDepartment() {
  try {
    console.log('🔍 Checking department names...\n');

    // Check what departments exist
    const deptCheck = await query(
      `SELECT DISTINCT department FROM campus360_dev.profiles 
       WHERE role IN ('hod', 'student') 
       ORDER BY department`
    );

    console.log('📋 Existing departments:');
    deptCheck.rows.forEach(row => {
      console.log(`   - "${row.department}"`);
    });
    console.log('');

    // Check Civil Engineering related departments
    const civilCheck = await query(
      `SELECT DISTINCT department FROM campus360_dev.profiles 
       WHERE department ILIKE '%civil%' OR department ILIKE '%ece%'
       ORDER BY department`
    );

    console.log('🏗️  Civil/ECE related departments:');
    civilCheck.rows.forEach(row => {
      console.log(`   - "${row.department}"`);
    });
    console.log('');

    // Get HOD departments
    const hodDepts = await query(
      `SELECT id, full_name, email, department FROM campus360_dev.profiles 
       WHERE role = 'hod'`
    );

    console.log('👨‍💼 HOD profiles:');
    hodDepts.rows.forEach(row => {
      console.log(`   - ${row.full_name} (${row.email}): "${row.department}"`);
    });
    console.log('');

    // Check students with "Civil Engineering"
    const civilStudents = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.profiles 
       WHERE role = 'student' AND department = 'Civil Engineering'`
    );

    console.log(`👥 Students with "Civil Engineering": ${civilStudents.rows[0].count}`);
    console.log('');

    // Check courses with "Civil Engineering"
    const civilCourses = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.courses 
       WHERE department = 'Civil Engineering'`
    );

    console.log(`📚 Courses with "Civil Engineering": ${civilCourses.rows[0].count}`);
    console.log('');

    // Ask what to do
    console.log('💡 Options:');
    console.log('   1. Update all "Civil Engineering" to match HOD department');
    console.log('   2. Show more details');
    console.log('   3. Exit');
    console.log('');

    // For now, let's update to match the most common HOD department or "Civil"
    if (hodDepts.rows.length > 0) {
      const targetDept = hodDepts.rows[0].department;
      console.log(`🔄 Updating to match HOD department: "${targetDept}"\n`);

      // Update students
      const updateStudents = await query(
        `UPDATE campus360_dev.profiles 
         SET department = $1 
         WHERE role = 'student' AND department = 'Civil Engineering'`,
        [targetDept]
      );
      console.log(`✅ Updated ${updateStudents.rowCount} students`);

      // Update courses
      const updateCourses = await query(
        `UPDATE campus360_dev.courses 
         SET department = $1 
         WHERE department = 'Civil Engineering'`,
        [targetDept]
      );
      console.log(`✅ Updated ${updateCourses.rowCount} courses`);

      console.log('\n🎉 Department names fixed!');
      console.log(`   All data now uses: "${targetDept}"`);
    } else {
      console.log('⚠️  No HOD found. Please create an HOD profile first.');
    }

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

