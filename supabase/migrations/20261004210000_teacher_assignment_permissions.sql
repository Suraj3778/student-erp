-- Allow teachers to manage assignment records only for their assigned courses.
-- Apply after 20261004160000_role_aware_portal_rls.sql.

begin;

drop policy if exists assignments_portal_insert_scope on public.assignments;
create policy assignments_portal_insert_scope on public.assignments
  as restrictive for insert to authenticated
  with check (
    public.is_portal_admin()
    or (public.is_portal_teacher() and public.teacher_has_course(course_id))
  );

drop policy if exists assignments_portal_update_scope on public.assignments;
create policy assignments_portal_update_scope on public.assignments
  as restrictive for update to authenticated
  using (
    public.is_portal_admin()
    or (public.is_portal_teacher() and public.teacher_has_course(course_id))
  )
  with check (
    public.is_portal_admin()
    or (public.is_portal_teacher() and public.teacher_has_course(course_id))
  );

drop policy if exists assignments_portal_delete_scope on public.assignments;
create policy assignments_portal_delete_scope on public.assignments
  as restrictive for delete to authenticated
  using (
    public.is_portal_admin()
    or (public.is_portal_teacher() and public.teacher_has_course(course_id))
  );

commit;
