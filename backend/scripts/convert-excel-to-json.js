// scripts/convert-excel-to-json.js
// Convert Excel attendance file to JSON format for import
import XLSX from "xlsx";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Subject code mapping (short_name -> full_code)
const SUBJECT_CODE_MAP = {
  "AC": "22EC301PC",
  "NAS": "22EC302PC",
  "DLD": "22EC303PC",
  "SS": "22EC304PC",
  "PTSP": "22EC305PC",
  "AC-Lab": "22EC306PC",
  "DLD-Lab": "22EC307PC",
  "BS-Lab": "22EC308PC",
  "Col": "22MC309C",
  "LIB/SCM": "ECE21LIB",
  "SPORTS": "ECE21SPOF",
  "DAA": "ECE21DAA"
};

function convertExcelToJson() {
  try {
    console.log('📊 Converting Excel file to JSON...\n');

    // Try both .csv and .xlsx extensions
    let filePath = join(__dirname, '../attendance.xlsx');
    let workbook;
    
    try {
      workbook = XLSX.readFile(filePath);
    } catch (err) {
      // Try .csv extension
      filePath = join(__dirname, '../attendance.csv');
      workbook = XLSX.readFile(filePath);
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: null,
      raw: false 
    });

    console.log(`✅ Loaded Excel file: ${sheetName}`);
    console.log(`   Total rows: ${rawData.length}\n`);

    // Find header rows based on the structure:
    // Row 4: Subject codes (22EC301PC, etc.)
    // Row 5: Short codes (AC, NAS, etc.)
    // Row 6: Header row with "SNo", "HallTicketNo", "Name / Max Classes", "Mobile", then total classes
    // Row 7+: Student data
    
    let subjectCodesRowIndex = -1;
    let shortCodesRowIndex = -1;
    let headerRowIndex = -1;
    let subjectShortNames = [];
    let subjectTotals = {};

    // Find subject codes row (contains "22EC301PC" or "Subject Code")
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i] || [];
      const rowStr = row.join(' ').toUpperCase();
      
      if (rowStr.includes('SUBJECT CODE') || (row.length > 4 && typeof row[4] === 'string' && row[4].includes('22EC'))) {
        subjectCodesRowIndex = i;
        
        // Short codes should be in next row
        if (i + 1 < rawData.length) {
          const nextRow = rawData[i + 1] || [];
          if (nextRow.length > 4 && typeof nextRow[4] === 'string') {
            shortCodesRowIndex = i + 1;
          }
        }
        
        // Header row with totals should be 2 rows after
        if (i + 2 < rawData.length) {
          const headerRow = rawData[i + 2] || [];
          if (headerRow[0] && headerRow[0].toString().toUpperCase().includes('SNO')) {
            headerRowIndex = i + 2;
          }
        }
        break;
      }
    }

    if (subjectCodesRowIndex === -1 || shortCodesRowIndex === -1 || headerRowIndex === -1) {
      console.error('❌ Could not find required rows. Please check the Excel file format.');
      console.log('   Looking for: Subject Code row, Short Code row, and Header row');
      process.exit(1);
    }

    console.log(`📋 Found subject codes row at index ${subjectCodesRowIndex}`);
    console.log(`📋 Found short codes row at index ${shortCodesRowIndex}`);
    console.log(`📋 Found header row at index ${headerRowIndex}`);
    console.log('');

    // Extract subject short names from row 5 (shortCodesRowIndex)
    const shortCodesRow = rawData[shortCodesRowIndex] || [];
    const headerRow = rawData[headerRowIndex] || [];

    // Find where subjects start (column 4, index 4)
    const subjectStartCol = 4;

    // Extract subject short names and totals
    for (let i = subjectStartCol; i < shortCodesRow.length; i++) {
      const shortName = shortCodesRow[i];
      if (shortName && typeof shortName === 'string') {
        const shortNameTrimmed = shortName.toString().trim();
        // Map some variations
        const mappedName = shortNameTrimmed === 'CoI' ? 'Col' : shortNameTrimmed;
        
        if (Object.keys(SUBJECT_CODE_MAP).includes(mappedName)) {
          subjectShortNames.push(mappedName);
          
          // Get total classes from header row (row 6)
          const total = headerRow[i];
          if (total !== null && total !== undefined) {
            const totalNum = typeof total === 'number' ? total : parseInt(total);
            if (!isNaN(totalNum)) {
              subjectTotals[mappedName] = totalNum;
            }
          }
        }
      }
    }

    console.log(`📚 Found ${subjectShortNames.length} subjects:`, subjectShortNames.join(', '));
    console.log('');

    // Extract student data (starts after header row)
    const students = [];
    const dataStartRow = headerRowIndex + 1;

    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i] || [];
      
      // Skip empty rows
      if (row.length === 0 || !row[0] && !row[1]) continue;

      // Column structure: SNo (0), HallTicketNo (1), Name (2), Mobile (3), then attendance
      const hallTicket = row[1] ? row[1].toString().trim() : '';
      const name = row[2] ? row[2].toString().trim() : '';
      const mobile = row[3] ? row[3].toString().trim() : '';

      // Skip if no hall ticket or name
      if (!hallTicket || !name || hallTicket === 'SNo' || name === 'Name / Max Classes') continue;

      // Extract attendance for each subject
      const attendance = {};
      for (let j = 0; j < subjectShortNames.length; j++) {
        const shortName = subjectShortNames[j];
        const colIndex = subjectStartCol + j;
        const attended = row[colIndex];
        
        if (attended !== null && attended !== undefined) {
          const attendedNum = typeof attended === 'number' ? attended : parseInt(attended);
          if (!isNaN(attendedNum)) {
            attendance[shortName] = attendedNum;
          }
        }
      }

      students.push({
        hall_ticket: hallTicket,
        name: name,
        mobile: mobile || '',
        attendance: attendance
      });
    }

    console.log(`👥 Found ${students.length} students\n`);

    // Create JSON structure
    const output = {
      department: "Civil Engineering",
      year: 2,
      academic_year: "2022-2024",
      students: students,
      notes: "Converted from Excel file. Subject totals: " + JSON.stringify(subjectTotals)
    };

    // Write to file
    const outputPath = join(__dirname, '../data/civil-2yr-attendance.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log('✅ Conversion complete!');
    console.log(`📄 Output file: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Subjects: ${subjectShortNames.length}`);
    console.log(`\n💡 Next step: Run 'npm run import:civil-attendance' to import into database`);

  } catch (error) {
    console.error('❌ Error converting Excel file:', error);
    throw error;
  }
}

convertExcelToJson();

