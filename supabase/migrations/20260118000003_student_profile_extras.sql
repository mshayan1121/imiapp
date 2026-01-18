-- Create student_contacts table
CREATE TABLE IF NOT EXISTS public.student_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'message')),
    address TEXT,
    city TEXT,
    postal_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create student_notes table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Policies for student_contacts
CREATE POLICY "Teachers can view student contacts for their students" ON public.student_contacts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            JOIN public.class_students ON classes.id = class_students.class_id
            WHERE class_students.student_id = student_contacts.student_id
            AND classes.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage student contacts" ON public.student_contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for student_notes
CREATE POLICY "Teachers can view notes for their students" ON public.student_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            JOIN public.class_students ON classes.id = class_students.class_id
            WHERE class_students.student_id = student_notes.student_id
            AND classes.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Teachers can manage their own notes" ON public.student_notes
    FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all notes" ON public.student_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all notes" ON public.student_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.student_contacts TO authenticated;
GRANT ALL ON public.student_notes TO authenticated;
