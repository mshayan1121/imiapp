-- Make subtopic_id nullable in grades table
ALTER TABLE grades ALTER COLUMN subtopic_id DROP NOT NULL;

-- Ensure topic_id is NOT NULL (it should be already, but for safety)
ALTER TABLE grades ALTER COLUMN topic_id SET NOT NULL;
