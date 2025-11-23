// fix_missing_profile.js
// Script to recreate a missing profile for an existing Supabase user
import { query } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// User info from Supabase
const SUPABASE_USER_ID = process.argv[2] || 'a070876b-bdc8-49a7-afc6-e70be95ad7f8';
const EMAIL = process.argv[3] || 'student1@campusai.com';

// Profile data to recreate (from seed data)
const PROFILE_DATA = {
  full_name: 'Alice Smith',
  email: EMAIL,
  role: 'student',
  department: 'CS',
  phone: '9876500001',
  academic_year: '2024-2025',
  student_year: 'I',
  section: 'A',
  roll_number: 'CS001'
};

async function fixProfile() {
  try {
    console.log(`🔧 Fixing missing profile for user: ${SUPABASE_USER_ID}`);
    console.log(`   Email: ${EMAIL}\n`);

    // Check if profile already exists
    const existing = await query(
      `SELECT id, email, role FROM campus360_dev.profiles WHERE id = $1 OR email = $2`,
      [SUPABASE_USER_ID, EMAIL]
    );

    if (existing.rows.length > 0) {
      const found = existing.rows[0];
      if (found.id === SUPABASE_USER_ID) {
        console.log('✅ Profile already exists with correct ID!');
        console.log(`   Profile: ${found.email}, Role: ${found.role}`);
        process.exit(0);
      } else {
        console.log(`⚠️  Found profile with different ID: ${found.id}`);
        console.log('   This script will create a new profile. You may need to migrate data manually.');
      }
    }

    // Check for unique constraint conflicts
    const rollConflict = await query(
      `SELECT id FROM campus360_dev.profiles 
       WHERE department = $1 
         AND academic_year = $2 
         AND student_year = $3 
         AND section = $4 
         AND roll_number = $5
         AND role = 'student'`,
      [PROFILE_DATA.department, PROFILE_DATA.academic_year, PROFILE_DATA.student_year, PROFILE_DATA.section, PROFILE_DATA.roll_number]
    );

    if (rollConflict.rows.length > 0) {
      console.log(`⚠️  Roll number conflict detected. Clearing conflicting profile's roll number...`);
      await query(
        `UPDATE campus360_dev.profiles 
         SET roll_number = NULL, academic_year = NULL, student_year = NULL, section = NULL
         WHERE id = $1`,
        [rollConflict.rows[0].id]
      );
    }

    // Create the profile
    console.log('📝 Creating profile...');
    await query(
      `INSERT INTO campus360_dev.profiles 
       (id, full_name, email, role, department, phone, academic_year, student_year, section, roll_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        SUPABASE_USER_ID,
        PROFILE_DATA.full_name,
        PROFILE_DATA.email,
        PROFILE_DATA.role,
        PROFILE_DATA.department,
        PROFILE_DATA.phone,
        PROFILE_DATA.academic_year,
        PROFILE_DATA.student_year,
        PROFILE_DATA.section,
        PROFILE_DATA.roll_number
      ]
    );

    // Verify it was created
    const verify = await query(
      `SELECT id, full_name, email, role, department, roll_number 
       FROM campus360_dev.profiles WHERE id = $1`,
      [SUPABASE_USER_ID]
    );

    if (verify.rows.length > 0) {
      console.log('\n✅ Profile created successfully!');
      console.log('   Profile details:');
      console.log(`   - ID: ${verify.rows[0].id}`);
      console.log(`   - Name: ${verify.rows[0].full_name}`);
      console.log(`   - Email: ${verify.rows[0].email}`);
      console.log(`   - Role: ${verify.rows[0].role}`);
      console.log(`   - Department: ${verify.rows[0].department}`);
      console.log(`   - Roll: ${verify.rows[0].roll_number}`);
      console.log('\n💡 You can now log in and access the student dashboard!');
      process.exit(0);
    } else {
      throw new Error('Profile was not created successfully');
    }
  } catch (err) {
    console.error('❌ Error fixing profile:', err.message);
    if (err.code === '23505') {
      console.error('   Unique constraint violation. The profile or roll number may already exist.');
    }
    process.exit(1);
  }
}

fixProfile();

