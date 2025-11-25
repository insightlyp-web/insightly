-- sql/005_add_attendance_summary.sql
-- Add attendance_summary table for monthly attendance data from Excel imports

SET search_path = campus360_dev;

-- Create attendance_summary table
CREATE TABLE IF NOT EXISTS attendance_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  attended_classes integer NOT NULL DEFAULT 0,
  total_classes integer NOT NULL DEFAULT 0,
  percentage numeric(5,2),
  month text NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id, month, year)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student ON attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_course ON attendance_summary(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_month_year ON attendance_summary(month, year);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student_course ON attendance_summary(student_id, course_id);

