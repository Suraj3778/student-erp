import { useMemo, useState } from 'react'
import './AdminDashboard.css'

const sections = {
  dashboard: {
    title: 'Administration overview',
    description: 'Monitor and manage the student portal data.',
    collection: null,
  },
  students: {
    title: 'Students',
    description: 'Manage student directory records.',
    collection: 'students',
    columns: ['full_name', 'student_id', 'email', 'course', 'section', 'semester', 'year_level', 'academic_year', 'admission_year'],
    fields: [
      { key: 'full_name', label: 'Full name', required: true },
      { key: 'student_id', label: 'Student ID', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'course', label: 'Course', required: true },
      { key: 'section', label: 'Section', required: true },
      { key: 'semester', label: 'Semester', type: 'number', required: true },
      { key: 'year_level', label: 'Year level', type: 'number', required: true },
      { key: 'academic_year', label: 'Academic year', required: true },
      { key: 'admission_year', label: 'Admission year', type: 'number', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'] },
    ],
  },
  teacher_subjects: {
    title: 'Teachers & Subjects',
    description: 'Link registered teacher accounts to the course subjects they manage.',
    collection: 'teacherSubjects',
    columns: ['teacher', 'course'],
    fields: [
      { key: 'teacher_id', label: 'Teacher account / login ID', type: 'teacher', required: true },
      { key: 'course_id', label: 'Subject code / course', type: 'course', required: true },
    ],
  },
  courses: {
    title: 'Courses',
    description: 'Create and update course catalog entries.',
    collection: 'courses',
    columns: ['code', 'name', 'teacher', 'credits', 'progress'],
    fields: [
      { key: 'code', label: 'Course code', required: true },
      { key: 'name', label: 'Course name', required: true },
      { key: 'teacher', label: 'Faculty' },
      { key: 'credits', label: 'Credits', type: 'number' },
      { key: 'progress', label: 'Progress (%)', type: 'number' },
    ],
  },
  enrollments: {
    title: 'Enrollments',
    description: 'Assign students to courses and review current enrollments.',
    collection: 'enrollments',
    columns: ['student', 'course'],
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'course_id', label: 'Course', type: 'course', required: true },
    ],
  },
  assignments: {
    title: 'Assignments',
    description: 'Manage assignment descriptions, courses, and due dates.',
    collection: 'assignments',
    columns: ['title', 'course', 'due_date', 'priority'],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'course_id', label: 'Course', type: 'course' },
      { key: 'due_date', label: 'Due date', type: 'date' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
    ],
  },
  attendance: {
    title: 'Attendance',
    description: 'Update attendance totals for each course.',
    collection: 'attendance',
    columns: ['student', 'course', 'attended', 'total', 'percentage'],
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'course_id', label: 'Course', type: 'course', required: true },
      { key: 'attended', label: 'Classes attended', type: 'number', required: true },
      { key: 'total', label: 'Total classes', type: 'number', required: true },
    ],
  },
  results: {
    title: 'Results',
    description: 'Maintain marks and grades by course and semester.',
    collection: 'results',
    columns: ['student', 'course', 'marks', 'max_marks', 'grade', 'semester'],
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'course_id', label: 'Course', type: 'course', required: true },
      { key: 'marks', label: 'Marks', type: 'number', required: true },
      { key: 'max_marks', label: 'Maximum marks', type: 'number', required: true },
      { key: 'grade', label: 'Grade', required: true },
      { key: 'semester', label: 'Semester', type: 'number', required: true },
    ],
  },
  timetable: {
    title: 'Timetable',
    description: 'Create and update weekly class schedules.',
    collection: 'timetable',
    columns: ['day', 'course', 'start_time', 'end_time', 'room'],
    fields: [
      { key: 'day', label: 'Day', type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
      { key: 'course_id', label: 'Course', type: 'course' },
      { key: 'start_time', label: 'Start time', type: 'time', required: true },
      { key: 'end_time', label: 'End time', type: 'time', required: true },
      { key: 'room', label: 'Room' },
      { key: 'teacher', label: 'Faculty' },
    ],
  },
  fees: {
    title: 'Fees',
    description: 'Track fee totals, payments, and due dates.',
    collection: 'fees',
    columns: ['student_name', 'semester', 'total', 'paid', 'due_date'],
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'semester', label: 'Semester', type: 'number', required: true },
      { key: 'total', label: 'Total fees (₹)', type: 'number', required: true },
      { key: 'paid', label: 'Paid amount (₹)', type: 'number', required: true },
      { key: 'due_date', label: 'Due date', type: 'date' },
    ],
  },
}

const menu = [
  ['dashboard', 'Overview', '▦'],
  ['students', 'Students', '♙'],
  ['courses', 'Courses', '▤'],
  ['enrollments', 'Enrollments', '↔'],
  ['teacher_subjects', 'Teachers & Subjects', '♧'],
  ['assignments', 'Assignments', '☷'],
  ['attendance', 'Attendance', '%'],
  ['results', 'Results', '✓'],
  ['timetable', 'Timetable', '◷'],
  ['fees', 'Fees', '₹'],
]

function currentTimestamp() {
  return new Date().toISOString()
}

function newRecordId() {
  return crypto.randomUUID()
}

function asInputValue(value) {
  return value == null ? '' : String(value)
}

function singularTitle(title) {
  const irregular = { students: 'Student', courses: 'Course', assignments: 'Assignment', attendance: 'Attendance', results: 'Result', timetable: 'Timetable', fees: 'Fee', 'teachers & subjects': 'Teacher subject' }
  return irregular[title.toLowerCase()] || title
}

function attendancePercentage(record) {
  const total = Number(record.total)
  const attended = Number(record.attended)
  return Number.isFinite(total) && total > 0 && Number.isFinite(attended)
    ? Math.round((attended / total) * 100)
    : 0
}

function recordCell(record, column, courses, students, teachers) {
  if (column === 'course') {
    const course = courses.find((item) => item.id === (record.courses?.id || record.course_id))
    if (record.courses?.code || course?.code) return `${record.courses?.code || course.code} · ${record.courses?.name || course?.name || ''}`
    return record.courses?.name || course?.name || record.course || '—'
  }
  if (column === 'student') {
    return record.student_name || students.find((item) => item.id === record.student_id)?.full_name || 'All students'
  }
  if (column === 'teacher') {
    const teacher = teachers.find((item) => item.id === record.teacher_id)
    return teacher ? `${teacher.teacher_id || teacher.email || teacher.id} · ${teacher.full_name}` : record.teacher_id || '—'
  }
  if (column === 'student_name') return record.student_name || '—'
  if (column === 'percentage') {
    return `${attendancePercentage(record)}%`
  }
  if (column === 'total' || column === 'paid' || column === 'marks' || column === 'max_marks') {
    return record[column] ?? '—'
  }
  return record[column] ?? '—'
}

export default function AdminDashboard({
  section = 'dashboard',
  setActive,
  students = [],
  courses = [],
  assignments = [],
  attendance = [],
  results = [],
  timetable = [],
  fees = [],
  onStudentsChange,
  onCoursesChange,
  onAssignmentsChange,
  onAttendanceChange,
  onResultsChange,
  onTimetableChange,
  onFeesChange,
  enrollments = [],
  onEnrollmentsChange,
  teachers = [],
  teacherSubjects = [],
  onTeacherSubjectsChange,
  onCreateTeacher,
  onDisableTeacher,
  isDemoAccount = false,
  isLiveAdmin = false,
}) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teacherError, setTeacherError] = useState('')
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    teacherId: '',
    email: '',
    temporaryPassword: '',
    courseIds: [],
  })
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [teacherAction, setTeacherAction] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilters, setStudentFilters] = useState({
    course: '',
    section: '',
    semester: '',
    year_level: '',
    academic_year: '',
  })
  const [studentPage, setStudentPage] = useState(1)
  const canEdit = isDemoAccount || isLiveAdmin
  const config = sections[section] || sections.dashboard
  const teacherAccounts = Array.isArray(teachers)
    ? teachers.filter((teacher) => teacher && typeof teacher.id === 'string')
    : []
  const teacherAssignments = Array.isArray(teacherSubjects)
    ? teacherSubjects.filter((assignment) => assignment && typeof assignment.teacher_id === 'string')
    : []
  const studentRecords = Array.isArray(students) ? students : []
  const filteredStudentRecords = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    return (Array.isArray(students) ? students : []).filter((student) =>
      student &&
      (!query || [student.full_name, student.student_id, student.email]
        .some((value) => String(value || '').toLowerCase().includes(query))) &&
      Object.entries(studentFilters).every(([key, value]) =>
        !value || String(student[key] ?? '') === value,
      ),
    )
  }, [students, studentSearch, studentFilters])
  const studentPageSize = 25
  const studentPageCount = Math.max(1, Math.ceil(filteredStudentRecords.length / studentPageSize))
  const currentStudentPage = Math.min(studentPage, studentPageCount)
  const visibleStudentRecords = section === 'students'
    ? filteredStudentRecords.slice((currentStudentPage - 1) * studentPageSize, currentStudentPage * studentPageSize)
    : null

  const data = {
    students,
    courses,
    assignments,
    attendance,
    results,
    timetable,
    fees,
    enrollments,
    teacherSubjects,
  }

  const update = {
    students: onStudentsChange,
    courses: onCoursesChange,
    assignments: onAssignmentsChange,
    attendance: onAttendanceChange,
    results: onResultsChange,
    timetable: onTimetableChange,
    fees: onFeesChange,
    enrollments: onEnrollmentsChange,
    teacherSubjects: onTeacherSubjectsChange,
  }

  const outstandingFees = useMemo(
    () => fees.reduce((sum, item) => sum + Math.max(0, Number(item.total || 0) - Number(item.paid || 0)), 0),
    [fees],
  )

  function startCreate() {
    setEditingId(null)
    setForm({})
    setError('')
    setEditorOpen(true)
  }

  function changeTeacherCourses(event) {
    const courseId = event.target.value
    setTeacherForm((previous) => ({
      ...previous,
      courseIds: event.target.checked
        ? [...new Set([...previous.courseIds, courseId])]
        : previous.courseIds.filter((id) => id !== courseId),
    }))
  }

  async function createTeacher(event) {
    event.preventDefault()
    if (!isLiveAdmin || !onCreateTeacher) return
    setTeacherError('')
    setCreatedCredentials(null)

    if (!teacherForm.fullName.trim() || !teacherForm.email.trim() || !teacherForm.teacherId.trim()) {
      setTeacherError('Enter the teacher’s full name, email, and teacher ID.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherForm.email.trim())) {
      setTeacherError('Enter a valid teacher email address.')
      return
    }
    if (teacherForm.temporaryPassword.length < 12) {
      setTeacherError('Temporary password must contain at least 12 characters.')
      return
    }
    if (!teacherForm.courseIds.length) {
      setTeacherError('Assign at least one subject to this teacher.')
      return
    }

    setTeacherAction('create')
    try {
      const teacher = await onCreateTeacher(teacherForm)
      setCreatedCredentials({
        teacher,
        temporaryPassword: teacherForm.temporaryPassword,
      })
      setTeacherForm({
        fullName: '',
        teacherId: '',
        email: '',
        temporaryPassword: '',
        courseIds: [],
      })
    } catch (createError) {
      console.error('Could not create teacher account:', createError)
      setTeacherError(createError.message || 'Could not create teacher account.')
    } finally {
      setTeacherAction('')
    }
  }

  async function disableTeacher(teacher) {
    if (!onDisableTeacher || !teacher.accessEnabled) return
    const confirmed = window.confirm(
      `Disable ${teacher.full_name || teacher.email}'s account and remove all subject access? Attendance history will be preserved.`,
    )
    if (!confirmed) return
    setTeacherError('')
    setTeacherAction(teacher.id)
    try {
      await onDisableTeacher(teacher.id)
    } catch (disableError) {
      console.error('Could not disable teacher account:', disableError)
      setTeacherError(disableError.message || 'Could not disable teacher account.')
    } finally {
      setTeacherAction('')
    }
  }

  function startEdit(record) {
    const initial = {}
    config.fields.forEach((field) => {
      if (field.key === 'course_id') initial[field.key] = record.courses?.id || record.course_id || ''
      else initial[field.key] = asInputValue(record[field.key])
    })
    setEditingId(record.id)
    setForm(initial)
    setError('')
    setEditorOpen(true)
  }

  async function saveRecord(event) {
    event.preventDefault()
    if (!canEdit || !config.collection) return

    const collection = config.collection
    const records = data[collection] || []
    const record = { ...form }

    config.fields.forEach((field) => {
      const raw = form[field.key] ?? ''
      if (field.type === 'number') record[field.key] = raw === '' ? 0 : Number(raw)
      else if (field.key !== 'course_id' && field.key !== 'student_id') record[field.key] = raw
    })

    if (form.course_id) {
      const course = courses.find((item) => item.id === form.course_id)
      record.courses = course
        ? { id: course.id, code: course.code, name: course.name }
        : null
    } else if ('course_id' in record) {
      record.courses = null
    }
    delete record.course_id
    if (collection === 'enrollments') record.course_id = form.course_id
    if (collection === 'teacherSubjects') {
      record.teacher_id = form.teacher_id
      record.course_id = form.course_id
      const duplicate = records.some((item) =>
        item.id !== editingId &&
        item.teacher_id === record.teacher_id &&
        item.course_id === record.course_id,
      )
      if (duplicate) {
        setError('This teacher is already assigned to that subject.')
        return
      }
    }

    if (['attendance', 'results', 'enrollments'].includes(collection)) {
      record.student_id = form.student_id
      record.student_name = students.find((item) => item.id === form.student_id)?.full_name || ''
    }

    if (collection === 'attendance') {
      const total = Math.max(0, Number(record.total || 0))
      const attended = Math.min(total, Math.max(0, Number(record.attended || 0)))
      record.total = total
      record.attended = attended
      record.percentage = total ? Math.round((attended / total) * 100) : 0
    }

    if (collection === 'results') {
      record.created_at = editingId
        ? records.find((item) => item.id === editingId)?.created_at || currentTimestamp()
        : currentTimestamp()
    }

    if (collection === 'fees') {
      const student = students.find((item) => item.id === form.student_id)
      record.student_id = form.student_id
      record.student_name = student?.full_name || 'Unknown student'
      record.total = Math.max(0, Number(record.total || 0))
      record.paid = Math.min(record.total, Math.max(0, Number(record.paid || 0)))
    }

    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await update[collection]?.(records.map((item) => item.id === editingId ? { ...item, ...record } : item))
      } else {
        await update[collection]?.([{ id: newRecordId(), ...record }, ...records])
      }
      setEditingId(null)
      setForm({})
      setEditorOpen(false)
    } catch (saveError) {
      console.error(`Could not save ${collection} record:`, saveError)
      setError(saveError.message || 'Could not save this record.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRecord(id) {
    if (!canEdit || !config.collection) return
    const records = data[config.collection] || []
    setError('')
    try {
      await update[config.collection]?.(records.filter((item) => item.id !== id))
      if (isDemoAccount && config.collection === 'students') {
        const remainingFees = fees.filter((item) => item.student_id !== id)
        await update.fees?.(remainingFees)
        await update.enrollments?.(enrollments.filter((item) => item.student_id !== id))
      }
      if (isDemoAccount && config.collection === 'courses') {
        const removeCourseRelation = (items) => items.filter((item) => item.courses?.id !== id)
        await update.enrollments?.(enrollments.filter((item) => item.course_id !== id))
        await update.assignments?.(removeCourseRelation(assignments))
        await update.attendance?.(removeCourseRelation(attendance))
        await update.results?.(removeCourseRelation(results))
        await update.timetable?.(removeCourseRelation(timetable))
      }
    } catch (removeError) {
      console.error(`Could not delete ${config.collection} record:`, removeError)
      setError(removeError.message || 'Could not delete this record.')
    }
  }

  if (section === 'dashboard' || !config.collection) {
    const cards = [
      ['Students', students.length, 'students'],
      ['Teacher accounts', teacherAccounts.length, 'teacher_subjects'],
      ['Courses', courses.length, 'courses'],
      ['Enrollments', enrollments.length, 'enrollments'],
      ['Teachers & Subjects', teacherSubjects.length, 'teacher_subjects'],
      ['Assignments', assignments.length, 'assignments'],
      ['Average attendance', `${attendance.length ? Math.round(attendance.reduce((n, item) => n + attendancePercentage(item), 0) / attendance.length) : 0}%`, 'attendance'],
      ['Published results', results.length, 'results'],
      ['Outstanding fees', `₹${outstandingFees.toLocaleString('en-IN')}`, 'fees'],
    ]

    return (
      <section className="admin-page">
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">STUDENT PORTAL · ADMIN</p>
            <h1>Administration overview</h1>
            <p>Manage students and academic data from one workspace.</p>
          </div>
          <span className={`admin-mode-badge ${isDemoAccount ? 'demo' : ''}`}>
            {isDemoAccount ? 'Demo data · saved in this browser' : 'Verified administrator · Supabase'}
          </span>
        </header>
        <section className="admin-access-summary" aria-label="Role access summary">
          <div><strong>Students</strong><span>See their own enrolled courses, attendance, results, schedule, assignments, fees, and profile.</span></div>
          <div><strong>Teachers</strong><span>See assigned subject rosters; manage attendance, marks, and assignments only for those subjects.</span></div>
          <div><strong>Administrators</strong><span>Manage portal data, create teacher accounts, assign subject access, and disable accounts while preserving their history.</span></div>
        </section>
        {!canEdit && (
          <div className="admin-notice">
            Administrative actions are disabled for this account.
          </div>
        )}
        <div className="admin-stat-grid">
          {cards.map(([label, value, target]) => (
            <button className="admin-stat-card" key={label} type="button" onClick={() => setActive?.(target)}>
              <span>{label}</span><strong>{value}</strong><small>Open management →</small>
            </button>
          ))}
        </div>
        <div className="admin-shortcuts">
          {menu.slice(1).map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => setActive?.(id)}>
              <span>{icon}</span><strong>{label}</strong><small>View and manage {label.toLowerCase()}</small>
            </button>
          ))}
        </div>
      </section>
    )
  }

  const records = config.collection === 'students'
    ? studentRecords
    : data[config.collection] || []
  const visibleRecords = visibleStudentRecords || records

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION / {config.title.toUpperCase()}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <span className={`admin-mode-badge ${isDemoAccount ? 'demo' : ''}`}>
          {isDemoAccount ? 'Local demo data' : 'Supabase · live'}
        </span>
      </header>
      {!canEdit && (
        <div className="admin-notice">
          Administrative actions are disabled for this account.
        </div>
      )}
      {section === 'teacher_subjects' && (
        <section className="admin-panel teacher-account-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Teacher accounts & access</h2>
              <p>Create login accounts, assign subjects, and review access status.</p>
            </div>
            <span className="admin-mode-badge">Existing passwords cannot be viewed</span>
          </div>

          {teacherError && <div className="admin-notice admin-error" role="alert">{teacherError}</div>}

          {createdCredentials?.teacher && typeof createdCredentials.teacher === 'object' && (
            <div className="teacher-created-credentials" role="status">
              <div>
                <strong>Teacher account created</strong>
                <p>Share this temporary password securely. It will not be shown again, and the teacher must change it at first login.</p>
              </div>
              <dl>
                <div><dt>Teacher ID</dt><dd>{createdCredentials.teacher.teacher_id || 'Not returned'}</dd></div>
                <div><dt>Login email</dt><dd>{createdCredentials.teacher.email}</dd></div>
                <div><dt>Account UUID</dt><dd>{createdCredentials.teacher.id}</dd></div>
                <div><dt>Temporary password</dt><dd>{createdCredentials.temporaryPassword}</dd></div>
              </dl>
              <button type="button" className="admin-quiet-btn" onClick={() => setCreatedCredentials(null)}>
                Hide temporary credentials
              </button>
            </div>
          )}

          {isLiveAdmin ? (
            <form className="admin-editor teacher-account-editor" onSubmit={createTeacher}>
              <div className="admin-editor-heading">
                <h3>Register a teacher</h3>
                <span>Required first-login password change</span>
              </div>
              <div className="admin-form-grid">
                <label htmlFor="new-teacher-name">
                  <span>Teacher full name</span>
                  <input id="new-teacher-name" autoComplete="name" required value={teacherForm.fullName} onChange={(event) => setTeacherForm((previous) => ({ ...previous, fullName: event.target.value }))} />
                </label>
                <label htmlFor="new-teacher-id">
                  <span>Teacher ID</span>
                  <input id="new-teacher-id" required value={teacherForm.teacherId} onChange={(event) => setTeacherForm((previous) => ({ ...previous, teacherId: event.target.value }))} />
                </label>
                <label htmlFor="new-teacher-email">
                  <span>Login email</span>
                  <input id="new-teacher-email" type="email" autoComplete="email" required value={teacherForm.email} onChange={(event) => setTeacherForm((previous) => ({ ...previous, email: event.target.value }))} />
                </label>
                <label htmlFor="new-teacher-temp-password">
                  <span>Temporary password (12+ characters)</span>
                  <input id="new-teacher-temp-password" type="password" autoComplete="new-password" minLength={12} required value={teacherForm.temporaryPassword} onChange={(event) => setTeacherForm((previous) => ({ ...previous, temporaryPassword: event.target.value }))} />
                </label>
                <fieldset className="teacher-course-access">
                  <legend>Assign subject access</legend>
                  <div>
                    {courses.map((course) => (
                      <label key={course.id}>
                        <input
                          type="checkbox"
                          value={course.id}
                          checked={teacherForm.courseIds.includes(course.id)}
                          onChange={changeTeacherCourses}
                        />
                        <span>{course.code} · {course.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <button className="admin-primary-btn" type="submit" disabled={Boolean(teacherAction)}>
                {teacherAction === 'create' ? 'Creating account…' : 'Create teacher account'}
              </button>
            </form>
          ) : (
            <div className="admin-notice">
              Live administrator access and the deployed teacher-account Edge Function are required to create real login accounts.
            </div>
          )}

          {isLiveAdmin && (
            <div className="teacher-account-list">
              {teacherAccounts.length ? teacherAccounts.map((teacher) => {
                const assignedSubjects = teacherAssignments
                  .filter((assignment) => assignment.teacher_id === teacher.id)
                  .map((assignment) => courses.find((course) => course.id === assignment.course_id))
                  .filter(Boolean)
                return (
                  <article className="teacher-account-card" key={teacher.id}>
                    <div className="teacher-account-heading">
                      <div className="teacher-account-avatar" aria-hidden="true">
                        {(teacher.full_name || teacher.email || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>{teacher.full_name || 'Teacher'}</h3>
                        <p>{teacher.teacher_id || 'No teacher ID'} · {teacher.email}</p>
                      </div>
                      <span className={`teacher-access-badge ${teacher.accessEnabled === true ? 'enabled' : teacher.accessEnabled === false ? 'disabled' : ''}`}>
                        {teacher.accessEnabled === true ? 'Access active' : teacher.accessEnabled === false ? 'Disabled' : 'Status unavailable'}
                      </span>
                    </div>
                    <p className="teacher-account-uuid"><strong>Account ID</strong> {teacher.id}</p>
                    <div className="teacher-account-subjects">
                      <strong>Subject access</strong>
                      {assignedSubjects.length
                        ? assignedSubjects.map((course) => <span key={course.id}>{course.code} · {course.name}</span>)
                        : <span>No subjects assigned</span>}
                    </div>
                    {teacher.accessEnabled && (
                      <button
                        type="button"
                        className="admin-danger-btn"
                        disabled={Boolean(teacherAction)}
                        onClick={() => disableTeacher(teacher)}
                      >
                        {teacherAction === teacher.id ? 'Disabling…' : 'Disable account & remove access'}
                      </button>
                    )}
                  </article>
                )
              }) : <div className="admin-empty">No teacher accounts found.</div>}
            </div>
          )}
        </section>
      )}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div><h2>{config.title} records</h2><p>{section === 'students' ? `${filteredStudentRecords.length} of ${records.length} students` : `${records.length} records`}</p></div>
          {canEdit && (config.collection !== 'students' || isDemoAccount) && (
            <button className="admin-primary-btn" type="button" onClick={startCreate}>
              + Add {singularTitle(config.title)}
            </button>
          )}
        </div>
        {section === 'students' && (
          <div className="admin-student-filters" aria-label="Student search and filters">
            <label>
              <span>Search name, student ID, or email</span>
              <input value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudentPage(1) }} />
            </label>
            {[
              ['course', 'Course / program'],
              ['section', 'Section'],
              ['semester', 'Semester'],
              ['year_level', 'Year level'],
              ['academic_year', 'Academic year'],
            ].map(([key, label]) => {
              const options = [...new Set(studentRecords.map((student) => student[key]).filter((value) => value != null && value !== ''))]
                .sort((left, right) => String(left).localeCompare(String(right), undefined, { numeric: true }))
              return (
                <label key={key}>
                  <span>{label}</span>
                  <select value={studentFilters[key]} onChange={(event) => {
                    setStudentFilters((previous) => ({ ...previous, [key]: event.target.value }))
                    setStudentPage(1)
                  }}>
                    <option value="">All</option>
                    {options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              )
            })}
          </div>
        )}
        {error && <div className="admin-notice admin-error" role="alert">{error}</div>}
        {editorOpen && canEdit ? (
          <form className="admin-editor" onSubmit={saveRecord}>
            <div className="admin-editor-heading">
              <h3>{editingId ? 'Edit record' : `Add ${singularTitle(config.title)}`}</h3>
              <button type="button" className="admin-quiet-btn" onClick={() => { setEditorOpen(false); setEditingId(null); setForm({}) }}>Cancel</button>
            </div>
            <div className="admin-form-grid">
              {config.fields.filter((field) => isDemoAccount || !['status', 'email'].includes(field.key)).map((field) => {
                const inputProps = {
                  id: `admin-${field.key}`,
                  required: Boolean(field.required),
                  value: form[field.key] ?? '',
                  onChange: (event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value })),
                }
                return (
                  <label className={field.type === 'textarea' ? 'wide' : ''} key={field.key} htmlFor={inputProps.id}>
                    <span>{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea {...inputProps} rows="3" />
                    ) : field.type === 'select' ? (
                      <select {...inputProps}>
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : field.type === 'course' ? (
                      <select {...inputProps}>
                        <option value="">Select course</option>
                        {courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
                      </select>
                    ) : field.type === 'student' ? (
                      <select {...inputProps}>
                        <option value="">Select student</option>
                        {students.map((student) => <option key={student.id} value={student.id}>{student.student_id} · {student.full_name}</option>)}
                      </select>
                    ) : field.type === 'teacher' ? (
                      <select {...inputProps}>
                        <option value="">Select teacher</option>
                        {teacherAccounts.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.teacher_id || teacher.email || teacher.id} · {teacher.full_name}</option>)}
                      </select>
                    ) : (
                      <input {...inputProps} type={field.type || 'text'} min={field.type === 'number' ? '0' : undefined} />
                    )}
                  </label>
                )
              })}
            </div>
            <button className="admin-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create record'}</button>
          </form>
        ) : null}
        {records.length === 0 ? (
          <div className="admin-empty">No records yet. Add a record to get started.</div>
        ) : visibleRecords.length === 0 ? (
          <div className="admin-empty">No students match these search filters.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>{config.columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}{canEdit && <th>Actions</th>}</tr></thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id}>
                    {config.columns.map((column) => <td key={column}>{recordCell(record, column, courses, students, teacherAccounts)}</td>)}
                    {canEdit && (
                      <td className="admin-actions">
                        <button type="button" onClick={() => startEdit(record)}>Edit</button>
                        {(config.collection !== 'students' || isDemoAccount) && <button type="button" className="danger" onClick={() => removeRecord(record.id)}>Delete</button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {section === 'students' && filteredStudentRecords.length > studentPageSize && (
          <div className="admin-pagination" aria-label="Student pages">
            <button type="button" disabled={studentPage <= 1} onClick={() => setStudentPage((page) => Math.max(1, page - 1))}>Previous</button>
            <span>Page {currentStudentPage} of {studentPageCount}</span>
            <button type="button" disabled={studentPage >= studentPageCount} onClick={() => setStudentPage((page) => Math.min(studentPageCount, page + 1))}>Next</button>
          </div>
        )}
      </section>
      <p className="admin-data-disclaimer">
        {isDemoAccount
          ? 'Demo mode: changes persist in this browser only; they are not sent to the university database.'
          : config.collection === 'students'
            ? 'Student profiles are read and updated through Supabase. Creating or deleting Auth users requires a trusted server-side Supabase Auth function.'
            : 'Changes are sent to Supabase and are accepted only when the configured administrator Row Level Security policies allow them.'}
      </p>
    </section>
  )
}
