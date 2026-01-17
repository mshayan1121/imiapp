-- Allow teachers to view students in their classes
create policy "Teachers can view students in their classes"
  on public.students for select
  using (
    exists (
      select 1 from public.class_students
      join public.classes on classes.id = class_students.class_id
      where class_students.student_id = students.id
      and classes.teacher_id = auth.uid()
    )
  );

-- Allow teachers to view curriculum
create policy "Teachers can view qualifications" 
  on public.qualifications for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

create policy "Teachers can view boards" 
  on public.boards for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

create policy "Teachers can view subjects" 
  on public.subjects for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

create policy "Teachers can view topics" 
  on public.topics for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

create policy "Teachers can view subtopics" 
  on public.subtopics for select 
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));
