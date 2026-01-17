-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
    work_type TEXT NOT NULL CHECK (work_type IN ('classwork', 'homework')),
    work_subtype TEXT NOT NULL CHECK (work_subtype IN ('worksheet', 'pastpaper')),
    marks_obtained NUMERIC NOT NULL,
    total_marks NUMERIC NOT NULL,
    percentage NUMERIC NOT NULL,
    is_low_point BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    assessed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entered_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT marks_limit CHECK (marks_obtained <= total_marks),
    CONSTRAINT percentage_range CHECK (percentage >= 0 AND percentage <= 100)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_term_id ON public.grades(term_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON public.grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_topic_id ON public.grades(topic_id);
CREATE INDEX IF NOT EXISTS idx_grades_subtopic_id ON public.grades(subtopic_id);

-- Add RLS policies
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage grades they entered
CREATE POLICY "Teachers can manage their own grade entries" ON public.grades
    FOR ALL
    USING (auth.uid() = entered_by)
    WITH CHECK (auth.uid() = entered_by);

-- Teachers can view grades for students in their classes
CREATE POLICY "Teachers can view grades for their classes" ON public.grades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = grades.class_id
            AND classes.teacher_id = auth.uid()
        )
    );

-- Admins can do everything
CREATE POLICY "Admins have full access to grades" ON public.grades
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
