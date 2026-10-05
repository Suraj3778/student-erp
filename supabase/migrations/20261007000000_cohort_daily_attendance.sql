-- Allow attendance sessions to represent one course cohort, not an entire
-- course across every section, semester, year level, and academic year.

begin;

alter table public.attendance_sessions
  add column if not exists section text not null default '',
  add column if not exists semester integer not null default 0,
  add column if not exists year_level integer not null default 0,
  add column if not exists academic_year text not null default '';

alter table public.attendance_sessions
  drop constraint if exists attendance_sessions_one_lecture_per_day,
  add constraint attendance_sessions_one_lecture_per_cohort
    unique (course_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on);

drop function if exists public.save_teacher_class_attendance(uuid, integer, text, date, jsonb);

create or replace function public.save_teacher_class_attendance(
  p_course_id uuid,
  p_section text,
  p_semester integer,
  p_year_level integer,
  p_academic_year text,
  p_lecture_number integer,
  p_session_type text,
  p_held_on date,
  p_records jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_submitted_count integer;
  v_distinct_count integer;
  v_enrolled_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in before saving class attendance';
  end if;

  if not (
    public.is_portal_admin()
    or (
      public.is_portal_teacher()
      and public.teacher_has_course(p_course_id)
    )
  ) then
    raise exception 'This subject is not assigned to your teacher account';
  end if;

  if p_section is null
    or p_semester is null or p_semester < 0 or p_semester > 8
    or p_year_level is null or p_year_level < 0 or p_year_level > 4
    or p_academic_year is null
  then
    raise exception 'Choose a valid section, semester, year level, and academic year';
  end if;

  if p_lecture_number is null or p_lecture_number < 1 then
    raise exception 'Lecture number must be a positive whole number';
  end if;

  if p_session_type is null or p_session_type not in ('theory', 'lab') then
    raise exception 'Class type must be theory or lab';
  end if;

  if p_held_on is null or p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'Attendance date and student roster are required';
  end if;

  select count(*), count(distinct submitted.student_id)
  into v_submitted_count, v_distinct_count
  from jsonb_to_recordset(p_records) as submitted(student_id uuid, status text);

  if v_submitted_count = 0 or v_submitted_count <> v_distinct_count then
    raise exception 'Attendance must include each student exactly once';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_records) as submitted(student_id uuid, status text)
    where submitted.student_id is null
      or submitted.status not in ('present', 'absent')
  ) then
    raise exception 'Every student must be marked present or absent';
  end if;

  select count(*)
  into v_enrolled_count
  from public.enrollments e
  join public.profiles p on p.id = e.student_id
  where e.course_id = p_course_id
    and coalesce(p.section, '') = p_section
    and coalesce(p.semester, 0) = p_semester
    and coalesce(p.year_level, 0) = p_year_level
    and coalesce(p.academic_year, '') = p_academic_year;

  if v_submitted_count <> v_enrolled_count
    or exists (
      select 1
      from public.enrollments e
      join public.profiles p on p.id = e.student_id
      where e.course_id = p_course_id
        and coalesce(p.section, '') = p_section
        and coalesce(p.semester, 0) = p_semester
        and coalesce(p.year_level, 0) = p_year_level
        and coalesce(p.academic_year, '') = p_academic_year
        and not exists (
          select 1
          from jsonb_to_recordset(p_records) as submitted(student_id uuid, status text)
          where submitted.student_id = e.student_id
        )
    )
  then
    raise exception 'Submit attendance for every enrolled student in this cohort';
  end if;

  insert into public.attendance_sessions (
    course_id,
    teacher_id,
    section,
    semester,
    year_level,
    academic_year,
    lecture_number,
    session_type,
    held_on
  )
  values (
    p_course_id,
    auth.uid(),
    p_section,
    p_semester,
    p_year_level,
    p_academic_year,
    p_lecture_number,
    p_session_type,
    p_held_on
  )
  on conflict (course_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on)
  do update set updated_at = now()
  where public.attendance_sessions.teacher_id = auth.uid()
     or public.is_portal_admin()
  returning id into v_session_id;

  if v_session_id is null then
    raise exception 'This lecture record belongs to another teacher';
  end if;

  delete from public.attendance_records
  where session_id = v_session_id;

  insert into public.attendance_records (session_id, student_id, status)
  select v_session_id, submitted.student_id, submitted.status
  from jsonb_to_recordset(p_records) as submitted(student_id uuid, status text);

  return v_session_id;
end;
$$;

revoke all on function public.save_teacher_class_attendance(uuid, text, integer, integer, text, integer, text, date, jsonb)
  from public, anon;
grant execute on function public.save_teacher_class_attendance(uuid, text, integer, integer, text, integer, text, date, jsonb)
  to authenticated;

notify pgrst, 'reload schema';

commit;
