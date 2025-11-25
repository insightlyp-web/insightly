# Excel Upload & Auto-Seeding System - Setup Guide

## Overview

This system allows HODs to upload Excel files containing attendance data, which automatically:
- Extracts and creates student profiles
- Extracts and creates faculty profiles  
- Creates course records
- Seeds attendance summary data

## Database Migrations

Run these migrations in order:

```bash
# 1. Add attendance_summary table
cd backend
node migrate-attendance-summary.js

# 2. Add course fields (subject_type, elective_group, semester)
node migrate-course-fields.js
```

## Excel File Format

The system expects Excel files with the following structure:

### Row Structure:
- **Row A**: Metadata row containing `Program:`, `Branch:`, `Semester:`, `Year:`, `Section:`, `FromDate:`, `ToDate:`
- **Row B**: Blank
- **Row C**: Subject Type row (Theory/Practical/Others)
- **Row D**: Elective Group row
- **Row E**: Subject Code row (e.g., `22EC501PC`)
- **Row F**: Short Code row
- **Row G**: Faculty Name row
- **Row H**: Student Header row with columns: `SNo | HallTicketNo | Name / Max Classes | Mobile | <subject columns> | T.C | T.A | E.A | %`
- **Rows I+**: Student data rows

### Example Files:
- `/mnt/data/II YEAR SEP.xls`
- `/mnt/data/III YEAR SEP.xls`
- `/mnt/data/IV YEAR SEP.xlsx`

## Usage

### 1. Access Upload Page
Navigate to: `/hod/upload-excel`

### 2. Upload Excel File
- Click "Upload Excel File" or drag & drop
- Select `.xlsx` or `.xls` file
- System will parse and show preview

### 3. Review Preview
The preview shows:
- Metadata (Program, Branch, Year, Semester, etc.)
- Summary (Total subjects, faculty, students)
- Subjects list with codes and faculty
- Faculty list
- Students list (first 20 shown)

### 4. Confirm & Save
- Review the preview data
- Click "Confirm & Save" button
- System will:
  - Create/update student profiles (email: `name@insightly.com`, password: `Student@123`)
  - Create/update faculty profiles (email: `name@insightly.com`, password: `Faculty@123`)
  - Create/update courses
  - Seed attendance summary records

## API Endpoints

### POST `/hod/upload-excel`
Uploads and parses Excel file. Returns preview data (no DB writes).

**Request:**
- `file`: Excel file (.xlsx or .xls)

**Response:**
```json
{
  "success": true,
  "preview": {
    "metadata": {...},
    "subjects": [...],
    "faculty": [...],
    "students": [...],
    "summary": {...}
  },
  "full_data": {...}
}
```

### POST `/hod/confirm-upload`
Saves the parsed data to database.

**Request:**
```json
{
  "full_data": {
    "metadata": {...},
    "subjects": [...],
    "students": [...],
    "faculty": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "students_added": 50,
  "students_updated": 10,
  "faculty_added": 5,
  "faculty_updated": 2,
  "courses_added": 8,
  "courses_updated": 0,
  "attendance_records_added": 400,
  "attendance_records_updated": 0
}
```

## File Structure

### Backend
```
backend/
  src/
    routes/hod/
      uploadExcel.js          # Upload & parse endpoint
      confirmUpload.js        # Save data endpoint
    services/
      excelParser.js          # Excel parsing logic
      facultyService.js       # Faculty upsert logic
      studentService.js       # Student upsert logic
      courseService.js        # Course upsert logic
      attendanceSeeder.js     # Attendance seeding logic
    utils/
      generateEmail.js        # Email generation utilities
  sql/
    005_add_attendance_summary.sql
    006_add_course_fields.sql
  migrate-attendance-summary.js
  migrate-course-fields.js
```

### Frontend
```
frontend/
  app/hod/upload-excel/
    page.tsx                  # Main upload page
  components/hod/
    PreviewTable.tsx         # Preview component
    UploadCard.tsx           # Upload component (existing)
```

## Features

✅ **Multi-row header parsing** - Handles complex Excel structures
✅ **Metadata extraction** - Extracts Program, Branch, Year, Semester, Section, Dates
✅ **Subject parsing** - Extracts subject codes, types, elective groups, faculty
✅ **Faculty extraction** - Creates faculty profiles with auto-generated emails
✅ **Student extraction** - Creates student profiles with auto-generated emails
✅ **Attendance seeding** - Creates monthly attendance summary records
✅ **Preview before save** - Review data before committing to database
✅ **Upsert logic** - Updates existing records, creates new ones
✅ **Error handling** - Comprehensive error messages
✅ **Validation** - Validates Excel format and data

## Email Generation

- **Students**: `cleaned.name@insightly.com` (e.g., "RAM KUMAR" → "ram.kumar@insightly.com")
- **Faculty**: `cleaned.name@insightly.com`
- If email exists, appends number: `name.1@insightly.com`, `name.2@insightly.com`, etc.

## Default Passwords

- **Students**: `Student@123`
- **Faculty**: `Faculty@123`

Note: These are stored in the database but users need to sign up via Supabase Auth to access the system.

## Testing

Test with the provided Excel files:
1. `/mnt/data/II YEAR SEP.xls`
2. `/mnt/data/III YEAR SEP.xls`
3. `/mnt/data/IV YEAR SEP.xlsx`

## Troubleshooting

### "Invalid Excel format" error
- Ensure metadata row contains "Program" and "Branch"
- Check that subject code row exists
- Verify student header row contains "SNo" and "HallTicket"

### "No subjects found" error
- Check subject code row format
- Ensure subject codes are alphanumeric (6-12 characters)

### "No students found" error
- Verify student header row format
- Check that student data rows follow the header row

## Notes

- The system uses `ON CONFLICT` logic to update existing records
- Attendance summaries are unique per (student_id, course_id, month, year)
- Faculty and students are matched by email (auto-generated from name)
- Students can also be matched by hall_ticket/roll_number

