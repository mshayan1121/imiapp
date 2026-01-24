-- Add retake/reassign-related columns to grades
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS is_retake BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_reassigned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_grade_id UUID REFERENCES public.grades(id),
  ADD COLUMN IF NOT EXISTS homework_submitted BOOLEAN;

