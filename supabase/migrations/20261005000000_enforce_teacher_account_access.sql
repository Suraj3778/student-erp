-- Require teacher accounts to finish their temporary-password change and
-- remain enabled before teacher-scoped RLS policies grant access.

begin;

create or replace function public.is_portal_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(
      auth.jwt() -> 'app_metadata' ->> 'force_password_change' <> 'true',
      true
    )
    and coalesce(
      auth.jwt() -> 'app_metadata' ->> 'teacher_access_enabled' <> 'false',
      true
    )
    and (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'teacher', false)
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'teacher'
      )
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
  select public.is_portal_teacher()
    and exists (
      select 1
      from public.teacher_subjects ts
      where ts.teacher_id = auth.uid()
        and ts.course_id = p_course_id
    );
$$;

drop policy if exists teacher_subjects_portal_select_scope on public.teacher_subjects;
create policy teacher_subjects_portal_select_scope on public.teacher_subjects
  as restrictive for select to authenticated
  using (public.is_portal_admin() or (teacher_id = auth.uid() and public.is_portal_teacher()));

commit;
