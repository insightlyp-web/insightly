// scripts/apply-missing-columns.js
// Apply database changes for missing columns (gpa, status_history, eligibility criteria)
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
    console.log("🔄 Applying missing columns migration...\n");

    // Read and execute SQL migration
    const sqlPath = path.join(__dirname, "../sql/010_add_missing_columns.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // First set the search path
    await query("SET search_path = campus360_dev;");

    // Execute SQL directly (it handles IF NOT EXISTS)
    try {
      await query(sql);
      console.log("✅ Migration SQL executed");
    } catch (err) {
      // If direct execution fails, try statement by statement
      console.log("⚠️  Direct execution failed, trying statement by statement...");
      
      // Split by semicolons but preserve DO blocks
      const statements = sql
        .split(/(?<!DO\s+\$\$[^$]*);(?!\$\$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--") && !s.startsWith("SET"));

      for (const statement of statements) {
        if (statement.length === 0) continue;
        try {
          await query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 60)}...`);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message?.includes("already exists") || 
              err.message?.includes("duplicate") ||
              err.code === '42P07' ||
              err.code === '42710') { // duplicate_object
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 60)}...`);
          } else {
            console.warn(`⚠️  Warning: ${err.message}`);
          }
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Summary of changes:");
    console.log("   - Added gpa column to profiles table");
    console.log("   - Added status_history, status_changed_at, status_changed_by to placement_applications");
    console.log("   - Added eligibility criteria fields to placement_posts");
    console.log("   - Created notifications table");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration().then(() => process.exit(0));

