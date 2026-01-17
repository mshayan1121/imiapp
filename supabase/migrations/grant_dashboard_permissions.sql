-- Grant SELECT permissions to authenticated users for dashboard data
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.classes TO authenticated;
GRANT SELECT ON public.students TO authenticated;
GRANT SELECT ON public.class_students TO authenticated;
GRANT SELECT ON public.grades TO authenticated;
GRANT SELECT ON public.terms TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.topics TO authenticated;
GRANT SELECT ON public.subtopics TO authenticated;
GRANT SELECT ON public.parent_contacts TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_contacts ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policies for classes
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
CREATE POLICY "Teachers can view their own classes" ON public.classes
  FOR SELECT USING (auth.uid() = teacher_id);

-- Policies for class_students
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.class_students;
CREATE POLICY "Teachers can view students in their classes" ON public.class_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE public.classes.id = public.class_students.class_id
      AND public.classes.teacher_id = auth.uid()
    )
  );

-- Policies for students
DROP POLICY IF EXISTS "Teachers can view students enrolled in their classes" ON public.students;
CREATE POLICY "Teachers can view students enrolled in their classes" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      JOIN public.classes ON public.class_students.class_id = public.classes.id
      WHERE public.class_students.student_id = public.students.id
      AND public.classes.teacher_id = auth.uid()
    )
  );

-- Policies for terms, courses, subjects, topics, subtopics
DROP POLICY IF EXISTS "Authenticated users can view terms" ON public.terms;
CREATE POLICY "Authenticated users can view terms" ON public.terms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
CREATE POLICY "Authenticated users can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view subjects" ON public.subjects;
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.topics;
CREATE POLICY "Authenticated users can view topics" ON public.topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view subtopics" ON public.subtopics;
CREATE POLICY "Authenticated users can view subtopics" ON public.subtopics FOR SELECT TO authenticated USING (true);

-- Policies for grades
DROP POLICY IF EXISTS "Teachers can view own grades" ON grades;
CREATE POLICY "Teachers can view own grades" ON grades
  FOR SELECT USING (auth.uid() = entered_by);

-- Policies for parent_contacts
DROP POLICY IF EXISTS "Teachers can view contacts for their students" ON public.parent_contacts;
CREATE POLICY "Teachers can view contacts for their students" ON public.parent_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_students
      JOIN public.classes ON public.class_students.class_id = public.classes.id
      WHERE public.class_students.student_id = public.parent_contacts.student_id
      AND public.classes.teacher_id = auth.uid()
    )
  );
