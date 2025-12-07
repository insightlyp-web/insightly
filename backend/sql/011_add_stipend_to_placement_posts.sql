-- Add stipend field to placement_posts for internship posts
ALTER TABLE campus360_dev.placement_posts 
ADD COLUMN IF NOT EXISTS stipend TEXT;

COMMENT ON COLUMN campus360_dev.placement_posts.stipend IS 'Stipend amount for internship posts (e.g., "30k/month", "5000/week")';

