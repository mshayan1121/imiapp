-- Qualifications
create table public.qualifications (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Boards
create table public.boards (
  id uuid not null default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Subjects
create table public.subjects (
  id uuid not null default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Topics
create table public.topics (
  id uuid not null default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Subtopics
create table public.subtopics (
  id uuid not null default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS
alter table public.qualifications enable row level security;
alter table public.boards enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;

-- Policies (Admin only for now)
create policy "Admins can do everything on qualifications" on public.qualifications
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can do everything on boards" on public.boards
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can do everything on subjects" on public.subjects
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can do everything on topics" on public.topics
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can do everything on subtopics" on public.subtopics
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
