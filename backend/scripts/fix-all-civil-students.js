// scripts/fix-all-civil-students.js
// Fix all Civil Engineering students to department "Civil"
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixAllStudents() {
  try {
    console.log('🔍 Fixing all Civil Engineering students...\n');

    // Get all students that might be Civil Engineering (by hall ticket pattern or recent creation)
    const students = await query(
      `SELECT id, full_name, email, department 
       FROM campus360_dev.profiles 
       WHERE role = 'student' 
       AND department = 'CS'
       AND (email LIKE '%247Z1A%' OR email LIKE '%237Z1A%' OR email LIKE '%Z1A%')
       ORDER BY created_at DESC`
    );

    console.log(`📋 Found ${students.rows.length} students to update\n`);

    if (students.rows.length === 0) {
      console.log('⚠️  No students found matching the pattern.');
      console.log('   Checking all CS students...\n');
      
      const allCS = await query(
        `SELECT COUNT(*) as count FROM campus360_dev.profiles 
         WHERE role = 'student' AND department = 'CS'`
      );
      console.log(`   Total CS students: ${allCS.rows[0].count}`);
      
      // Show first few
      const sample = await query(
        `SELECT full_name, email FROM campus360_dev.profiles 
         WHERE role = 'student' AND department = 'CS' 
         LIMIT 5`
      );
      console.log('\n   Sample students:');
      sample.rows.forEach(s => {
        console.log(`     - ${s.full_name} (${s.email})`);
      });
    } else {
      // Update all found students
      for (const student of students.rows) {
        await query(
          `UPDATE campus360_dev.profiles 
           SET department = 'Civil' 
           WHERE id = $1`,
          [student.id]
        );
      }
      console.log(`✅ Updated ${students.rows.length} students to "Civil"`);
    }

    // Update courses
    const updateCourses = await query(
      `UPDATE campus360_dev.courses 
       SET department = 'Civil' 
       WHERE department = 'CS' 
       AND (code LIKE '22EC%' OR code LIKE '22MC%' OR code LIKE 'ECE21%')`
    );
    console.log(`✅ Updated ${updateCourses.rowCount} courses to "Civil"`);

    // Final count
    const finalCount = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.profiles 
       WHERE role = 'student' AND department = 'Civil'`
    );
    console.log(`\n👥 Total students with "Civil": ${finalCount.rows[0].count}`);

    const courseCount = await query(
      `SELECT COUNT(*) as count FROM campus360_dev.courses 
       WHERE department = 'Civil'`
    );
    console.log(`📚 Total courses with "Civil": ${courseCount.rows[0].count}`);

    console.log('\n🎉 Done! The HOD dashboard should now show the data.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixAllStudents()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });

