-- Performance Optimization: Create database functions to reduce query round trips
-- Generated: 2026-01-18

-- Function to get active term (cached at database level)
CREATE OR REPLACE FUNCTION get_active_term()
RETURNS TABLE (
  id UUID,
  name TEXT,
  is_active BOOLEAN,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.is_active, t.start_date, t.end_date
  FROM public.terms t
  WHERE t.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get teacher's students with stats in a single query
-- This reduces 5-6 queries down to 1 query
-- Now includes class_students relationships to eliminate extra queries
-- Drop existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_teacher_students_with_stats(UUID, UUID, INT, INT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION get_teacher_students_with_stats(
  p_teacher_id UUID,
  p_term_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_search TEXT DEFAULT NULL,
  p_year_group TEXT DEFAULT NULL,
  p_school TEXT DEFAULT NULL,
  p_class_id UUID DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  year_group TEXT,
  school TEXT,
  total_grades BIGINT,
  low_points BIGINT,
  avg_percentage NUMERIC,
  flag_count INT,
  status TEXT,
  total_count BIGINT,
  class_students JSONB
) AS $$
DECLARE
  v_offset INT;
  v_limit INT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_limit := p_page_size;

  RETURN QUERY
  WITH teacher_classes AS (
    SELECT id
    FROM public.classes
    WHERE teacher_id = p_teacher_id
  ),
  enrolled_students AS (
    SELECT DISTINCT cs.student_id
    FROM public.class_students cs
    INNER JOIN teacher_classes tc ON cs.class_id = tc.id
    WHERE (p_class_id IS NULL OR cs.class_id = p_class_id)
  ),
  student_grades AS (
    SELECT 
      g.student_id,
      COUNT(*) as grade_count,
      COUNT(*) FILTER (WHERE g.is_low_point = true) as lp_count,
      AVG(g.percentage) as avg_pct
    FROM public.grades g
    INNER JOIN enrolled_students es ON g.student_id = es.student_id
    WHERE g.term_id = p_term_id
    GROUP BY g.student_id
  ),
  filtered_students AS (
    SELECT 
      s.id,
      s.name,
      s.year_group,
      s.school,
      COALESCE(sg.grade_count, 0)::BIGINT as total_grades,
      COALESCE(sg.lp_count, 0)::BIGINT as low_points,
      COALESCE(sg.avg_pct, 0)::NUMERIC as avg_percentage,
      CASE 
        WHEN COALESCE(sg.lp_count, 0) >= 5 THEN 3
        WHEN COALESCE(sg.lp_count, 0) = 4 THEN 2
        WHEN COALESCE(sg.lp_count, 0) = 3 THEN 1
        ELSE 0
      END as flag_count,
      CASE 
        WHEN COALESCE(sg.avg_pct, 0) < 70 THEN 'Struggling'
        WHEN COALESCE(sg.avg_pct, 0) < 80 THEN 'At Risk'
        ELSE 'On Track'
      END as status
    FROM public.students s
    INNER JOIN enrolled_students es ON s.id = es.student_id
    LEFT JOIN student_grades sg ON s.id = sg.student_id
    WHERE 
      (p_search IS NULL OR s.name ILIKE '%' || p_search || '%')
      AND (p_year_group IS NULL OR s.year_group = p_year_group)
      AND (p_school IS NULL OR s.school = p_school)
  )
  SELECT 
    fs.id as student_id,
    fs.name as student_name,
    fs.year_group,
    fs.school,
    fs.total_grades,
    fs.low_points,
    fs.avg_percentage,
    fs.flag_count,
    fs.status,
    COUNT(*) OVER() as total_count,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'class', jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'teacher_id', c.teacher_id
            ),
            'course', jsonb_build_object(
              'id', co.id,
              'name', co.name
            )
          ) ORDER BY c.name
        )
        FROM public.class_students cs
        INNER JOIN public.classes c ON cs.class_id = c.id
        INNER JOIN public.courses co ON cs.course_id = co.id
        WHERE cs.student_id = fs.id
          AND c.teacher_id = p_teacher_id
      ),
      '[]'::jsonb
    ) as class_students
  FROM filtered_students fs
  ORDER BY fs.name
  OFFSET v_offset
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get class performance summary for dashboard
CREATE OR REPLACE FUNCTION get_class_performance_summary(
  p_teacher_id UUID,
  p_term_id UUID
)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  student_count BIGINT,
  avg_percentage NUMERIC,
  low_point_count BIGINT,
  grade_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH class_students_count AS (
    SELECT 
      c.id as class_id,
      COUNT(DISTINCT cs.student_id) as student_count
    FROM public.classes c
    LEFT JOIN public.class_students cs ON c.id = cs.class_id
    WHERE c.teacher_id = p_teacher_id
    GROUP BY c.id
  ),
  class_grades_stats AS (
    SELECT 
      g.class_id,
      COUNT(*) as grade_count,
      AVG(g.percentage) as avg_pct,
      COUNT(*) FILTER (WHERE g.is_low_point = true) as lp_count
    FROM public.grades g
    INNER JOIN public.classes c ON g.class_id = c.id
    WHERE c.teacher_id = p_teacher_id
      AND g.term_id = p_term_id
    GROUP BY g.class_id
  )
  SELECT 
    c.id as class_id,
    c.name as class_name,
    COALESCE(csc.student_count, 0)::BIGINT as student_count,
    COALESCE(cgs.avg_pct, 0)::NUMERIC as avg_percentage,
    COALESCE(cgs.lp_count, 0)::BIGINT as low_point_count,
    COALESCE(cgs.grade_count, 0)::BIGINT as grade_count
  FROM public.classes c
  LEFT JOIN class_students_count csc ON c.id = csc.class_id
  LEFT JOIN class_grades_stats cgs ON c.id = cgs.class_id
  WHERE c.teacher_id = p_teacher_id
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_term() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_students_with_stats(UUID, UUID, INT, INT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_performance_summary(UUID, UUID) TO authenticated;
