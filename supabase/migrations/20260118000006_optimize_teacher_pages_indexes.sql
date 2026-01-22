-- Performance Optimization: Add missing indexes for teacher pages (students, grades, reports)
-- Generated: 2026-01-18

-- Optimize students directory queries
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_term ON public.grades(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_students_year_group ON public.students(year_group);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school);

-- Optimize grades queries with composite indexes
CREATE INDEX IF NOT EXISTS idx_grades_entered_by_term_assessed ON public.grades(entered_by, term_id, assessed_date DESC);
CREATE INDEX IF NOT EXISTS idx_grades_entered_by_class_term ON public.grades(entered_by, class_id, term_id);

-- Optimize reports queries
CREATE INDEX IF NOT EXISTS idx_grades_class_term_percentage ON public.grades(class_id, term_id, percentage);

-- Optimize class_students lookups by class_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
