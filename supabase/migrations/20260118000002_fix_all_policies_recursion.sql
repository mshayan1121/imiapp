-- Update policies to use security definer functions to avoid recursion
-- and improve performance.

-- 1. Terms Table
DROP POLICY IF EXISTS "Admin full access for terms" ON public.terms;
CREATE POLICY "Admin full access for terms" ON public.terms
  FOR ALL USING (public.check_is_admin());

-- 2. Courses Table
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
CREATE POLICY "Admins can do everything on courses" ON public.courses
  FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Teachers can view courses" ON public.courses;
CREATE POLICY "Teachers can view courses" ON public.courses
  FOR SELECT USING (public.check_is_teacher());

-- 3. Classes Table
DROP POLICY IF EXISTS "Admins can do everything on classes" ON public.classes;
CREATE POLICY "Admins can do everything on classes" ON public.classes
  FOR ALL USING (public.check_is_admin());

-- 4. Students Table
DROP POLICY IF EXISTS "Admins can do everything on students" ON public.students;
CREATE POLICY "Admins can do everything on students" ON public.students
  FOR ALL USING (public.check_is_admin());

-- 5. Class Students Table
DROP POLICY IF EXISTS "Admins can do everything on class_students" ON public.class_students;
CREATE POLICY "Admins can do everything on class_students" ON public.class_students
  FOR ALL USING (public.check_is_admin());

-- 6. Curriculum (Subjects, Topics, Subtopics)
DROP POLICY IF EXISTS "Admins can do everything on subjects" ON public.subjects;
CREATE POLICY "Admins can do everything on subjects" ON public.subjects
  FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins can do everything on topics" ON public.topics;
CREATE POLICY "Admins can do everything on topics" ON public.topics
  FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins can do everything on subtopics" ON public.subtopics;
CREATE POLICY "Admins can do everything on subtopics" ON public.subtopics
  FOR ALL USING (public.check_is_admin());

-- 7. Parent Contacts
DROP POLICY IF EXISTS "Admins can do everything on parent_contacts" ON public.parent_contacts;
CREATE POLICY "Admins can do everything on parent_contacts" ON public.parent_contacts
  FOR ALL USING (public.check_is_admin());

-- 8. Grades
DROP POLICY IF EXISTS "Admins can view all grades" ON public.grades;
CREATE POLICY "Admins can view all grades" ON public.grades
  FOR SELECT USING (public.check_is_admin());
