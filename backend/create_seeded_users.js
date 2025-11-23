// create_seeded_users.js
// Creates Supabase Auth users for all seeded student and faculty accounts
import { createClient } from '@supabase/supabase-js';
import { query } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key for admin operations (create users without email confirmation)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wekemzpplaowqdxyjgmt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  console.log('\nTo get your service role key:');
  console.log('1. Go to https://supabase.com/dashboard/project/wekemzpplaowqdxyjgmt/settings/api');
  console.log('2. Copy the "service_role" key (keep it secret!)');
  console.log('3. Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

// Create Supabase admin client (with service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSeededUsers() {
  try {
    console.log('🔐 Creating Supabase Auth users for seeded accounts...\n');

    // Get all seeded users from database
    const students = await query(
      `SELECT id, full_name, email, role, department, academic_year, student_year, section, roll_number
       FROM campus360_dev.profiles 
       WHERE role IN ('student', 'faculty')
       AND email LIKE '%@campusai.com'
       ORDER BY role, email`
    );

    if (students.rows.length === 0) {
      console.log('⚠️  No seeded users found in database.');
      console.log('   Run "npm run seed:student-faculty" first.\n');
      process.exit(1);
    }

    console.log(`Found ${students.rows.length} seeded users in database.\n`);

    const created = [];
    const skipped = [];
    const errors = [];

    for (const user of students.rows) {
      const email = user.email;
      const password = user.role === 'student' ? 'student123' : 'faculty123';
      const displayName = user.full_name;

      try {
        // Check if user already exists in Supabase Auth
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email);

        if (existingUser) {
          console.log(`⏭️  Skipping ${email} (already exists in Supabase)`);
          skipped.push({ email, reason: 'Already exists' });
          
          // Update the profile ID to match Supabase user ID if different
          if (existingUser.id !== user.id) {
            console.log(`   ⚠️  Profile ID mismatch. Updating profile...`);
            await query(
              `UPDATE campus360_dev.profiles 
               SET id = $1 
               WHERE email = $2`,
              [existingUser.id, email]
            );
            console.log(`   ✅ Profile ID updated to match Supabase user ID`);
          }
          continue;
        }

        // Create user in Supabase Auth
        console.log(`📝 Creating ${user.role}: ${email}...`);
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: displayName,
            role: user.role,
            department: user.department
          }
        });

        if (createError) {
          console.error(`   ❌ Error: ${createError.message}`);
          errors.push({ email, error: createError.message });
          continue;
        }

        // Update profile ID to match Supabase user ID
        if (authUser.user.id !== user.id) {
          await query(
            `UPDATE campus360_dev.profiles 
             SET id = $1 
             WHERE email = $2`,
            [authUser.user.id, email]
          );
          console.log(`   ✅ Profile ID updated to match Supabase user ID`);
        }

        console.log(`   ✅ Created successfully!`);
        created.push({ email, role: user.role, name: displayName });

      } catch (err) {
        console.error(`   ❌ Error creating ${email}:`, err.message);
        errors.push({ email, error: err.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created.length} users`);
    console.log(`⏭️  Skipped: ${skipped.length} users (already exist)`);
    console.log(`❌ Errors: ${errors.length} users`);

    if (created.length > 0) {
      console.log('\n✅ Successfully Created Users:');
      created.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(e => {
        console.log(`   - ${e.email}: ${e.error}`);
      });
    }

    console.log('\n🔐 Login Credentials:');
    console.log('   Students: student1@campusai.com / student123');
    console.log('   Faculty: faculty1@campusai.com / faculty123');
    console.log('\n💡 You can now log in at http://localhost:3002/login\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

createSeededUsers();

