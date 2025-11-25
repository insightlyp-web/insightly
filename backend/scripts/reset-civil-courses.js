import { query } from "../src/config/db.js";
import { upsertMultipleFaculty } from "../src/services/facultyService.js";
import { upsertMultipleCourses } from "../src/services/courseService.js";

const department = "Civil";
const metadata = {
  year: 4,
  academic_year: "2025-26",
  semester: 1,
};

const desiredCourses = [
  {
    subject_code: "22EC301PC",
    subject_name: "Analog Circuits",
    subject_type: "Theory",
    faculty_name: "P.S.Sreenivas Reddy",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC302PC",
    subject_name: "Network analysis and Synthesis",
    subject_type: "Theory",
    faculty_name: "DR. S REKHA",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC303PC",
    subject_name: "Digital Logic Design",
    subject_type: "Theory",
    faculty_name: "V. V. NANDINI",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC304PC",
    subject_name: "Signals and Systems",
    subject_type: "Theory",
    faculty_name: "Sravankumar Vittapu",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC305PC",
    subject_name: "Probability Theory and Stochastic Processes",
    subject_type: "Theory",
    faculty_name: "KANDUKURI SRINIVAS",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC306PC",
    subject_name: "Analog Circuits Laboratory",
    subject_type: "Lab",
    faculty_name: "KANDUKURI SRINIVAS",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC307PC",
    subject_name: "Digital logic Design Laboratory",
    subject_type: "Lab",
    faculty_name: "V. V. NANDINI",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22EC308PC",
    subject_name: "Basic Simulation Laboratory",
    subject_type: "Lab",
    faculty_name: "Sravankumar Vittapu",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "22MC309CI",
    subject_name: "Constitution of India",
    subject_type: "Theory",
    faculty_name: "Dr. V V Y R Thulasi",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "ECE21LIB",
    subject_name: "LIBRARY",
    subject_type: "Others",
    faculty_name: "Sravankumar Vittapu",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "ECE21SPORT",
    subject_name: "SPORTS HOUR",
    subject_type: "Others",
    faculty_name: "P.S.Sreenivas Reddy",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
  {
    subject_code: "ECE21DAA",
    subject_name: "Department Association Activities",
    subject_type: "Others",
    faculty_name: "P.S.Sreenivas Reddy",
    year: 4,
    academic_year: "2025-26",
    semester: 1,
  },
];

async function resetCourses() {
  try {
    console.log("🧹 Clearing existing Civil courses...");
    const deleteRes = await query(
      `DELETE FROM campus360_dev.courses WHERE department = $1`,
      [department]
    );
    console.log(`   Removed ${deleteRes.rowCount} course rows`);

    console.log("👩‍🏫 Upserting faculty profiles...");
    const facultyNames = Array.from(
      new Set(desiredCourses.map((course) => course.faculty_name.trim()))
    );
    const facultyList = facultyNames.map((name) => ({ name }));
    const facultyResults = await upsertMultipleFaculty(facultyList, department);

    const facultyMap = new Map();
    facultyResults.faculty.forEach((faculty) => {
      facultyMap.set(faculty.full_name.trim().toLowerCase(), faculty.id);
    });

    console.log(
      `   Faculty added: ${facultyResults.added}, updated: ${facultyResults.updated}`
    );

    console.log("📚 Upserting target courses...");
    const normalizedCourses = desiredCourses.map((course) => ({
      ...course,
      faculty_name: course.faculty_name.trim().toLowerCase(),
    }));

    const courseResults = await upsertMultipleCourses(
      normalizedCourses,
      department,
      metadata,
      facultyMap
    );

    console.log(
      `   Courses added: ${courseResults.added}, updated: ${courseResults.updated}`
    );

    console.log("✅ Civil courses have been reset to the requested list.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset courses:", error);
    process.exit(1);
  }
}

resetCourses();
