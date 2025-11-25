-- sql/006_add_course_fields.sql
-- Add subject_type and elective_group fields to courses table

SET search_path = campus360_dev;

-- Add subject_type and elective_group columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS subject_type text,
ADD COLUMN IF NOT EXISTS elective_group text,
ADD COLUMN IF NOT EXISTS semester integer;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_subject_type ON courses(subject_type) WHERE subject_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_elective_group ON courses(elective_group) WHERE elective_group IS NOT NULL;

