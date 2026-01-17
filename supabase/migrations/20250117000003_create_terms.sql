-- Create terms table
CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT date_order CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for terms" ON terms
  FOR SELECT USING (true);

CREATE POLICY "Admin full access for terms" ON terms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to ensure single active term
CREATE OR REPLACE FUNCTION ensure_single_active_term()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE terms SET is_active = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single active term
CREATE TRIGGER single_active_term
BEFORE INSERT OR UPDATE ON terms
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_term();
