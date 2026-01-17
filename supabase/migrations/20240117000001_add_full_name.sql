alter table public.profiles add column full_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;
