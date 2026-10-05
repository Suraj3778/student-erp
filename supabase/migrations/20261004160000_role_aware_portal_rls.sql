-- Role-aware access for the existing StudentHub public tables.
-- Run after creating the tables and columns documented in README.md.

begin;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$$;

create or replace function public.is_portal_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'teacher', false)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
    );
$$;

create or replace function public.teacher_has_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.teacher_subjects ts
    where ts.teacher_id = auth.uid()
      and ts.course_id = p_course_id
  );
$$;

create or replace function public.student_is_enrolled_in_course(
  p_student_id uuid,
  p_course_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.student_id = p_student_id
      and e.course_id = p_course_id
  );
$$;

create or replace function public.teacher_can_access_student(
  p_student_id uuid,
  p_course_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select public.is_portal_teacher()
    and public.teacher_has_course(p_course_id)
    and public.student_is_enrolled_in_course(p_student_id, p_course_id);
$$;

revoke all on function public.is_portal_admin() from public, anon;
revoke all on function public.is_portal_teacher() from public, anon;
revoke all on function public.teacher_has_course(uuid) from public, anon;
revoke all on function public.student_is_enrolled_in_course(uuid, uuid) from public, anon;
revoke all on function public.teacher_can_access_student(uuid, uuid) from public, anon;
grant execute on function public.is_portal_admin() to authenticated;
grant execute on function public.is_portal_teacher() to authenticated;
grant execute on function public.teacher_has_course(uuid) to authenticated;
grant execute on function public.student_is_enrolled_in_course(uuid, uuid) to authenticated;
grant execute on function public.teacher_can_access_student(uuid, uuid) to authenticated;

-- The browser app requires authentication for every portal data request.
revoke all privileges on table
  public.profiles,
  public.courses,
  public.enrollments,
  public.assignments,
  public.attendance,
  public.results,
  public.timetable,
  public.fees,
  public.teacher_subjects
from public, anon;

grant select, insert, update, delete on table
  public.profiles,
  public.courses,
  public.enrollments,
  public.assignments,
  public.attendance,
  public.results,
  public.timetable,
  public.fees,
  public.teacher_subjects
to authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.attendance enable row level security;
alter table public.results enable row level security;
alter table public.timetable enable row level security;
alter table public.fees enable row level security;
alter table public.teacher_subjects enable row level security;

-- A permissive authenticated baseline is intersected with the restrictive
-- role/scope policies below, including any older permissive policies.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'courses',
    'enrollments',
    'assignments',
    'attendance',
    'results',
    'timetable',
    'fees',
    'teacher_subjects'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_portal_authenticated_baseline',
      table_name
    );
    execute format(
      'create policy %I on public.%I as permissive for all to authenticated using (true) with check (true)',
      table_name || '_portal_authenticated_baseline',
      table_name
    );
  end loop;
end;
$$;

-- Profiles: users read and update only themselves; assigned teachers can read
-- their enrolled roster; administrators can manage all profiles.
drop policy if exists profiles_portal_select_scope on public.profiles;
create policy profiles_portal_select_scope on public.profiles
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or id = auth.uid()
    or exists (
      select 1
      from public.enrollments e
      where e.student_id = profiles.id
        and public.teacher_has_course(e.course_id)
        and public.is_portal_teacher()
    )
  );

drop policy if exists profiles_portal_insert_scope on public.profiles;
create policy profiles_portal_insert_scope on public.profiles
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or (
      id = auth.uid()
      and coalesce(role, 'user') not in ('admin', 'teacher')
    )
  );

drop policy if exists profiles_portal_update_scope on public.profiles;
create policy profiles_portal_update_scope on public.profiles
  as restrictive for update to authenticated
  using (public.is_portal_admin() or id = auth.uid())
  with check (public.is_portal_admin() or id = auth.uid());

drop policy if exists profiles_portal_delete_scope on public.profiles;
create policy profiles_portal_delete_scope on public.profiles
  as restrictive for delete to authenticated
  using (public.is_portal_admin());

-- Prevent self-service profile writes from changing role or academic identity.
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
    or new.role is distinct from old.role
  then
    raise exception 'Only an administrator can change protected profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_portal_profile_changes on public.profiles;
create trigger guard_portal_profile_changes
  before insert or update on public.profiles
  for each row execute function public.guard_portal_profile_changes();

-- Course catalog: only enrolled students, assigned teachers, and admins read.
drop policy if exists courses_portal_select_scope on public.courses;
create policy courses_portal_select_scope on public.courses
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_has_course(id)
    or public.student_is_enrolled_in_course(auth.uid(), id)
  );
drop policy if exists courses_portal_insert_scope on public.courses;
create policy courses_portal_insert_scope on public.courses
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists courses_portal_update_scope on public.courses;
create policy courses_portal_update_scope on public.courses
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists courses_portal_delete_scope on public.courses;
create policy courses_portal_delete_scope on public.courses
  as restrictive for delete to authenticated using (public.is_portal_admin());

-- Assignments and timetable: visible only for courses the user is enrolled in
-- or teaches; all mutations remain administrator-only.
drop policy if exists assignments_portal_select_scope on public.assignments;
create policy assignments_portal_select_scope on public.assignments
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_has_course(course_id)
    or public.student_is_enrolled_in_course(auth.uid(), course_id)
  );
drop policy if exists assignments_portal_insert_scope on public.assignments;
create policy assignments_portal_insert_scope on public.assignments
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists assignments_portal_update_scope on public.assignments;
create policy assignments_portal_update_scope on public.assignments
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists assignments_portal_delete_scope on public.assignments;
create policy assignments_portal_delete_scope on public.assignments
  as restrictive for delete to authenticated using (public.is_portal_admin());

drop policy if exists timetable_portal_select_scope on public.timetable;
create policy timetable_portal_select_scope on public.timetable
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_has_course(course_id)
    or public.student_is_enrolled_in_course(auth.uid(), course_id)
  );
drop policy if exists timetable_portal_insert_scope on public.timetable;
create policy timetable_portal_insert_scope on public.timetable
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists timetable_portal_update_scope on public.timetable;
create policy timetable_portal_update_scope on public.timetable
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists timetable_portal_delete_scope on public.timetable;
create policy timetable_portal_delete_scope on public.timetable
  as restrictive for delete to authenticated using (public.is_portal_admin());

-- Enrollments: each student reads their own rows; teachers read their course
-- rosters; administrators manage all enrollment rows.
drop policy if exists enrollments_portal_select_scope on public.enrollments;
create policy enrollments_portal_select_scope on public.enrollments
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or student_id = auth.uid()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists enrollments_portal_insert_scope on public.enrollments;
create policy enrollments_portal_insert_scope on public.enrollments
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists enrollments_portal_update_scope on public.enrollments;
create policy enrollments_portal_update_scope on public.enrollments
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists enrollments_portal_delete_scope on public.enrollments;
create policy enrollments_portal_delete_scope on public.enrollments
  as restrictive for delete to authenticated using (public.is_portal_admin());

-- Teachers may read and submit attendance/results only for students enrolled
-- in one of their assigned subjects. Only admins can delete those records.
drop policy if exists attendance_portal_select_scope on public.attendance;
create policy attendance_portal_select_scope on public.attendance
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or student_id = auth.uid()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists attendance_portal_insert_scope on public.attendance;
create policy attendance_portal_insert_scope on public.attendance
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists attendance_portal_update_scope on public.attendance;
create policy attendance_portal_update_scope on public.attendance
  as restrictive for update to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  )
  with check (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists attendance_portal_delete_scope on public.attendance;
create policy attendance_portal_delete_scope on public.attendance
  as restrictive for delete to authenticated using (public.is_portal_admin());

drop policy if exists results_portal_select_scope on public.results;
create policy results_portal_select_scope on public.results
  as restrictive for select to authenticated
  using (
    public.is_portal_admin()
    or student_id = auth.uid()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists results_portal_insert_scope on public.results;
create policy results_portal_insert_scope on public.results
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists results_portal_update_scope on public.results;
create policy results_portal_update_scope on public.results
  as restrictive for update to authenticated
  using (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  )
  with check (
    public.is_portal_admin()
    or public.teacher_can_access_student(student_id, course_id)
  );
drop policy if exists results_portal_delete_scope on public.results;
create policy results_portal_delete_scope on public.results
  as restrictive for delete to authenticated using (public.is_portal_admin());

-- Fee information is private to the student and administrators.
drop policy if exists fees_portal_select_scope on public.fees;
create policy fees_portal_select_scope on public.fees
  as restrictive for select to authenticated
  using (public.is_portal_admin() or student_id = auth.uid());
drop policy if exists fees_portal_insert_scope on public.fees;
create policy fees_portal_insert_scope on public.fees
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists fees_portal_update_scope on public.fees;
create policy fees_portal_update_scope on public.fees
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists fees_portal_delete_scope on public.fees;
create policy fees_portal_delete_scope on public.fees
  as restrictive for delete to authenticated using (public.is_portal_admin());

-- Teacher-subject assignments are visible to the assigned teacher and admins;
-- only admins may create, change, or remove assignments.
drop policy if exists teacher_subjects_portal_select_scope on public.teacher_subjects;
create policy teacher_subjects_portal_select_scope on public.teacher_subjects
  as restrictive for select to authenticated
  using (public.is_portal_admin() or teacher_id = auth.uid());
drop policy if exists teacher_subjects_portal_insert_scope on public.teacher_subjects;
create policy teacher_subjects_portal_insert_scope on public.teacher_subjects
  as restrictive for insert to authenticated with check (public.is_portal_admin());
drop policy if exists teacher_subjects_portal_update_scope on public.teacher_subjects;
create policy teacher_subjects_portal_update_scope on public.teacher_subjects
  as restrictive for update to authenticated
  using (public.is_portal_admin()) with check (public.is_portal_admin());
drop policy if exists teacher_subjects_portal_delete_scope on public.teacher_subjects;
create policy teacher_subjects_portal_delete_scope on public.teacher_subjects
  as restrictive for delete to authenticated using (public.is_portal_admin());

commit;
