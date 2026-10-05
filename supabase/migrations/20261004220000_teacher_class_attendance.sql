-- Per-lecture, per-student attendance for theory and lab classes.
-- Apply after the role-aware portal RLS migration.

begin;

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete restrict,
  lecture_number integer not null check (lecture_number > 0),
  session_type text not null check (session_type in ('theory', 'lab')),
  held_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_one_lecture_per_day
    unique (course_id, lecture_number, session_type, held_on)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present', 'absent')),
  created_at timestamptz not null default now(),
  constraint attendance_records_one_student_per_session unique (session_id, student_id)
);

create index if not exists attendance_sessions_course_date_idx
  on public.attendance_sessions (course_id, held_on desc);
create index if not exists attendance_records_student_session_idx
  on public.attendance_records (student_id, session_id);

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

revoke all privileges on table public.attendance_sessions, public.attendance_records
  from public, anon;
grant select, insert, update, delete on table
  public.attendance_sessions,
  public.attendance_records
to authenticated;

drop policy if exists attendance_sessions_portal_authenticated_baseline on public.attendance_sessions;
create policy attendance_sessions_portal_authenticated_baseline on public.attendance_sessions
  as permissive for all to authenticated using (true) with check (true);
drop policy if exists attendance_records_portal_authenticated_baseline on public.attendance_records;
create policy attendance_records_portal_authenticated_baseline on public.attendance_records
  as permissive for all to authenticated using (true) with check (true);

drop policy if exists attendance_sessions_portal_select_scope on public.attendance_sessions;
create policy attendance_sessions_portal_select_scope on public.attendance_sessions
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_has_course(course_id)
    or public.student_is_enrolled_in_course(auth.uid(), course_id)
  );

drop policy if exists attendance_sessions_portal_insert_scope on public.attendance_sessions;
create policy attendance_sessions_portal_insert_scope on public.attendance_sessions
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or (
      teacher_id = auth.uid()
      and public.is_portal_teacher()
      and public.teacher_has_course(course_id)
    )
  );

drop policy if exists attendance_sessions_portal_update_scope on public.attendance_sessions;
create policy attendance_sessions_portal_update_scope on public.attendance_sessions
  as restrictive for update to authenticated
  using (
    public.is_portal_admin()
    or (teacher_id = auth.uid() and public.is_portal_teacher() and public.teacher_has_course(course_id))
  )
  with check (
    public.is_portal_admin()
    or (teacher_id = auth.uid() and public.is_portal_teacher() and public.teacher_has_course(course_id))
  );

drop policy if exists attendance_sessions_portal_delete_scope on public.attendance_sessions;
create policy attendance_sessions_portal_delete_scope on public.attendance_sessions
  as restrictive for delete to authenticated
  using (
    public.is_portal_admin()
    or (teacher_id = auth.uid() and public.is_portal_teacher() and public.teacher_has_course(course_id))
  );

drop policy if exists attendance_records_portal_select_scope on public.attendance_records;
create policy attendance_records_portal_select_scope on public.attendance_records
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or student_id = auth.uid()
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and public.teacher_can_access_student(student_id, s.course_id)
    )
  );

drop policy if exists attendance_records_portal_insert_scope on public.attendance_records;
create policy attendance_records_portal_insert_scope on public.attendance_records
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and s.teacher_id = auth.uid()
        and public.teacher_can_access_student(student_id, s.course_id)
    )
  );

drop policy if exists attendance_records_portal_update_scope on public.attendance_records;
create policy attendance_records_portal_update_scope on public.attendance_records
  as restrictive for update to authenticated
  using (
    public.is_portal_admin()
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and s.teacher_id = auth.uid()
        and public.teacher_can_access_student(student_id, s.course_id)
    )
  )
  with check (
    public.is_portal_admin()
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and s.teacher_id = auth.uid()
        and public.teacher_can_access_student(student_id, s.course_id)
    )
  );

drop policy if exists attendance_records_portal_delete_scope on public.attendance_records;
create policy attendance_records_portal_delete_scope on public.attendance_records
  as restrictive for delete to authenticated
  using (
    public.is_portal_admin()
    or exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and s.teacher_id = auth.uid()
        and public.is_portal_teacher()
        and public.teacher_has_course(s.course_id)
    )
  );

create or replace function public.save_teacher_class_attendance(
  p_course_id uuid,
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
  where e.course_id = p_course_id;

  if v_submitted_count <> v_enrolled_count
    or exists (
      select 1
      from public.enrollments e
      where e.course_id = p_course_id
        and not exists (
          select 1
          from jsonb_to_recordset(p_records) as submitted(student_id uuid, status text)
          where submitted.student_id = e.student_id
        )
    )
  then
    raise exception 'Submit attendance for every student currently enrolled in this subject';
  end if;

  insert into public.attendance_sessions (
    course_id,
    teacher_id,
    lecture_number,
    session_type,
    held_on
  )
  values (
    p_course_id,
    auth.uid(),
    p_lecture_number,
    p_session_type,
    p_held_on
  )
  on conflict (course_id, lecture_number, session_type, held_on)
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

revoke all on function public.save_teacher_class_attendance(uuid, integer, text, date, jsonb)
  from public, anon;
grant execute on function public.save_teacher_class_attendance(uuid, integer, text, date, jsonb)
  to authenticated;

commit;
