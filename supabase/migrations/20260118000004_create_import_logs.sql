-- Create import_logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type TEXT NOT NULL, -- 'teachers' or 'students'
    file_name TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    total_rows INTEGER,
    success_count INTEGER,
    failed_count INTEGER,
    skipped_count INTEGER,
    log_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- create indexes
CREATE INDEX IF NOT EXISTS idx_import_logs_uploaded_by ON public.import_logs(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON public.import_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_type ON public.import_logs(import_type);

-- Policies for import_logs
CREATE POLICY "Admins can view import logs" ON public.import_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert import logs" ON public.import_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.import_logs TO authenticated;
GRANT SELECT ON public.import_logs TO anon;

-- Ensure profiles table has proper admin check for the bulk upload process
-- (Assuming profiles table already exists and has 'role' column)
