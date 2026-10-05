-- Extend existing student profiles with their current academic cohort and
-- create a profile for public Auth signups without trusting a supplied role.

begin;

alter table public.profiles
  add column if not exists section text,
  add column if not exists year_level integer,
  add column if not exists academic_year text,
  add column if not exists admission_year integer;

create or replace function public.provision_student_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metadata jsonb;
begin
  v_metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  if v_metadata ->> 'portal_registration' is distinct from 'student' then
    return new;
  end if;

  if nullif(btrim(new.email), '') is null
    or nullif(btrim(v_metadata ->> 'full_name'), '') is null
    or nullif(btrim(v_metadata ->> 'student_id'), '') is null
    or nullif(btrim(v_metadata ->> 'phone'), '') is null
    or nullif(btrim(v_metadata ->> 'course'), '') is null
    or nullif(btrim(v_metadata ->> 'department'), '') is null
    or nullif(btrim(v_metadata ->> 'section'), '') is null
    or nullif(btrim(v_metadata ->> 'university'), '') is null
  then
    raise exception 'Student registration is missing required profile information';
  end if;

  if coalesce(v_metadata ->> 'semester', '') !~ '^[1-8]$'
    or coalesce(v_metadata ->> 'year_level', '') !~ '^[1-4]$'
    or coalesce(v_metadata ->> 'academic_year', '') !~ '^[0-9]{4}-[0-9]{2}$'
    or coalesce(v_metadata ->> 'admission_year', '') !~ '^[0-9]{4}$'
  then
    raise exception 'Student registration has invalid semester, year, or academic-year values';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    student_id,
    phone,
    course,
    department,
    section,
    semester,
    year_level,
    academic_year,
    admission_year,
    university,
    role
  )
  values (
    new.id,
    new.email,
    nullif(btrim(v_metadata ->> 'full_name'), ''),
    nullif(btrim(v_metadata ->> 'student_id'), ''),
    nullif(btrim(v_metadata ->> 'phone'), ''),
    nullif(btrim(v_metadata ->> 'course'), ''),
    nullif(btrim(v_metadata ->> 'department'), ''),
    nullif(btrim(v_metadata ->> 'section'), ''),
    nullif(v_metadata ->> 'semester', '')::integer,
    nullif(v_metadata ->> 'year_level', '')::integer,
    nullif(btrim(v_metadata ->> 'academic_year'), ''),
    nullif(v_metadata ->> 'admission_year', '')::integer,
    nullif(btrim(v_metadata ->> 'university'), ''),
    'student'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    student_id = coalesce(excluded.student_id, public.profiles.student_id),
    phone = coalesce(excluded.phone, public.profiles.phone),
    course = coalesce(excluded.course, public.profiles.course),
    department = coalesce(excluded.department, public.profiles.department),
    section = coalesce(excluded.section, public.profiles.section),
    semester = coalesce(excluded.semester, public.profiles.semester),
    year_level = coalesce(excluded.year_level, public.profiles.year_level),
    academic_year = coalesce(excluded.academic_year, public.profiles.academic_year),
    admission_year = coalesce(excluded.admission_year, public.profiles.admission_year),
    university = coalesce(excluded.university, public.profiles.university),
    role = 'student';

  return new;
end;
$$;

drop trigger if exists provision_student_profile_after_auth_signup on auth.users;
create trigger provision_student_profile_after_auth_signup
  after insert on auth.users
  for each row execute function public.provision_student_profile_from_auth();

create or replace function public.guard_portal_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if public.is_portal_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role in ('admin', 'teacher') then
      raise exception 'Privileged portal roles must be assigned by an administrator';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.student_id is distinct from old.student_id
    or new.email is distinct from old.email
    or new.course is distinct from old.course
    or new.semester is distinct from old.semester
    or new.department is distinct from old.department
    or new.university is distinct from old.university
    or new.profile_image is distinct from old.profile_image
    or new.section is distinct from old.section
    or new.year_level is distinct from old.year_level
    or new.academic_year is distinct from old.academic_year
    or new.admission_year is distinct from old.admission_year
    or new.role is distinct from old.role
  then
    raise exception 'Only an administrator can change protected profile fields';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
