-- sql/002_add_student_fields.sql
-- Add student-specific fields: academic_year, student_year, section, roll_number

SET search_path = campus360_dev;

-- Add new columns to profiles table for students
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS academic_year text,
ADD COLUMN IF NOT EXISTS student_year text CHECK (student_year IN ('I', 'II', 'III', 'IV')),
ADD COLUMN IF NOT EXISTS section text CHECK (section IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS roll_number text;

-- Create unique constraint for roll_number per department, academic_year, student_year, section
-- This ensures each student has a unique roll number within their class
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_roll_number 
ON profiles (department, academic_year, student_year, section, roll_number) 
WHERE role = 'student' AND roll_number IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_student_year ON profiles(student_year) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_profiles_section ON profiles(section) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_profiles_academic_year ON profiles(academic_year) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_profiles_roll_number ON profiles(roll_number) WHERE role = 'student';

