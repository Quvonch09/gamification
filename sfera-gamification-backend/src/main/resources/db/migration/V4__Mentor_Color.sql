-- Add color column to mentors table
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS color VARCHAR(30) DEFAULT '#4f46e5';

-- Set some initial nice distinct palette colors for existing mentors if any
UPDATE mentors SET color = '#10b981' WHERE id = 1 AND color IS NULL;
UPDATE mentors SET color = '#3b82f6' WHERE id = 2 AND color IS NULL;
UPDATE mentors SET color = '#ef4444' WHERE id = 3 AND color IS NULL;
UPDATE mentors SET color = '#f59e0b' WHERE id = 4 AND color IS NULL;
UPDATE mentors SET color = '#8b5cf6' WHERE id = 5 AND color IS NULL;
