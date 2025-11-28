-- sql/009_separate_role_tables.sql
-- Separate tables for students, faculty, and HOD with department-based structure
-- This migration creates new tables and migrates data from profiles table

SET search_path = campus360_dev;

-- 1. Create students table (department-based)
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  department text NOT NULL,
  academic_year text,
  student_year text CHECK (student_year IN ('I', 'II', 'III', 'IV')),
  section text CHECK (section IN ('A', 'B', 'C', 'D')),
  roll_number text,
  hall_ticket text,
  gpa numeric(4,2),
  resume_json jsonb,
  resume_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(department, academic_year, student_year, section, roll_number) WHERE roll_number IS NOT NULL
);

-- 2. Create faculty table (department-based)
CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  department text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create hod table (one per department)
CREATE TABLE IF NOT EXISTS hod (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  department text NOT NULL UNIQUE, -- One HOD per department
  created_at timestamptz DEFAULT now()
);

-- 4. Create admin table
CREATE TABLE IF NOT EXISTS admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- 5. Add eligibility criteria to placement_posts
ALTER TABLE placement_posts 
ADD COLUMN IF NOT EXISTS eligible_departments text[], -- Array of department names
ADD COLUMN IF NOT EXISTS min_gpa numeric(4,2), -- Minimum GPA requirement
ADD COLUMN IF NOT EXISTS min_year int, -- Minimum year (1, 2, 3, 4)
ADD COLUMN IF NOT EXISTS max_year int, -- Maximum year (1, 2, 3, 4)
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 6. Add status tracking fields to placement_applications
ALTER TABLE placement_applications
ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb, -- Track status changes
ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
ADD COLUMN IF NOT EXISTS status_changed_by uuid REFERENCES admin(id) ON DELETE SET NULL;

-- 7. Create notifications table for HOD to send messages to students
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL, -- HOD or Admin ID
  sender_type text NOT NULL CHECK (sender_type IN ('hod', 'admin', 'faculty')),
  recipient_id uuid NOT NULL, -- Student ID
  recipient_type text NOT NULL DEFAULT 'student',
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('attendance_warning', 'attendance_critical', 'general', 'placement', 'academic')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_hod_department ON hod(department);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_placement_posts_active ON placement_posts(active);
CREATE INDEX IF NOT EXISTS idx_placement_posts_eligible_dept ON placement_posts USING GIN(eligible_departments);

-- 9. Update foreign key references (will be done in migration script)
-- Note: We'll need to update all foreign keys from profiles(id) to the new tables

