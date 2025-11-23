// create_hod_user.js - Script to create HOD user
import { createClient } from '@supabase/supabase-js';
import { query } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wekemzpplaowqdxyjgmt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const HOD_EMAIL = process.argv[2] || 'hod@campusai.com';
const HOD_PASSWORD = process.argv[3] || 'HOD123!@#';
const HOD_DEPARTMENT = process.argv[4] || 'CS';

async function createHODUser() {
  console.log('Creating HOD user...');
  console.log(`Email: ${HOD_EMAIL}`);
  console.log(`Department: ${HOD_DEPARTMENT}`);
  console.log('');

  try {
    // Step 1: Create user in Supabase Auth
    console.log('Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: HOD_EMAIL,
      password: HOD_PASSWORD,
      options: {
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      // User might already exist, try to sign in
      if (authError.message.includes('already registered')) {
        console.log('User already exists in Supabase Auth. Signing in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: HOD_EMAIL,
          password: HOD_PASSWORD
        });

        if (signInError) {
          console.error('Error signing in:', signInError.message);
          console.log('\nPlease create the user manually in Supabase Dashboard:');
          console.log('1. Go to https://supabase.com/dashboard/project/wekemzpplaowqdxyjgmt');
          console.log('2. Authentication > Users > Add user');
          console.log(`3. Email: ${HOD_EMAIL}, Password: ${HOD_PASSWORD}`);
          console.log('4. Check "Auto Confirm User"');
          process.exit(1);
        }

        const userId = signInData.user.id;
        console.log(`✓ User found. ID: ${userId}`);

        // Step 2: Create/Update profile in database
        console.log('\nStep 2: Creating profile in database...');
        await query(
          `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE 
           SET role = 'hod', department = EXCLUDED.department, full_name = EXCLUDED.full_name`,
          [userId, 'HOD User', HOD_EMAIL, 'hod', HOD_DEPARTMENT, '1234567890']
        );

        console.log('✓ Profile created/updated in database');
        console.log('\n==========================================');
        console.log('✅ HOD User Created Successfully!');
        console.log('==========================================');
        console.log(`Email: ${HOD_EMAIL}`);
        console.log(`Password: ${HOD_PASSWORD}`);
        console.log(`Department: ${HOD_DEPARTMENT}`);
        console.log('\nYou can now login at http://localhost:3000/login');
        process.exit(0);
      } else {
        throw authError;
      }
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    const userId = authData.user.id;
    console.log(`✓ User created in Supabase Auth. ID: ${userId}`);

    // Step 2: Create profile in database
    console.log('\nStep 2: Creating profile in database...');
    await query(
      `INSERT INTO campus360_dev.profiles (id, full_name, email, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE 
       SET role = 'hod', department = EXCLUDED.department`,
      [userId, 'HOD User', HOD_EMAIL, 'hod', HOD_DEPARTMENT, '1234567890']
    );

    console.log('✓ Profile created in database');

    console.log('\n==========================================');
    console.log('✅ HOD User Created Successfully!');
    console.log('==========================================');
    console.log(`Email: ${HOD_EMAIL}`);
    console.log(`Password: ${HOD_PASSWORD}`);
    console.log(`Department: ${HOD_DEPARTMENT}`);
    console.log('\nNote: If email confirmation is required, confirm it in Supabase Dashboard');
    console.log('You can now login at http://localhost:3000/login');

  } catch (error) {
    console.error('\n✗ Error creating HOD user:', error.message);
    console.log('\nManual steps:');
    console.log('1. Create user in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/wekemzpplaowqdxyjgmt');
    console.log('   Authentication > Users > Add user');
    console.log(`   Email: ${HOD_EMAIL}`);
    console.log(`   Password: ${HOD_PASSWORD}`);
    console.log('   Check "Auto Confirm User"');
    console.log('\n2. Then run this SQL in your database:');
    console.log(`   INSERT INTO campus360_dev.profiles (id, full_name, email, role, department)`);
    console.log(`   VALUES ('USER_ID_FROM_SUPABASE', 'HOD User', '${HOD_EMAIL}', 'hod', '${HOD_DEPARTMENT}');`);
    process.exit(1);
  }
}

createHODUser();

