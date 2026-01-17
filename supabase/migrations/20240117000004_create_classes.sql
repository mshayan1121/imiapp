-- Classes Table
create table public.classes (
  id uuid not null default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  primary key (id)
);

-- Class Students Junction Table
create table public.class_students (
  id uuid not null default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  qualification_id uuid references public.qualifications(id),
  board_id uuid references public.boards(id),
  subject_id uuid references public.subjects(id),
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS
alter table public.classes enable row level security;
alter table public.class_students enable row level security;

-- Policies for Classes

-- Admins can do everything
create policy "Admins can do everything on classes"
  on public.classes
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Teachers can view their own classes
create policy "Teachers can view assigned classes"
  on public.classes for select
  using (teacher_id = auth.uid());

-- Policies for Class Students

-- Admins can do everything
create policy "Admins can do everything on class_students"
  on public.class_students
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Teachers can view students in their classes
create policy "Teachers can view students in their classes"
  on public.class_students for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = class_students.class_id
      and classes.teacher_id = auth.uid()
    )
  );
