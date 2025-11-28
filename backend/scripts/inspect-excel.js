// Quick script to inspect Excel structure
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../attendance.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const rawData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1, 
  defval: null,
  raw: false 
});

console.log('Sheet:', sheetName);
console.log('Total rows:', rawData.length);
console.log('\nFirst 10 rows:');
for (let i = 0; i < Math.min(10, rawData.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(rawData[i] || []));
}

