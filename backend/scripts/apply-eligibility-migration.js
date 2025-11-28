// scripts/apply-eligibility-migration.js
// Apply database changes for eligibility criteria, status tracking, and notifications
import { query } from "../src/config/db.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  try {
    console.log("🔄 Applying eligibility and notifications migration...\n");

    // Read and execute SQL migration
    const sqlPath = path.join(__dirname, "../sql/009_separate_role_tables.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      try {
        await query(statement);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message?.includes("already exists") && !err.message?.includes("duplicate")) {
          console.warn(`Warning: ${err.message}`);
        }
      }
    }

    console.log("✅ Migration applied successfully!");
    console.log("\n📋 Summary of changes:");
    console.log("   - Added eligibility criteria fields to placement_posts");
    console.log("   - Added status_history and tracking to placement_applications");
    console.log("   - Created notifications table for HOD messages");
    console.log("   - Created separate tables structure (students, faculty, hod, admin)");
    console.log("\n⚠️  Note: The separate tables are created but data migration needs to be run separately.");
    console.log("   Run: node backend/scripts/migrate-to-separate-tables.js");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration().then(() => process.exit(0));

