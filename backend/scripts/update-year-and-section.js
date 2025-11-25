import { query } from "../src/config/db.js";

async function updateYearAndSection() {
  try {
    console.log("🧹 Clearing section data...");
    const sectionRes = await query(
      `UPDATE campus360_dev.profiles SET section = NULL WHERE section IS NOT NULL`
    );
    console.log(`   Sections cleared on ${sectionRes.rowCount} profiles`);

    console.log("🔁 Updating course year to 2 for Civil department...");
    const courseRes = await query(
      `UPDATE campus360_dev.courses SET year = 2 WHERE department = 'Civil'`
    );
    console.log(`   Courses updated: ${courseRes.rowCount}`);

    console.log("🔁 Updating student year to 'II'...");
    const studentRes = await query(
      `UPDATE campus360_dev.profiles SET student_year = 'II' WHERE role = 'student' AND student_year IS DISTINCT FROM 'II'`
    );
    console.log(`   Student profiles updated: ${studentRes.rowCount}`);

    console.log("✅ Year/section update complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to update data:", error);
    process.exit(1);
  }
}

updateYearAndSection();
