-- sql/008_add_location_fields.sql
-- Add location-based attendance verification fields to attendance_sessions table

SET search_path = campus360_dev;

-- Add location fields to attendance_sessions table
ALTER TABLE attendance_sessions
ADD COLUMN IF NOT EXISTS location_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS faculty_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS faculty_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS allowed_radius INTEGER DEFAULT 50;

-- Create index for faster queries on location_required
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_location_required 
ON attendance_sessions(location_required) 
WHERE location_required = true;

