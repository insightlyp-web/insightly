// scripts/migrate-to-separate-tables.js
// Migration script to move data from profiles table to separate role-based tables
import { query } from "../src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateData() {
  try {
    console.log("🔄 Starting migration to separate role-based tables...\n");

    // 1. Migrate students
    console.log("📚 Migrating students...");
    const studentsResult = await query(
      `INSERT INTO campus360_dev.students 
       (id, full_name, email, phone, department, academic_year, student_year, section, roll_number, hall_ticket, resume_json, resume_url)
       SELECT id, full_name, email, phone, department, academic_year, student_year, section, roll_number, 
              NULL as hall_ticket, resume_json, resume_url
       FROM campus360_dev.profiles
       WHERE role = 'student'
       ON CONFLICT (id) DO NOTHING
       RETURNING id`
    );
    console.log(`✅ Migrated ${studentsResult.rows.length} students\n`);

    // 2. Migrate faculty
    console.log("👨‍🏫 Migrating faculty...");
    const facultyResult = await query(
      `INSERT INTO campus360_dev.faculty 
       (id, full_name, email, phone, department)
       SELECT id, full_name, email, phone, department
       FROM campus360_dev.profiles
       WHERE role = 'faculty'
       ON CONFLICT (id) DO NOTHING
       RETURNING id`
    );
    console.log(`✅ Migrated ${facultyResult.rows.length} faculty\n`);

    // 3. Migrate HOD
    console.log("👔 Migrating HOD...");
    const hodResult = await query(
      `INSERT INTO campus360_dev.hod 
       (id, full_name, email, phone, department)
       SELECT id, full_name, email, phone, department
       FROM campus360_dev.profiles
       WHERE role = 'hod'
       ON CONFLICT (id) DO NOTHING
       RETURNING id`
    );
    console.log(`✅ Migrated ${hodResult.rows.length} HODs\n`);

    // 4. Migrate admin
    console.log("🔧 Migrating admin...");
    const adminResult = await query(
      `INSERT INTO campus360_dev.admin 
       (id, full_name, email, phone)
       SELECT id, full_name, email, phone
       FROM campus360_dev.profiles
       WHERE role = 'admin'
       ON CONFLICT (id) DO NOTHING
       RETURNING id`
    );
    console.log(`✅ Migrated ${adminResult.rows.length} admins\n`);

    console.log("✅ Migration completed successfully!");
    console.log("\n⚠️  Note: You'll need to update all foreign key references in the application code.");
    console.log("   The profiles table can be kept for backward compatibility or removed after verification.");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateData().then(() => process.exit(0));

