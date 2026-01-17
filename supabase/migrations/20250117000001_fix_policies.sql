
-- Enable RLS on courses if not already
alter table public.courses enable row level security;

-- Policies for Courses
create policy "Admins can do everything on courses"
  on public.courses
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Teachers can view courses"
  on public.courses for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

-- Ensure class_students policies are correct (re-applying/updating if needed)
drop policy if exists "Admins can do everything on class_students" on public.class_students;
create policy "Admins can do everything on class_students"
  on public.class_students
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "Teachers can view students in their classes" on public.class_students;
create policy "Teachers can view students in their classes"
  on public.class_students for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = class_students.class_id
      and classes.teacher_id = auth.uid()
    )
  );
