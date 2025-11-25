import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import dotenv from "dotenv";

import { query } from "../src/config/db.js";
import { parseExcelFile } from "../src/services/excelParser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEFAULT_FILE = "2ndYearStudents(Sem-I).xlsx";

function usage() {
  console.log("Usage: node scripts/seed-attendance-from-excel.js [path/to/file.xlsx]");
  process.exit(1);
}

function getMonthYear(fromDate) {
  if (!fromDate) {
    throw new Error("Metadata missing FromDate. Cannot determine month/year.");
  }
  const date = new Date(fromDate);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid FromDate value: ${fromDate}`);
  }
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  return { month, year };
}

function extractSubjectTotals(sheetRows, subjects) {
  const headerIndex = sheetRows.findIndex((row = []) => {
    return row.some((cell) => {
      if (!cell) return false;
      return String(cell).toUpperCase().includes("NAME / MAX CLASSES");
    });
  });

  if (headerIndex === -1) {
    console.warn("[seed-attendance] Could not locate 'Name / Max Classes' row. Falling back to totals = 0.");
    return new Map();
  }

  const totalsRow = sheetRows[headerIndex];
  const totalsMap = new Map();

  subjects.forEach((subject) => {
    const col = subject.columnIndex;
    if (col === undefined || col === null || col < 0) {
      return;
    }
    const value = totalsRow[col];
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric >= 0) {
      totalsMap.set(subject.subject_code, numeric);
    }
  });

  return totalsMap;
}

async function main() {
  const argPath = process.argv[2];

  if (argPath === "--help" || argPath === "-h") {
    usage();
  }

  const filePath = argPath
    ? path.resolve(argPath)
    : path.resolve(__dirname, "..", DEFAULT_FILE);

  console.log(`📝 Reading Excel: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  const { metadata, subjects, students } = parseExcelFile(
    filePath,
    path.basename(filePath)
  );

  if (!students.length) {
    console.error("No students parsed from file. Aborting.");
    process.exit(1);
  }

  if (!subjects.length) {
    console.error("No subjects parsed from file. Aborting.");
    process.exit(1);
  }

  const subjectTotals = extractSubjectTotals(sheetRows, subjects);
  const { month, year } = getMonthYear(metadata.fromDate);

  console.log(
    `Parsed ${students.length} students, ${subjects.length} subjects. Month=${month}, Year=${year}`
  );

  const uniqueHallTickets = Array.from(
    new Set(students.map((s) => s.hall_ticket).filter(Boolean))
  );

  const studentQuery = await query(
    `SELECT id, roll_number FROM campus360_dev.profiles WHERE roll_number = ANY($1::text[])`,
    [uniqueHallTickets]
  );
  const studentMap = new Map(
    studentQuery.rows.map((row) => [row.roll_number, row.id])
  );

  const missingStudents = uniqueHallTickets.filter(
    (roll) => !studentMap.has(roll)
  );
  if (missingStudents.length) {
    console.warn(
      `[seed-attendance] ${missingStudents.length} students missing in DB:`,
      missingStudents.slice(0, 10)
    );
  }

  const subjectCodes = Array.from(
    new Set(subjects.map((s) => s.subject_code).filter(Boolean))
  );
  const courseQuery = await query(
    `SELECT id, code FROM campus360_dev.courses WHERE code = ANY($1::text[])`,
    [subjectCodes]
  );
  const courseMap = new Map(courseQuery.rows.map((row) => [row.code, row.id]));

  const missingCourses = subjectCodes.filter((code) => !courseMap.has(code));
  if (missingCourses.length) {
    console.warn(
      `[seed-attendance] ${missingCourses.length} courses missing in DB:`,
      missingCourses
    );
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const student of students) {
    const studentId = studentMap.get(student.hall_ticket);
    if (!studentId) {
      skipped++;
      continue;
    }

    for (const subject of subjects) {
      const courseId = courseMap.get(subject.subject_code);
      if (!courseId) {
        continue;
      }

      const attendedRaw =
        student.attendance?.[subject.subject_code] ??
        student.attendance?.[subject.short_code];
      const attendedClasses = Number(attendedRaw ?? 0);

      if (Number.isNaN(attendedClasses)) {
        continue;
      }

      const totalClasses =
        subjectTotals.get(subject.subject_code) ??
        subjectTotals.get(subject.short_code) ??
        attendedClasses;

      const percentage =
        totalClasses > 0
          ? Number(((attendedClasses / totalClasses) * 100).toFixed(2))
          : null;

      const result = await query(
        `INSERT INTO campus360_dev.attendance_summary
         (student_id, course_id, attended_classes, total_classes, percentage, month, year)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (student_id, course_id, month, year)
         DO UPDATE SET
           attended_classes = EXCLUDED.attended_classes,
           total_classes = EXCLUDED.total_classes,
           percentage = EXCLUDED.percentage,
           updated_at = now()
         RETURNING (xmax = 0) AS inserted`,
        [
          studentId,
          courseId,
          attendedClasses,
          totalClasses,
          percentage,
          month,
          year,
        ]
      );

      if (result.rows[0]?.inserted) {
        inserted++;
      } else {
        updated++;
      }
    }
  }

  console.log("✅ Attendance seeding complete.");
  console.log(`   ➕ Inserted: ${inserted}`);
  console.log(`   ♻️  Updated: ${updated}`);
  console.log(`   ⚠️  Students skipped (missing profile): ${skipped}`);
  console.log(
    `   ⚠️  Missing courses: ${missingCourses.length ? missingCourses.join(", ") : "None"}`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed to seed attendance:", err);
  process.exit(1);
});
