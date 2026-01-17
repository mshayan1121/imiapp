-- Security Audit & RLS Fixes
-- Generated: 2026-01-18

-- 1. Profiles: Restrict access
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Create stricter policies
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Grades: Fix teacher permissions to be based on Class ownership, not just 'entered_by'
-- Drop existing policies that might be too loose or restrictive
DROP POLICY IF EXISTS "Teachers can manage their own grade entries" ON public.grades;

-- Teachers can INSERT grades for their classes
CREATE POLICY "Teachers can insert grades for their classes"
  ON public.grades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = grades.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can UPDATE grades for their classes
CREATE POLICY "Teachers can update grades for their classes"
  ON public.grades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = grades.class_id
      AND classes.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = grades.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can DELETE grades for their classes
CREATE POLICY "Teachers can delete grades for their classes"
  ON public.grades FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = grades.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- 3. Database Constraints (Phase 2 item, but doing it here as it's SQL)
-- Grades checks
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS marks_check;
ALTER TABLE public.grades ADD CONSTRAINT marks_check CHECK (marks_obtained <= total_marks AND marks_obtained >= 0);

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS percentage_check;
ALTER TABLE public.grades ADD CONSTRAINT percentage_check CHECK (percentage >= 0 AND percentage <= 100);

-- Terms checks
ALTER TABLE public.terms DROP CONSTRAINT IF EXISTS dates_check;
ALTER TABLE public.terms ADD CONSTRAINT dates_check CHECK (end_date > start_date);

-- 4. Database Indexes (Phase 2 item)
CREATE INDEX IF NOT EXISTS idx_grades_student_class_term ON public.grades(student_id, class_id, term_id);
CREATE INDEX IF NOT EXISTS idx_grades_term_lowpoint ON public.grades(term_id, is_low_point);
CREATE INDEX IF NOT EXISTS idx_class_students_class_student ON public.class_students(class_id, student_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);

