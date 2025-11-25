// src/services/excelParser.js
// Parse complex multi-row header Excel files for attendance data

import XLSX from "xlsx";

/**
 * Parse Excel file and extract all data
 * @param {string} filePath - Path to Excel file
 * @param {string} filename - Original filename (optional, for extracting year/semester)
 * @returns {Object} - Parsed data with metadata, subjects, faculty, students
 */
export function parseExcelFile(filePath, filename = '') {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: null,
    raw: false 
  });

  // Check if file is in table format (has "Subj.Code" or "Subject Code" header)
  const isTableFormat = checkTableFormat(rawData);
  console.log(`[parseExcelFile] isTableFormat=${isTableFormat}`);
  
  if (isTableFormat) {
    const result = parseTableFormat(rawData, filename);
    console.log(`[parseExcelFile] Table format parsed subjects=${result.subjects.length}, students=${result.students.length}`);
    return result;
  }
  
  // Otherwise, use multi-row header format
  // Find row indexes
  const metadataRow = findMetadataRow(rawData);
  const subjectTypeRow = findSubjectTypeRow(rawData);
  const electiveRow = findElectiveRow(rawData);
  const subjectCodeRow = findSubjectCodeRow(rawData);
  const shortCodeRow = findShortCodeRow(rawData, subjectCodeRow);
  const facultyRow = findFacultyRow(rawData, shortCodeRow);
  const studentHeaderRow = findStudentHeaderRow(rawData);
  
  // Extract metadata
  const metadata = extractMetadata(rawData[metadataRow] || []);
  metadata.section = null;
  
  // Find subject name row (might be the subject type row if it contains names)
  const subjectNameRow = findSubjectNameRow(rawData, subjectTypeRow, shortCodeRow);
  
  // Extract subjects
  const subjects = extractSubjects(
    rawData,
    subjectTypeRow,
    electiveRow,
    subjectCodeRow,
    shortCodeRow,
    subjectNameRow,
    facultyRow,
    studentHeaderRow
  );
  
  // Extract year from filename (prioritize filename over Excel metadata)
  let yearFromFilename = null;
  if (filename) {
    const filenameUpper = filename.toUpperCase();
    // Check for "4th", "4TH", "IV", "4 YEAR", "4THYEAR", "4TH YEAR" (with or without spaces)
    if (filenameUpper.match(/\b(4TH|IV|4\s*YEAR|4THYEAR|4TH\s*YEAR)\b/) || filenameUpper.includes('4THYEAR')) {
      yearFromFilename = 4;
    } else if (filenameUpper.match(/\b(3RD|III|3\s*YEAR|3RDYEAR|3RD\s*YEAR)\b/) || filenameUpper.includes('3RDYEAR')) {
      yearFromFilename = 3;
    } else if (filenameUpper.match(/\b(2ND|II|2\s*YEAR|2NDYEAR|2ND\s*YEAR)\b/) || filenameUpper.includes('2NDYEAR')) {
      yearFromFilename = 2;
    } else if (filenameUpper.match(/\b(1ST|I\s*YEAR|1STYEAR|1ST\s*YEAR|1\s*YEAR)\b/) || filenameUpper.includes('1STYEAR')) {
      yearFromFilename = 1;
    }
  }
  
  // Use filename year if found, otherwise use Excel metadata
  if (yearFromFilename !== null) {
    metadata.year = yearFromFilename;
  }
  
  // Extract semester from filename (prioritize filename over Excel metadata)
  // Handle "SEM I", "SEM-I", "SEM(I)", "Sem-I", etc.
  let semesterFromFilename = null;
  if (filename) {
    const filenameUpper = filename.toUpperCase();
    // Check for semester I indicators (with space, hyphen, or parentheses)
    // Match: SEM I, SEM-I, SEM(I), (SEM-I), SEMESTER I, SEMESTER-I, etc.
    // First check for II to avoid false positives
    if (filenameUpper.match(/(SEM|SEMESTER)[\s\-\(]*II[\s\-\)]*/)) {
      semesterFromFilename = 2;
    } else if (filenameUpper.match(/(SEM|SEMESTER)[\s\-\(]*I[\s\-\)]*/)) {
      semesterFromFilename = 1;
    }
  }
  
  // Use filename semester if found, otherwise use Excel metadata
  if (semesterFromFilename !== null) {
    metadata.semester = semesterFromFilename;
  }
  
  // Calculate academic year from fromDate if available
  if (metadata.fromDate && !metadata.academic_year) {
    const fromDate = new Date(metadata.fromDate);
    const year = fromDate.getFullYear();
    const nextYear = year + 1;
    metadata.academic_year = `${year}-${String(nextYear).slice(-2)}`;
  } else if (!metadata.academic_year) {
    // Default to current academic year
    const currentYear = new Date().getFullYear();
    metadata.academic_year = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
  }
  
  // Add year, academic_year, and semester to each subject
  subjects.forEach(subject => {
    subject.year = metadata.year || null;
    subject.academic_year = metadata.academic_year || null;
    subject.semester = metadata.semester || null;
  });
  
  // Extract students
  const students = extractStudents(
    rawData,
    studentHeaderRow,
    subjects,
    metadata
  );
  
  const result = {
    metadata,
    subjects,
    students,
    faculty: extractFacultyFromSubjects(subjects)
  };
  console.log(`[parseExcelFile] Multi-row format parsed subjects=${subjects.length}, students=${students.length}`);
  return result;
}

/**
 * Check if file is in table format (has subject table with headers)
 */
function checkTableFormat(data) {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    // Potential table header row detected
    if ((rowStr.includes('SUBJ.CODE') || rowStr.includes('SUBJECT CODE') || rowStr.includes('SUBJ CODE')) &&
        (rowStr.includes('SHORT CODE') || rowStr.includes('SUBJECT') || rowStr.includes('FACULTY'))) {
      // Look ahead for an actual table body row (should start with SlNo / numeric index)
      for (let j = i + 1; j < Math.min(i + 8, data.length); j++) {
        const nextRow = data[j] || [];
        const nextRowStr = nextRow.join(' ').toUpperCase();
        
        // If we immediately encounter a student header, this is not table format
        if ((nextRowStr.includes('SNO') || nextRowStr.includes('S.NO')) &&
            (nextRowStr.includes('HALLTICKET') || nextRowStr.includes('HALL TICKET'))) {
          return false;
        }
        
        // Find first non-empty cell in the row
        const firstValue = nextRow.find(cell => {
          if (cell === null || cell === undefined) return false;
          return String(cell).trim().length > 0;
        });
        if (!firstValue) continue;
        
        const firstValueStr = String(firstValue).trim().toUpperCase();
        const looksLikeIndex = /^\d+$/i.test(firstValueStr) || firstValueStr.startsWith('SL');
        const hasSubjectCode = nextRow.some(cell => {
          if (!cell) return false;
          const str = String(cell).trim();
          return /^[A-Z0-9]{5,15}$/i.test(str);
        });
        
        if (looksLikeIndex && hasSubjectCode) {
          return true; // Confirmed table layout
        }
      }
    }
  }
  return false;
}

/**
 * Parse table format Excel file
 */
function parseTableFormat(data, filename = '') {
  // Find the header row
  let headerRow = -1;
  let subjectCodeCol = -1;
  let shortCodeCol = -1;
  let subjectNameCol = -1;
  let facultyNameCol = -1;
  
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    
    if (rowStr.includes('SUBJ.CODE') || rowStr.includes('SUBJECT CODE') || rowStr.includes('SUBJ CODE')) {
      headerRow = i;
      // Find column indexes
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toUpperCase().trim();
        // Match variations: "Subj.Code", "Subject Code", "Subj Code", "Code"
        if (cell.includes('SUBJ') && cell.includes('CODE')) {
          subjectCodeCol = j;
        } else if (cell === 'CODE' && subjectCodeCol === -1) {
          subjectCodeCol = j;
        } else if (cell.includes('SHORT') && cell.includes('CODE')) {
          shortCodeCol = j;
        } else if (cell === 'SUBJECT' || (cell.includes('SUBJECT') && !cell.includes('CODE'))) {
          subjectNameCol = j;
        } else if (cell.includes('FACULTY') || cell.includes('FACULTY NAME')) {
          facultyNameCol = j;
        }
      }
      break;
    }
  }
  
  if (headerRow === -1 || subjectCodeCol === -1) {
    throw new Error('Could not find subject table header row');
  }
  
  // Extract subjects from table
  const subjects = [];
  // Find where student data starts to stop reading subjects
  const studentHeaderRow = findStudentHeaderRow(data, headerRow + 1);
  const stopRow = data.length;
  console.log(`[parseTableFormat] headerRow=${headerRow}, subjectCodeCol=${subjectCodeCol}, studentHeaderRow=${studentHeaderRow}`);
  
  for (let i = headerRow + 1; i < stopRow; i++) {
    const row = data[i] || [];
    
    // Skip separator rows (rows with only dashes or pipes)
    const rowStr = row.join('').replace(/\s/g, '');
    if (rowStr.match(/^[-|:]+$/) || rowStr.length === 0) continue;
    
    const subjectCode = row[subjectCodeCol] ? String(row[subjectCodeCol]).trim() : '';
    const shortCode = shortCodeCol !== -1 ? (row[shortCodeCol] ? String(row[shortCodeCol]).trim() : '') : '';
    const subjectName = subjectNameCol !== -1 ? (row[subjectNameCol] ? String(row[subjectNameCol]).trim() : '') : '';
    const facultyName = facultyNameCol !== -1 ? (row[facultyNameCol] ? String(row[facultyNameCol]).trim() : '') : '';
    
    // Skip empty rows or rows that look like headers
    if (!subjectCode || subjectCode.length < 3) {
      console.log(`[parseTableFormat] Skipping row ${i} - invalid subject code`, row);
      continue;
    }
    
    // Skip if subject code looks like a header (all caps common words)
    if (/^(SLNO|SUBJ|CODE|SHORT|SUBJECT|FACULTY|NAME)$/i.test(subjectCode)) continue;
    
    // Skip if this row looks like a student header row (contains "SNO", "HALLTICKET", "NAME")
    // But be more specific - only break if there's no valid subject code (it's definitely a header)
    const rowStrUpper = row.join(' ').toUpperCase();
    if (rowStrUpper.includes('SNO') && 
        (rowStrUpper.includes('HALLTICKET') || rowStrUpper.includes('HALL TICKET')) &&
        rowStrUpper.includes('NAME') &&
        (!subjectCode || subjectCode.length < 3)) { // Only break if there's no valid subject code
      console.log(`[parseTableFormat] Stopping subject parsing at row ${i} - found student header`);
      break; // Stop reading subjects, we've reached student data
    }
    
    // Skip if subject code looks like a student identifier (hall ticket pattern or just a name without code pattern)
    // Subject codes are typically alphanumeric codes like "22EC301PC", not just names
    // But be lenient - allow codes that start with numbers and contain letters
    // Common patterns: "22EC301PC", "ECE21DAA", "22MC309CI"
    const isLikelySubjectCode = /^[A-Z0-9]{4,15}$/i.test(subjectCode) || 
                                 /^[0-9]{2}[A-Z]{2,}[0-9]{1,}[A-Z]{0,5}$/i.test(subjectCode) ||
                                 /^[A-Z]{2,}[0-9]{1,}[A-Z]{0,5}$/i.test(subjectCode);
    
    // Only skip if it's clearly not a subject code (very long text that looks like a name)
    if (!isLikelySubjectCode && subjectCode.length > 20 && !/^[A-Z0-9]+$/i.test(subjectCode)) {
      console.log(`[parseTableFormat] Skipping row ${i} - subject code looks like name: ${subjectCode}`);
      // If it's a very long string without alphanumeric code pattern, it's likely a name
      continue;
    }
    
    // Determine subject type from name or code
    let subjectType = 'Theory';
    const nameUpper = subjectName.toUpperCase();
    if (nameUpper.includes('LAB') || nameUpper.includes('LABORATORY')) {
      subjectType = 'Practical';
    } else if (nameUpper.includes('PROJECT')) {
      subjectType = 'Project';
    } else if (nameUpper.includes('LIBRARY') || nameUpper.includes('SPORTS') || nameUpper.includes('COUNSELLING')) {
      subjectType = 'Others';
    }
    
    subjects.push({
      columnIndex: -1, // Not applicable for table format
      subject_code: subjectCode,
      short_code: shortCode || subjectCode,
      subject_name: subjectName || shortCode || subjectCode,
      subject_type: subjectType,
      elective_group: null,
      faculty_name: facultyName || null,
      year: null, // Will be set from metadata
      academic_year: null // Will be set from metadata
    });
    console.log(`[parseTableFormat] Parsed subject ${subjects.length}: ${subjectCode} - ${subjectName}`);
  }
  console.log(`[parseTableFormat] Extracted ${subjects.length} subjects in table format`);
  
  // Extract metadata (try to find it in first few rows)
  const metadata = extractMetadataFromTable(data);
  metadata.section = null;
  
  // Extract year from filename (prioritize filename over Excel metadata)
  let yearFromFilename = null;
  if (filename) {
    const filenameUpper = filename.toUpperCase();
    // Check for "4th", "4TH", "IV", "4 YEAR", "4THYEAR", "4TH YEAR" (with or without spaces)
    if (filenameUpper.match(/\b(4TH|IV|4\s*YEAR|4THYEAR|4TH\s*YEAR)\b/) || filenameUpper.includes('4THYEAR')) {
      yearFromFilename = 4;
    } else if (filenameUpper.match(/\b(3RD|III|3\s*YEAR|3RDYEAR|3RD\s*YEAR)\b/) || filenameUpper.includes('3RDYEAR')) {
      yearFromFilename = 3;
    } else if (filenameUpper.match(/\b(2ND|II|2\s*YEAR|2NDYEAR|2ND\s*YEAR)\b/) || filenameUpper.includes('2NDYEAR')) {
      yearFromFilename = 2;
    } else if (filenameUpper.match(/\b(1ST|I\s*YEAR|1STYEAR|1ST\s*YEAR|1\s*YEAR)\b/) || filenameUpper.includes('1STYEAR')) {
      yearFromFilename = 1;
    }
  }
  
  // Use filename year if found, otherwise use Excel metadata
  if (yearFromFilename !== null) {
    metadata.year = yearFromFilename;
  }
  
  // Extract semester from filename (prioritize filename over Excel metadata)
  // Handle "SEM I", "SEM-I", "SEM(I)", "Sem-I", etc.
  let semesterFromFilename = null;
  if (filename) {
    const filenameUpper = filename.toUpperCase();
    // Check for semester I indicators (with space, hyphen, or parentheses)
    // Match: SEM I, SEM-I, SEM(I), (SEM-I), SEMESTER I, SEMESTER-I, etc.
    // First check for II to avoid false positives
    if (filenameUpper.match(/(SEM|SEMESTER)[\s\-\(]*II[\s\-\)]*/)) {
      semesterFromFilename = 2;
    } else if (filenameUpper.match(/(SEM|SEMESTER)[\s\-\(]*I[\s\-\)]*/)) {
      semesterFromFilename = 1;
    }
  }
  
  // Use filename semester if found, otherwise use Excel metadata
  if (semesterFromFilename !== null) {
    metadata.semester = semesterFromFilename;
  }
  
  // Calculate academic year from fromDate if available
  if (metadata.fromDate && !metadata.academic_year) {
    const fromDate = new Date(metadata.fromDate);
    const year = fromDate.getFullYear();
    const nextYear = year + 1;
    metadata.academic_year = `${year}-${String(nextYear).slice(-2)}`;
  } else if (!metadata.academic_year) {
    // Default to current academic year
    const currentYear = new Date().getFullYear();
    metadata.academic_year = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
  }
  
  // Add year and academic_year to each subject
  subjects.forEach(subject => {
    subject.year = metadata.year || null;
    subject.academic_year = metadata.academic_year || null;
    subject.semester = metadata.semester || null;
  });
  
  // For table format, we need to find student data separately
  // Use the studentHeaderRow we already found earlier
  const students = studentHeaderRow !== -1 
    ? extractStudents(data, studentHeaderRow, subjects, metadata)
    : [];
  
  return {
    metadata,
    subjects,
    students,
    faculty: extractFacultyFromSubjects(subjects)
  };
}

/**
 * Extract metadata from table format (look in first few rows)
 */
function extractMetadataFromTable(data) {
  // Look for metadata in first 10 rows
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ');
    if (rowStr.includes('Program') || rowStr.includes('Branch') || rowStr.includes('Semester')) {
      return extractMetadata(row);
    }
  }
  
  // Return default metadata if not found
  return {
    program: '',
    branch: '',
    semester: null,
    year: null,
    section: null,
    fromDate: null,
    toDate: null
  };
}

/**
 * Find metadata row (contains "Program" and "Branch")
 */
function findMetadataRow(data) {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    if (rowStr.includes('PROGRAM') && rowStr.includes('BRANCH')) {
      return i;
    }
  }
  return 0;
}

/**
 * Find subject type row (contains "Theory", "Practical", etc.)
 */
function findSubjectTypeRow(data) {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    if (rowStr.includes('THEORY') || rowStr.includes('PRACTICAL') || rowStr.includes('SUBJECT TYPE')) {
      return i;
    }
  }
  return -1;
}

/**
 * Find elective group row
 */
function findElectiveRow(data) {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    if (rowStr.includes('ELECTIVE GROUP') || rowStr.includes('ELECTIVE')) {
      return i;
    }
  }
  return -1;
}

/**
 * Find subject code row (contains codes like "22EC501PC")
 */
function findSubjectCodeRow(data) {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i] || [];
    // Check if row contains subject code pattern (alphanumeric with at least one digit)
    const hasCode = row.some(cell => {
      if (!cell) return false;
      const str = String(cell).trim();
      return /[0-9]/.test(str) && /^[A-Z0-9\-]{5,15}$/i.test(str);
    });
    if (hasCode) return i;
  }
  return -1;
}

/**
 * Find short code row (row after subject code row)
 */
function findShortCodeRow(data, subjectCodeRow) {
  if (subjectCodeRow === -1) return -1;
  return subjectCodeRow + 1;
}

/**
 * Find subject name row
 * This might be the subject type row if it contains actual subject names
 * Or it could be a separate row between short code and faculty
 */
function findSubjectNameRow(data, subjectTypeRow, shortCodeRow) {
  // First check if subject type row contains actual names (not just "Theory"/"Practical")
  if (subjectTypeRow !== -1) {
    const row = data[subjectTypeRow] || [];
    const hasLongNames = row.some(cell => {
      if (!cell) return false;
      const str = String(cell).trim();
      // If it's a long name (more than 10 chars) and not "Theory"/"Practical", it's likely a subject name
      return str.length > 10 && 
             !/^(THEORY|PRACTICAL|LAB|TUTORIAL|PROJECT)$/i.test(str) &&
             !/^[A-Z0-9]{6,12}$/i.test(str); // Not a code
    });
    if (hasLongNames) {
      return subjectTypeRow; // Subject type row actually contains names
    }
  }
  
  // Otherwise, check row after short code (before faculty)
  if (shortCodeRow !== -1) {
    const nextRow = shortCodeRow + 1;
    if (nextRow < data.length) {
      const row = data[nextRow] || [];
      const rowStr = row.join(' ').toUpperCase();
      // Skip if it looks like faculty row or student header
      if (!rowStr.includes('SNO') && !rowStr.includes('HALLTICKET')) {
        const hasNames = row.some(cell => {
          if (!cell) return false;
          const str = String(cell).trim();
          // Long text that looks like a subject name
          return str.length > 5 && 
                 !/^(THEORY|PRACTICAL|LAB|TUTORIAL|PROJECT)$/i.test(str) &&
                 !/^[A-Z0-9]{6,12}$/i.test(str) &&
                 /^[A-Z\s\-\.]+$/i.test(str);
        });
        if (hasNames) {
          return nextRow;
        }
      }
    }
  }
  
  return -1;
}

/**
 * Find faculty row (row after short code row)
 */
function findFacultyRow(data, shortCodeRow) {
  if (shortCodeRow === -1) return -1;
  const nextRow = shortCodeRow + 1;
  if (nextRow < data.length) {
    const row = data[nextRow] || [];
    const rowStr = row.join(' ').toUpperCase();
    
    // Skip if this looks like a student header row
    if (rowStr.includes('SNO') || rowStr.includes('HALLTICKET') || rowStr.includes('NAME') || rowStr.includes('MOBILE')) {
      return -1;
    }
    
    // Check if row contains names that look like faculty names
    // Faculty names are typically: First Last, or Dr. Name, or Prof. Name
    // They should not be subject codes, numbers, or common headers
    const hasFacultyNames = row.some(cell => {
      if (!cell) return false;
      const str = String(cell).trim();
      
      // Skip if it's a subject code pattern
      if (/^[A-Z0-9]{6,12}$/i.test(str)) return false;
      
      // Skip if it's a number
      if (/^\d+$/.test(str)) return false;
      
      // Skip common headers
      const commonHeaders = ['THEORY', 'PRACTICAL', 'SUBJECT', 'CODE', 'TYPE', 'ELECTIVE', 'GROUP'];
      if (commonHeaders.some(header => str.toUpperCase().includes(header))) return false;
      
      // Must look like a name: letters, spaces, dots, hyphens, length 3+
      // Should have at least one space (first name + last name) or be a title like "Dr.", "Prof."
      if (/^[A-Z][A-Z\s\.\-]+$/i.test(str) && str.length >= 3) {
        // Check if it has a space (first + last name) or title prefix
        if (str.includes(' ') || /^(DR|PROF|MR|MRS|MS)\.?\s/i.test(str)) {
          return true;
        }
      }
      
      return false;
    });
    
    if (hasFacultyNames) return nextRow;
  }
  return -1;
}

/**
 * Find student header row (contains "SNo" and "HallTicket")
 * @param {Array[]} data
 * @param {number} startRow - row index to start searching from (default 0)
 */
function findStudentHeaderRow(data, startRow = 0) {
  for (let i = startRow; i < data.length; i++) {
    const row = data[i] || [];
    const rowStr = row.join(' ').toUpperCase();
    if ((rowStr.includes('SNO') || rowStr.includes('S.NO')) && 
        (rowStr.includes('HALLTICKET') || rowStr.includes('HALL TICKET') || rowStr.includes('HALLTICKETNO'))) {
      return i;
    }
  }
  return -1;
}

/**
 * Extract metadata from metadata row
 */
function extractMetadata(metadataRow) {
  const rowStr = metadataRow.join(' ') || '';
  
  // Try multiple patterns for program
  let programMatch = rowStr.match(/Program[:\s]+([^Branch]+?)(?:\s+Branch|$)/i);
  if (!programMatch) {
    programMatch = rowStr.match(/Program:\s*([^Branch]+)/i);
  }
  
  // Try multiple patterns for branch
  let branchMatch = rowStr.match(/Branch[:\s]+([^Semester]+?)(?:\s+Semester|$)/i);
  if (!branchMatch) {
    branchMatch = rowStr.match(/Branch:\s*([^Semester]+)/i);
  }
  // Also try common department abbreviations
  if (!branchMatch) {
    const deptMatch = rowStr.match(/\b(CS|ECE|CIVIL|MECH|EEE|CSE|IT)\b/i);
    if (deptMatch) {
      branchMatch = [null, deptMatch[1]];
    }
  }
  
  const semesterMatch = rowStr.match(/Semester[:\s]*(\d+)/i);
  const yearMatch = rowStr.match(/Year[:\s]*(\d+)/i);
  const sectionMatch = rowStr.match(/Section[:\s]*([^From]+?)(?:\s+From|$)/i);
  const fromDateMatch = rowStr.match(/FromDate[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i);
  const toDateMatch = rowStr.match(/ToDate[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i);
  
  return {
    program: programMatch ? programMatch[1].trim() : '',
    branch: branchMatch ? branchMatch[1].trim() : '',
    semester: semesterMatch ? parseInt(semesterMatch[1]) : null,
    year: yearMatch ? parseInt(yearMatch[1]) : null,
    section: sectionMatch ? sectionMatch[1].trim() : null,
    fromDate: fromDateMatch ? fromDateMatch[1].replace(/\//g, '-') : null,
    toDate: toDateMatch ? toDateMatch[1].replace(/\//g, '-') : null
  };
}

/**
 * Extract subjects from header rows
 */
function extractSubjects(data, subjectTypeRow, electiveRow, subjectCodeRow, shortCodeRow, subjectNameRow, facultyRow, studentHeaderRow) {
  const subjects = [];
  
  if (subjectCodeRow === -1 || studentHeaderRow === -1) {
    return subjects;
  }
  
  const subjectCodeData = data[subjectCodeRow] || [];
  const shortCodeData = shortCodeRow !== -1 ? (data[shortCodeRow] || []) : [];
  const subjectTypeData = subjectTypeRow !== -1 ? (data[subjectTypeRow] || []) : [];
  const subjectNameData = subjectNameRow !== -1 ? (data[subjectNameRow] || []) : [];
  const electiveData = electiveRow !== -1 ? (data[electiveRow] || []) : [];
  const facultyData = facultyRow !== -1 ? (data[facultyRow] || []) : [];
  const studentHeaderData = data[studentHeaderRow] || [];
  
  // Find start column (after SNo, HallTicket, Name, Mobile columns)
  let startCol = 0;
  for (let i = 0; i < studentHeaderData.length; i++) {
    const header = String(studentHeaderData[i] || '').toUpperCase();
    if (header.includes('MOBILE') || header.includes('PHONE')) {
      startCol = i + 1;
      break;
    }
  }
  
  // Find end column (before T.C, T.A, E.A, % columns)
  let endCol = studentHeaderData.length;
  for (let i = startCol; i < studentHeaderData.length; i++) {
    const header = String(studentHeaderData[i] || '').toUpperCase();
    if (header === 'T.C' || header === 'TC' || header === 'TOTAL CLASSES') {
      endCol = i;
      break;
    }
  }
  
  // Extract subject data for each column
  for (let col = startCol; col < endCol; col++) {
    const subjectCode = String(subjectCodeData[col] || '').trim();
    const shortCode = shortCodeRow !== -1 ? String(shortCodeData[col] || '').trim() : '';
    const subjectTypeRaw = subjectTypeRow !== -1 ? String(subjectTypeData[col] || '').trim() : '';
    const subjectName = subjectNameRow !== -1 ? String(subjectNameData[col] || '').trim() : '';
    const electiveGroup = electiveRow !== -1 ? String(electiveData[col] || '').trim() : '';
    const facultyName = facultyRow !== -1 ? String(facultyData[col] || '').trim() : '';
    
    // Skip if no subject code
    if (!subjectCode || subjectCode.length < 3) continue;
    
    // Determine subject type and name
    // If subject type row contains long names, it's actually the subject name
    let subjectType = 'Theory';
    let finalSubjectName = '';
    
    if (subjectNameRow === subjectTypeRow && subjectName) {
      // Subject type row contains names, not types
      finalSubjectName = subjectName;
      // Try to determine type from other indicators or default
      subjectType = subjectTypeRaw && /^(THEORY|PRACTICAL|LAB|TUTORIAL|PROJECT)$/i.test(subjectTypeRaw) 
        ? subjectTypeRaw 
        : 'Theory';
    } else {
      // Normal case: subject type row has types, name row has names
      subjectType = subjectTypeRaw && /^(THEORY|PRACTICAL|LAB|TUTORIAL|PROJECT)$/i.test(subjectTypeRaw)
        ? subjectTypeRaw
        : 'Theory';
      finalSubjectName = subjectName || shortCode || subjectCode;
    }
    
    subjects.push({
      columnIndex: col,
      subject_code: subjectCode,
      short_code: shortCode || subjectCode,
      subject_name: finalSubjectName,
      subject_type: subjectType,
      elective_group: electiveGroup || null,
      faculty_name: facultyName || null,
      year: null, // Will be set from metadata after extraction
      academic_year: null // Will be set from metadata after extraction
    });
  }
  
  return subjects;
}

/**
 * Extract faculty from subjects
 */
function extractFacultyFromSubjects(subjects) {
  const facultyMap = new Map();
  
  // Common non-faculty strings to filter out
  const nonFacultyPatterns = [
    /^THEORY$/i,
    /^PRACTICAL$/i,
    /^LAB$/i,
    /^TUTORIAL$/i,
    /^PROJECT$/i,
    /^SEMINAR$/i,
    /^SUBJECT$/i,
    /^CODE$/i,
    /^TYPE$/i,
    /^ELECTIVE$/i,
    /^GROUP$/i,
    /^\d+$/, // Pure numbers
    /^[A-Z0-9]{6,12}$/i, // Subject codes
    /^T\.C$/i,
    /^T\.A$/i,
    /^E\.A$/i,
    /^%$/i,
    /^TOTAL/i,
    /^ATTENDANCE/i
  ];
  
  subjects.forEach(subject => {
    if (subject.faculty_name && subject.faculty_name.trim()) {
      const name = subject.faculty_name.trim();
      
      // Skip if it matches non-faculty patterns
      const isNonFaculty = nonFacultyPatterns.some(pattern => pattern.test(name));
      if (isNonFaculty) return;
      
      // Skip if it's too short or doesn't look like a name
      if (name.length < 3) return;
      
      // Skip if it's all uppercase and short (likely a code/abbreviation)
      if (name === name.toUpperCase() && name.length <= 5 && !name.includes(' ')) {
        return;
      }
      
      if (!facultyMap.has(name)) {
        facultyMap.set(name, {
          name: name,
          subjects: []
        });
      }
      facultyMap.get(name).subjects.push(subject.subject_code);
    }
  });
  
  return Array.from(facultyMap.values());
}

/**
 * Extract students from data rows
 */
function extractStudents(data, studentHeaderRow, subjects, metadata) {
  const students = [];
  
  if (studentHeaderRow === -1) return students;
  
  const studentHeaderData = data[studentHeaderRow] || [];
  
  // Find column indexes
  const snoCol = findColumnIndex(studentHeaderData, ['SNO', 'S.NO', 'S NO']);
  const hallTicketCol = findColumnIndex(studentHeaderData, ['HALLTICKET', 'HALL TICKET', 'HALLTICKETNO', 'HALL TICKET NO']);
  const nameCol = findColumnIndex(studentHeaderData, ['NAME', 'STUDENT NAME', 'NAME / MAX CLASSES']);
  const mobileCol = findColumnIndex(studentHeaderData, ['MOBILE', 'PHONE', 'MOBILE NO']);
  const tcCol = findColumnIndex(studentHeaderData, ['T.C', 'TC', 'TOTAL CLASSES']);
  const taCol = findColumnIndex(studentHeaderData, ['T.A', 'TA', 'TOTAL ATTENDED']);
  const eaCol = findColumnIndex(studentHeaderData, ['E.A', 'EA', 'EXTRA ATTENDED']);
  const percentCol = findColumnIndex(studentHeaderData, ['%', 'PERCENTAGE', 'PERCENT']);
  
  // Process student rows (starting after header row)
  for (let rowIndex = studentHeaderRow + 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex] || [];
    
    // Skip empty rows
    if (!row || row.length === 0) continue;
    
    const sno = row[snoCol];
    const hallTicket = row[hallTicketCol] ? String(row[hallTicketCol]).trim() : null;
    const name = row[nameCol] ? String(row[nameCol]).trim() : null;
    const mobile = row[mobileCol] ? String(row[mobileCol]).trim() : null;
    
    // Stop if no valid student data
    if (!hallTicket && !name) break;
    if (!name || name.length < 2) continue;
    
    // Extract attendance for each subject
    const attendance = {};
    subjects.forEach(subject => {
      const col = subject.columnIndex;
      const value = row[col];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseInt(value) || 0;
        attendance[subject.subject_code] = numValue;
      }
    });
    
    const totalClasses = row[tcCol] ? parseInt(row[tcCol]) || 0 : 0;
    const totalAttended = row[taCol] ? parseInt(row[taCol]) || 0 : 0;
    const extraAttended = row[eaCol] ? parseInt(row[eaCol]) || 0 : 0;
    const percentage = row[percentCol] ? parseFloat(row[percentCol]) || 0 : 0;
    
    students.push({
      hall_ticket: hallTicket,
      name: name,
      mobile: mobile || null,
      attendance: attendance,
      total_classes: totalClasses,
      total_attended: totalAttended,
      extra_attended: extraAttended,
      percentage: percentage
    });
  }
  
  return students;
}

/**
 * Find column index by header keywords
 */
function findColumnIndex(headerRow, keywords) {
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toUpperCase();
    if (keywords.some(keyword => header.includes(keyword))) {
      return i;
    }
  }
  return -1;
}

