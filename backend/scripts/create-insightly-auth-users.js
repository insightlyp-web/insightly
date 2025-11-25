import dotenv from "dotenv";
import { query } from "../src/config/db.js";
import supabaseAdmin from "../src/lib/supabaseAdmin.js";

dotenv.config();

if (!supabaseAdmin) {
  console.error("Supabase admin client is not configured. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

const DEFAULT_STUDENT_PASSWORD = process.env.DEFAULT_STUDENT_PASSWORD || "Student@123";
const DEFAULT_FACULTY_PASSWORD = process.env.DEFAULT_FACULTY_PASSWORD || "Faculty@123";

async function ensureAuthUser(profile) {
  const password = profile.role === "faculty" ? DEFAULT_FACULTY_PASSWORD : DEFAULT_STUDENT_PASSWORD;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      },
    });

    if (error) {
      if (error.message?.includes("already registered")) {
        console.log(`⏭️  ${profile.email} already has an Auth account. Skipping.`);
        return false;
      }
      console.error(`❌ Failed creating ${profile.email}:`, error.message);
      return false;
    }

    console.log(`✅ Created Auth user for ${profile.email} (id: ${data.user.id})`);
    return true;
  } catch (err) {
    console.error(`❌ Failed creating ${profile.email}:`, err.message || err);
    return false;
  }
}

async function main() {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, role, department
       FROM campus360_dev.profiles
       WHERE email LIKE '%@insightly.com'`
    );

    if (rows.length === 0) {
      console.log("No @insightly.com profiles found.");
      process.exit(0);
    }

    console.log(`Found ${rows.length} profiles. Creating Supabase Auth users...`);
    let created = 0;
    let skipped = 0;
    for (const profile of rows) {
      const didCreate = await ensureAuthUser(profile);
      if (didCreate) created++;
      else skipped++;
    }

    console.log("\nSummary:");
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped/failed: ${skipped}`);
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error while creating auth users:", err.message || err);
    process.exit(1);
  }
}

main();
