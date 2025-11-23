// create_admin_user.js
// Creates a Supabase Auth user and database profile for an admin/placement officer
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

// Admin credentials (can be customized)
const ADMIN_EMAIL = process.argv[2] || 'admin@campusai.com';
const ADMIN_PASSWORD = process.argv[3] || 'admin123';
const ADMIN_NAME = process.argv[4] || 'Admin User';

async function createAdminUser() {
  try {
    console.log('🔐 Creating Admin/Placement Officer user...\n');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Name: ${ADMIN_NAME}\n`);

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

    let authUserId;

    if (existingUser) {
      console.log(`⏭️  User ${ADMIN_EMAIL} already exists in Supabase Auth`);
      authUserId = existingUser.id;
      
      // Check if profile exists
      const profileCheck = await query(
        `SELECT id, role FROM campus360_dev.profiles WHERE id = $1 OR email = $2`,
        [authUserId, ADMIN_EMAIL]
      );

      if (profileCheck.rows.length > 0) {
        const profile = profileCheck.rows[0];
        if (profile.role === 'admin') {
          console.log('✅ Admin profile already exists in database');
          console.log('\n' + '='.repeat(60));
          console.log('✅ Admin User Ready!');
          console.log('='.repeat(60));
          console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
          console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
          console.log(`\n💡 You can now log in at http://localhost:3002/login\n`);
          process.exit(0);
        } else {
          // Update existing profile to admin
          await query(
            `UPDATE campus360_dev.profiles 
             SET role = 'admin', full_name = $1
             WHERE id = $2`,
            [ADMIN_NAME, authUserId]
          );
          console.log('✅ Updated existing profile to admin role');
        }
      } else {
        // Create profile
        await query(
          `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
           VALUES ($1, $2, $3, 'admin', $4, $5)`,
          [authUserId, ADMIN_NAME, ADMIN_EMAIL, 'CS', '']
        );
        console.log('✅ Created admin profile in database');
      }
    } else {
      // Create user in Supabase Auth
      console.log(`📝 Creating Supabase Auth user...`);
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: ADMIN_NAME,
          role: 'admin'
        }
      });

      if (createError) {
        console.error(`❌ Error creating user: ${createError.message}`);
        process.exit(1);
      }

      authUserId = authUser.user.id;
      console.log(`✅ Created Supabase Auth user with ID: ${authUserId}`);

      // Create profile in database
      console.log(`📝 Creating admin profile in database...`);
      await query(
        `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
         VALUES ($1, $2, $3, 'admin', $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET role = 'admin', full_name = EXCLUDED.full_name, email = EXCLUDED.email`,
        [authUserId, ADMIN_NAME, ADMIN_EMAIL, 'CS', '']
      );
      console.log(`✅ Created admin profile in database`);
    }

    // Verify the setup
    const verify = await query(
      `SELECT id, full_name, email, role, department 
       FROM campus360_dev.profiles 
       WHERE id = $1 AND role = 'admin'`,
      [authUserId]
    );

    if (verify.rows.length === 0) {
      throw new Error('Profile verification failed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Admin User Created Successfully!');
    console.log('='.repeat(60));
    console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`👤 Name: ${ADMIN_NAME}`);
    console.log(`🆔 User ID: ${authUserId}`);
    console.log(`\n💡 You can now log in at http://localhost:3002/login`);
    console.log(`   After login, you'll be redirected to /admin/dashboard\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

createAdminUser();

