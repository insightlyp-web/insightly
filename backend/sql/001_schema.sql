-- sql/001_schema.sql
CREATE SCHEMA IF NOT EXISTS campus360_dev;
SET search_path = campus360_dev;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL CHECK (role IN ('student','faculty','admin','hod')),
  department text,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  hod_id uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  department text,
  year int,
  faculty_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  session_code text NOT NULL UNIQUE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS placement_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  company_name text NOT NULL,
  job_type text CHECK (job_type IN ('internship','fulltime')),
  package text,
  required_skills text[],
  deadline timestamptz,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES placement_posts(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  resume_url text,
  cover_letter text,
  status text NOT NULL CHECK (status IN ('applied','mentor_approved','mentor_rejected','shortlisted','not_shortlisted','selected','rejected')) DEFAULT 'applied',
  mentor_id uuid REFERENCES profiles(id),
  mentor_feedback text,
  admin_feedback text,
  recruiter_feedback text,
  applied_at timestamptz DEFAULT now(),
  UNIQUE(post_id, student_id)
);

-- Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  day_of_week text CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_no text,
  created_at timestamptz DEFAULT now()
);

-- Assessments and Marks
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('internal_exam','assignment','quiz','lab','project')),
  max_marks int NOT NULL DEFAULT 100,
  weightage numeric(5,2),
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marks_obtained numeric(6,2) NOT NULL,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_course ON attendance_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_assessment ON assessment_marks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_student ON assessment_marks(student_id);
