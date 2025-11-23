-- sql/003_add_ai_fields.sql
-- Add AI-related fields to support ML features

SET search_path = campus360_dev;

-- Add resume_json field to profiles table for storing parsed resume data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resume_json jsonb;

-- Add index for faster queries on resume_json
CREATE INDEX IF NOT EXISTS idx_profiles_resume_json ON profiles USING gin(resume_json);

