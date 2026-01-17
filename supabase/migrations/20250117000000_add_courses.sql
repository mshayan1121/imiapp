
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  qualification_id uuid references qualifications(id) not null,
  board_id uuid references boards(id) not null,
  subject_id uuid references subjects(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table class_students add column course_id uuid references courses(id);

-- Drop old columns as per requirement
alter table class_students drop column qualification_id;
alter table class_students drop column board_id;
alter table class_students drop column subject_id;
