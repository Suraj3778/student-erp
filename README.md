# StudentHub – Student Portal

A responsive React + Vite student dashboard UI with working client-side navigation.

## Included

- Dashboard overview
- My Courses
- Assignments with search
- Attendance
- Results / SGPA / CGPA
- Timetable
- Fees & Payments
- Student Profile
- Notifications and profile menus
- Responsive mobile sidebar
- Demo toast interactions

## Run locally

1. Open this folder in VS Code.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the localhost URL shown by Vite.

## Demo accounts and data

The built-in demo accounts work without a live database:

- Student: `demo@student.com` / `demo123`
- Administrator: `admin@student.com` / `admin123`
- Teacher: `teacher@student.com` / `teach123`

Demo role accounts have separate credentials. Demo changes are saved in the current browser only; they are not sent to Supabase and are not suitable for real student records.

## Teacher and administrator access

The administrator workspace can create teacher login accounts, assign them to one or more courses, review their account IDs and access status, and disable accounts while preserving attendance history. A new teacher receives a temporary password once and must set a personal password at first login. Existing passwords cannot be viewed or recovered. A teacher sees only assigned subjects and enrolled students; for those subjects they can load the whole roster, mark each student present or absent for a numbered theory/lab lecture, enter marks, and publish/edit/delete course assignments. Students see a subject-wise attendance summary plus each recorded lecture's date, number, theory/lab type, and their own status. Assignment changes are visible to students enrolled in that course. Teachers cannot open the administrator workspace, view student fee information, or manage students, enrollments, courses, schedules, or other teachers' subjects. Students see only information for their own account and enrolled courses, including their own attendance, results, timetable, assignments, and fees.

For a live deployment, create each administrator as a separate Supabase Auth user through a trusted server-side process or the Supabase dashboard. Teacher accounts can be created through the **Teachers & Subjects** admin screen after deploying the trusted `teacher-account-admin` Edge Function below. Set privileged roles only in protected `app_metadata` or `profiles.role` values that users cannot change. Never expose the Supabase service-role key to the browser.

## Live Supabase setup

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. The app reads student, course, enrollment, assignment, attendance, result, timetable, and fee data from the corresponding Supabase tables. Profile edits update the signed-in user's `profiles` row. Verified administrators can manage courses, enrollments, teacher-subject assignments, assignments, attendance, results, timetable, fees, and existing student profile fields; Supabase Row Level Security authorizes every live write.

Apply [`supabase/migrations/20261004160000_role_aware_portal_rls.sql`](./supabase/migrations/20261004160000_role_aware_portal_rls.sql) to the Supabase project only after the existing public tables are present. It enables RLS for the portal tables, removes anonymous table access, adds teacher/student/admin scope policies, and protects privileged profile roles. It does not create or alter the table schema. If using the Supabase SQL Editor, first verify its project selector points to the intended project. Alternatively, apply it through the Supabase CLI if this project has been initialized for CLI migrations. Review and test it against a staging database before production.

Grant administrator access only through a trusted server-side process. The UI recognizes the Supabase Auth `app_metadata.role = 'admin'` claim or an `admin` role read from the signed-in user's `profiles` row. Configure RLS to protect that profile role from user edits and enforce administrator-only writes at the database. Never grant administrator access from user-editable `user_metadata` or a client-side role selector.

For teachers, configure RLS on `teacher_subjects`, `courses`, `enrollments`, `profiles`, `attendance`, `results`, and `assignments` so a teacher can read only assigned courses and their enrolled roster, and can insert/update attendance and result rows only when the course is assigned to `auth.uid()` and the student is enrolled in it. Teachers can create, update, and delete assignments only for their assigned courses. Students can read assignments only for courses in which they are enrolled. Do not rely on the browser's subject filtering as authorization. Ensure administrators have the intended policies for all admin-managed tables. The UI reports database/RLS write failures rather than treating them as successful saves.

Apply [`supabase/migrations/20261004210000_teacher_assignment_permissions.sql`](./supabase/migrations/20261004210000_teacher_assignment_permissions.sql) after the role-aware RLS migration to grant that scoped assignment access. The administrator overview describes the role boundaries, and **Teachers & Subjects** shows the actual teacher-to-course assignments.

Apply [`supabase/migrations/20261004220000_teacher_class_attendance.sql`](./supabase/migrations/20261004220000_teacher_class_attendance.sql) after the role-aware RLS migration to create the lecture/session and per-student attendance tables. The unique key identifies one lecture by course, lecture number, theory/lab type, and date. Its RPC requires a complete roster and saves the lecture statuses together; RLS limits teachers to their assigned course and enrolled students. Then apply [`supabase/migrations/20261005000000_enforce_teacher_account_access.sql`](./supabase/migrations/20261005000000_enforce_teacher_account_access.sql) so RLS denies teacher-scoped database access until a new teacher changes their temporary password, and after an account is disabled. Run all applicable migrations in this order: role-aware RLS, teacher assignment permissions, lecture attendance, then teacher account access enforcement. These migrations do not remove or rewrite existing aggregate rows in `attendance`.

Apply [`supabase/migrations/20261006000000_student_academic_registration.sql`](./supabase/migrations/20261006000000_student_academic_registration.sql) after the role-aware RLS migration. It adds section, year level, academic year, and admission year to existing profiles and creates profile rows for public Auth signups with the database-enforced `student` role. Public signups must collect student academic details; roles in user-editable metadata are ignored. This migration preserves existing profile rows and data.

After both the teacher class attendance and student academic registration migrations, apply [`supabase/migrations/20261007000000_cohort_daily_attendance.sql`](./supabase/migrations/20261007000000_cohort_daily_attendance.sql). It scopes teacher-recorded daily attendance sessions to section, semester, year level, and academic year, and updates the attendance RPC to verify the complete enrolled roster for that cohort. Existing attendance sessions are preserved and receive the migration defaults (unassigned section/year and semester/year level `0`); this migration does not rewrite or delete attendance records. The Teacher workspace requires selecting a cohort before displaying or saving its attendance and marks. Validate the migration in staging before production and apply it before deploying the frontend changes.

Provision live role accounts through Supabase Auth or a trusted server-side Auth Admin API. Ensure each account has a corresponding `profiles` row whose `id` is the Auth user UUID. For administrators, set the trusted Auth `app_metadata.role` or the protected `profiles.role` to `admin`. Never set a privileged role through user-editable `user_metadata`. The migration allows a signed-in administrator or a server request authenticated with the service-role JWT to update protected profile roles. A teacher's `teacher_id`/login ID displayed by the app is their teacher profile ID; the Auth email is the login and the Auth UUID is the account ID.

### Teacher account provisioning

Deploy the trusted function from the project root:

```bash
npx supabase login
npx supabase link --project-ref ttlghwdamcncxeuqwyjj
npx supabase functions deploy teacher-account-admin --no-verify-jwt --project-ref ttlghwdamcncxeuqwyjj
```

Run these commands from the project root. The configured `VITE_SUPABASE_URL` identifies project `ttlghwdamcncxeuqwyjj`; confirm that is the intended project before deploying. Install the Supabase CLI first if `npx` cannot find it. Gateway JWT verification is disabled for this function so the gateway can pass browser preflight requests; the function itself still requires an Authorization header, validates the caller through Supabase Auth, and requires `profiles.role = 'admin'` before listing, creating, or disabling teachers. Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions; the service-role key must remain server-side and must never be added to a `VITE_` variable or frontend file. Account creation writes a teacher Auth user, upserts its matching `profiles` row, and writes the selected `teacher_subjects` links; the temporary password is not persisted in `profiles`. Teachers must set a new password before entering the portal. Disabling a teacher bans their Auth account and removes subject links but keeps the teacher profile and historical records. Existing passwords are intentionally not available to administrators.

Verify with separate student, teacher, and administrator accounts: students should see only their own profile, enrolled courses, attendance, results, and fees; teachers should see only assigned course rosters and should be able to insert/update attendance and marks only for those students; administrators should manage portal records and teacher assignments. Also verify that an anonymous request is denied and that a student cannot change `profiles.role`, course, semester, or student ID. The migration's teacher assignment checks assume `profiles.id`, `teacher_subjects.teacher_id`, `enrollments.student_id`, and course foreign keys use UUIDs matching Supabase Auth IDs.

Creating any new Auth account requires a trusted Supabase Edge Function or other server-side Auth Admin API. Student and administrator accounts continue to require that trusted provisioning process; teacher account creation and disabling are available through the admin screen when the Edge Function is deployed.
