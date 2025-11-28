-- sql/010_add_missing_columns.sql
-- Add missing columns for eligibility criteria and status tracking

SET search_path = campus360_dev;

-- 1. Add GPA column to profiles table (for students)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gpa numeric(4,2);

-- 2. Add status tracking fields to placement_applications
ALTER TABLE placement_applications
ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
ADD COLUMN IF NOT EXISTS status_changed_by uuid;

-- 3. Add eligibility criteria to placement_posts (if not already added)
ALTER TABLE placement_posts 
ADD COLUMN IF NOT EXISTS eligible_departments text[],
ADD COLUMN IF NOT EXISTS min_gpa numeric(4,2),
ADD COLUMN IF NOT EXISTS min_year int,
ADD COLUMN IF NOT EXISTS max_year int,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 4. Create notifications table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'campus360_dev' AND table_name = 'notifications') THEN
    CREATE TABLE campus360_dev.notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id uuid NOT NULL,
      sender_type text NOT NULL CHECK (sender_type IN ('hod', 'admin', 'faculty')),
      recipient_id uuid NOT NULL,
      recipient_type text NOT NULL DEFAULT 'student',
      title text NOT NULL,
      message text NOT NULL,
      type text NOT NULL CHECK (type IN ('attendance_warning', 'attendance_critical', 'general', 'placement', 'academic')),
      read boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      read_at timestamptz
    );
  END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_placement_posts_active ON placement_posts(active);
CREATE INDEX IF NOT EXISTS idx_placement_posts_eligible_dept ON placement_posts USING GIN(eligible_departments);
CREATE INDEX IF NOT EXISTS idx_profiles_gpa ON profiles(gpa) WHERE role = 'student';

