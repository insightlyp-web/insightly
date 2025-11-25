-- sql/004_add_resume_url.sql
-- Add resume_url field to profiles table for storing resume file paths

SET search_path = campus360_dev;

-- Add resume_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resume_url text;

-- Create index for faster queries on resume_url
CREATE INDEX IF NOT EXISTS idx_profiles_resume_url ON profiles(resume_url) WHERE resume_url IS NOT NULL;

