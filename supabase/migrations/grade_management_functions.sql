-- Function to calculate student flags
CREATE OR REPLACE FUNCTION calculate_student_flags(p_student_id UUID, p_term_id UUID)
RETURNS TABLE (flag_count INTEGER, action_required TEXT) AS $$
DECLARE
  lp_count INTEGER;
  flags INTEGER;
BEGIN
  SELECT COUNT(*) INTO lp_count
  FROM public.grades
  WHERE grades.student_id = p_student_id 
    AND grades.term_id = p_term_id 
    AND grades.is_low_point = TRUE;

  flags := CASE
    WHEN lp_count >= 5 THEN 3
    WHEN lp_count = 4 THEN 2
    WHEN lp_count = 3 THEN 1
    ELSE 0
  END;

  RETURN QUERY
  SELECT flags, 
         CASE 
           WHEN flags = 3 THEN 'Meeting Required'
           WHEN flags = 2 THEN 'Call Parents'
           WHEN flags = 1 THEN 'Message Parents'
           ELSE 'On Track'
         END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student progress summary for a class
CREATE OR REPLACE FUNCTION get_student_progress_summary(p_class_id UUID, p_term_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  year_group TEXT,
  course_name TEXT,
  total_grades BIGINT,
  low_points BIGINT,
  average_percentage NUMERIC,
  flag_count INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.year_group,
    c.name as course_name,
    COUNT(g.id) as total_grades,
    COUNT(g.id) FILTER (WHERE g.is_low_point = TRUE) as low_points,
    COALESCE(ROUND(AVG(g.percentage), 1), 0)::NUMERIC as average_percentage,
    COALESCE((SELECT f.flag_count FROM calculate_student_flags(s.id, p_term_id) f), 0) as flag_count,
    COALESCE((SELECT f.action_required FROM calculate_student_flags(s.id, p_term_id) f), 'On Track') as status
  FROM public.students s
  JOIN public.class_students cs ON s.id = cs.student_id
  JOIN public.classes cl ON cs.class_id = cl.id
  JOIN public.courses c ON cs.course_id = c.id
  LEFT JOIN public.grades g ON s.id = g.student_id AND g.term_id = p_term_id AND g.class_id = p_class_id
  WHERE cs.class_id = p_class_id
  GROUP BY s.id, s.name, s.year_group, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_student_flags TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_progress_summary TO authenticated;
