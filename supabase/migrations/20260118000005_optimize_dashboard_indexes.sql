-- Performance Optimization: Add missing indexes for teacher dashboard queries
-- Generated: 2026-01-18

-- Index for grades queries by entered_by (teacher)
CREATE INDEX IF NOT EXISTS idx_grades_entered_by ON public.grades(entered_by);

-- Composite index for recent grades query (entered_by + created_at ordering)
CREATE INDEX IF NOT EXISTS idx_grades_entered_by_created_at ON public.grades(entered_by, created_at DESC);

-- Composite index for grades by class, term, and low point status
CREATE INDEX IF NOT EXISTS idx_grades_class_term_lowpoint ON public.grades(class_id, term_id, is_low_point);

-- Index for terms by is_active (used to find active term)
CREATE INDEX IF NOT EXISTS idx_terms_is_active ON public.terms(is_active) WHERE is_active = true;

-- Composite index for grades count query (entered_by + term_id)
CREATE INDEX IF NOT EXISTS idx_grades_entered_by_term ON public.grades(entered_by, term_id);
