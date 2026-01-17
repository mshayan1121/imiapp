-- Create parent_contacts table
CREATE TABLE IF NOT EXISTS public.parent_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('message', 'call', 'meeting')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved')),
    notes TEXT,
    contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, term_id, contact_type)
);

-- RLS policies
ALTER TABLE public.parent_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage parent contacts" ON public.parent_contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.parent_contacts TO authenticated;
