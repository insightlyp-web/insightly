-- sql/007_add_course_academic_year.sql
-- Add academic_year field to courses table

SET search_path = campus360_dev;

-- Add academic_year column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS academic_year text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON courses(academic_year) WHERE academic_year IS NOT NULL;

