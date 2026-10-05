const DEMO_STORAGE_KEY = 'studenthub-demo-auth'
const DEMO_DATA_KEY = 'studenthub-demo-data'

export const demoAccounts = {
  user: {
    email: 'demo@student.com',
    password: 'demo123',
    full_name: 'Aarav Sharma',
    role: 'user',
    id: 'demo-user-1',
    student_id: 'STU-2024-1018',
    course: 'BCA',
    semester: 6,
    phone: '+91 98765 43210',
    address: 'New Delhi, India',
    profile_image: '',
    department: 'Computer Applications',
    university: 'United University Prayagraj',
  },
  admin: {
    email: 'admin@student.com',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'admin',
    id: 'demo-admin-1',
    phone: '+91 98765 43211',
    address: 'United University Campus',
    profile_image: '',
    department: 'Administration',
    university: 'United University Prayagraj',
  },
  teacher: {
    email: 'teacher@student.com',
    password: 'teach123',
    full_name: 'Meera Singh',
    role: 'teacher',
    id: 'demo-teacher-1',
    teacher_id: 'TCH-2024-011',
    phone: '+91 98765 43214',
    address: 'United University Campus',
    profile_image: '',
    department: 'Computer Applications',
    university: 'United University Prayagraj',
  },
}

export const demoProfile = demoAccounts.user

export const demoCourses = [
  {
    id: 'course-1',
    code: 'CS101',
    name: 'Data Structures',
    teacher: 'Prof. Meera Singh',
    credits: 4,
    progress: 82,
  },
  {
    id: 'course-2',
    code: 'CS204',
    name: 'Database Systems',
    teacher: 'Dr. Rahul Nair',
    credits: 3,
    progress: 76,
  },
  {
    id: 'course-3',
    code: 'MATH110',
    name: 'Discrete Mathematics',
    teacher: 'Prof. Ananya Joshi',
    credits: 4,
    progress: 68,
  },
  {
    id: 'course-4',
    code: 'WEB210',
    name: 'Web Development',
    teacher: 'Dr. Vikram Khanna',
    credits: 3,
    progress: 90,
  },
]

export const demoAssignments = [
  {
    id: 'assignment-1',
    title: 'DSA Lab Report',
    description: 'Prepare the weekly graph traversal tasks and summarize complexity.',
    due_date: '2026-10-12',
    priority: 'High',
    courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' },
  },
  {
    id: 'assignment-2',
    title: 'ER Diagram Submission',
    description: 'Design and submit a normalized schema with tables and relationships.',
    due_date: '2026-10-18',
    priority: 'Medium',
    courses: { id: 'course-2', code: 'CS204', name: 'Database Systems' },
  },
  {
    id: 'assignment-3',
    title: 'Frontend Mockup',
    description: 'Build a responsive landing page prototype for the course project.',
    due_date: '2026-10-24',
    priority: 'Low',
    courses: { id: 'course-4', code: 'WEB210', name: 'Web Development' },
  },
]

export const demoAttendance = [
  {
    id: 'attendance-1',
    attended: 24,
    total: 28,
    percentage: 86,
    courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' },
  },
  {
    id: 'attendance-2',
    attended: 19,
    total: 24,
    percentage: 79,
    courses: { id: 'course-2', code: 'CS204', name: 'Database Systems' },
  },
  {
    id: 'attendance-3',
    attended: 20,
    total: 22,
    percentage: 91,
    courses: { id: 'course-3', code: 'MATH110', name: 'Discrete Mathematics' },
  },
]

export const demoResults = [
  {
    id: 'result-1',
    marks: 84,
    max_marks: 100,
    grade: 'A',
    semester: 5,
    created_at: '2026-03-14T00:00:00.000Z',
    courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' },
  },
  {
    id: 'result-2',
    marks: 89,
    max_marks: 100,
    grade: 'A',
    semester: 5,
    created_at: '2026-03-14T00:00:00.000Z',
    courses: { id: 'course-2', code: 'CS204', name: 'Database Systems' },
  },
  {
    id: 'result-3',
    marks: 77,
    max_marks: 100,
    grade: 'B+',
    semester: 6,
    created_at: '2026-08-08T00:00:00.000Z',
    courses: { id: 'course-3', code: 'MATH110', name: 'Discrete Mathematics' },
  },
]

export const demoTimetable = [
  {
    id: 'time-1',
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:30',
    room: 'B-204',
    teacher: 'Prof. Meera Singh',
    courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' },
  },
  {
    id: 'time-2',
    day: 'Tuesday',
    start_time: '11:00',
    end_time: '12:30',
    room: 'A-104',
    teacher: 'Dr. Rahul Nair',
    courses: { id: 'course-2', code: 'CS204', name: 'Database Systems' },
  },
  {
    id: 'time-3',
    day: 'Thursday',
    start_time: '14:00',
    end_time: '15:30',
    room: 'C-301',
    teacher: 'Dr. Vikram Khanna',
    courses: { id: 'course-4', code: 'WEB210', name: 'Web Development' },
  },
]

export const demoStudents = [
  {
    id: demoAccounts.user.id,
    full_name: demoAccounts.user.full_name,
    student_id: demoAccounts.user.student_id,
    email: demoAccounts.user.email,
    course: demoAccounts.user.course,
    semester: demoAccounts.user.semester,
    phone: demoAccounts.user.phone,
    status: 'Active',
  },
  {
    id: 'demo-user-2',
    full_name: 'Diya Patel',
    student_id: 'STU-2024-1019',
    email: 'diya@student.com',
    course: 'BCA',
    semester: 6,
    phone: '+91 98765 43212',
    status: 'Active',
  },
  {
    id: 'demo-user-3',
    full_name: 'Kabir Verma',
    student_id: 'STU-2024-1020',
    email: 'kabir@student.com',
    course: 'BCA',
    semester: 5,
    phone: '+91 98765 43213',
    status: 'Active',
  },
]

export const demoFees = [
  { id: 'fee-1', student_id: demoAccounts.user.id, student_name: demoAccounts.user.full_name, semester: 6, total: 60000, paid: 45000, due_date: '2026-11-01' },
  { id: 'fee-2', student_id: 'demo-user-2', student_name: 'Diya Patel', semester: 6, total: 60000, paid: 60000, due_date: '2026-11-01' },
  { id: 'fee-3', student_id: 'demo-user-3', student_name: 'Kabir Verma', semester: 5, total: 56000, paid: 40000, due_date: '2026-11-01' },
]

export const demoEnrollments = [
  ...demoCourses.map((course) => ({
    id: `enrollment-${demoAccounts.user.id}-${course.id}`,
    student_id: demoAccounts.user.id,
    course_id: course.id,
  })),
  ...demoCourses.slice(0, 2).map((course) => ({
    id: `enrollment-demo-user-2-${course.id}`,
    student_id: 'demo-user-2',
    course_id: course.id,
  })),
  ...demoCourses.slice(1, 4).map((course) => ({
    id: `enrollment-demo-user-3-${course.id}`,
    student_id: 'demo-user-3',
    course_id: course.id,
  })),
]

export const demoTeacherSubjects = [
  { id: 'teacher-subject-1', teacher_id: demoAccounts.teacher.id, course_id: 'course-1' },
  { id: 'teacher-subject-2', teacher_id: demoAccounts.teacher.id, course_id: 'course-4' },
]

export const demoTeacherAttendance = [
  { id: 'teacher-attendance-1', student_id: demoAccounts.user.id, student_name: demoAccounts.user.full_name, attended: 24, total: 28, percentage: 86, courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' } },
  { id: 'teacher-attendance-2', student_id: 'demo-user-2', student_name: 'Diya Patel', attended: 22, total: 25, percentage: 88, courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' } },
  { id: 'teacher-attendance-3', student_id: 'demo-user-3', student_name: 'Kabir Verma', attended: 17, total: 22, percentage: 77, courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' } },
]

export const demoTeacherResults = [
  { id: 'teacher-result-1', student_id: demoAccounts.user.id, marks: 84, max_marks: 100, grade: 'A', semester: 6, courses: { id: 'course-1', code: 'CS101', name: 'Data Structures' } },
]

function readStoredData() {
  try {
    const raw = localStorage.getItem(DEMO_DATA_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveDemoCollection(collection, records) {
  const currentData = readStoredData()
  const nextData = { ...currentData, [collection]: records }
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(nextData))
}

export function getDemoCollection(collection, fallback = []) {
  return readStoredData()[collection] || fallback
}

export function saveDemoProfile(profile) {
  const currentData = readStoredData()
  const profiles = { ...(currentData.profiles || {}), [profile.id]: profile }
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify({ ...currentData, profiles }))
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredSession(user) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user))
}

export function getDemoSession() {
  const savedUser = readStoredSession()

  if (!savedUser) {
    return null
  }

  return {
    user: {
      id: savedUser.id,
      email: savedUser.email,
      user_metadata: savedUser.user_metadata || {},
    },
  }
}

export function loginDemoUser({ email, password, role = 'user' }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '').trim()

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Please enter email and password.')
  }

  const selectedAccount =
    demoAccounts[role] || demoAccounts.user

  const accountMatches =
    cleanEmail === selectedAccount.email &&
    cleanPassword === selectedAccount.password

  if (!accountMatches) {
    throw new Error('Invalid email or password for the selected role.')
  }

  const activeUser = {
    id: selectedAccount.id,
    email: selectedAccount.email,
    user_metadata: {
      full_name: selectedAccount.full_name,
      role: selectedAccount.role,
      demo_mode: true,
    },
  }

  writeStoredSession(activeUser)

  return { data: { user: activeUser }, error: null }
}

export function createDemoUser({ email, password, options = {} }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '').trim()
  const role = 'user'
  const fullName = String(options?.data?.full_name || demoProfile.full_name).trim()

  if (!cleanEmail || !cleanPassword || !fullName) {
    throw new Error('Please provide valid account details.')
  }

  const createdUser = {
    id: role === 'admin' ? 'demo-admin-custom' : `demo-user-${Date.now()}`,
    email: cleanEmail,
    user_metadata: {
      ...options?.data,
      full_name: fullName,
      role,
      demo_mode: true,
    },
  }

  writeStoredSession(createdUser)

  return {
    data: { user: createdUser, session: { user: createdUser } },
    error: null,
  }
}

export function logoutDemoUser() {
  localStorage.removeItem(DEMO_STORAGE_KEY)
  return { error: null }
}

export function getDemoDashboardData(user) {
  const role = user?.user_metadata?.role || 'user'
  const selectedAccount = demoAccounts[role] || demoAccounts.user
  const userEmail = user?.email || selectedAccount.email
  const userName = user?.user_metadata?.full_name || selectedAccount.full_name
  const userId = user?.id || selectedAccount.id
  const savedData = readStoredData()
  const profile = {
    ...selectedAccount,
    id: userId,
    email: userEmail,
    full_name: userName,
  }

  return {
    profile: { ...profile, ...(savedData.profiles?.[userId] || {}) },
    courses: savedData.courses || demoCourses,
    assignments: savedData.assignments || demoAssignments,
    attendance: savedData.attendance || (role === 'teacher' ? demoTeacherAttendance : demoAttendance),
    results: savedData.results || (role === 'teacher' ? demoTeacherResults : demoResults),
    timetable: savedData.timetable || demoTimetable,
    students: (savedData.students || demoStudents).filter((student) => student.role !== 'teacher' && student.role !== 'admin'),
    fees: savedData.fees || demoFees,
    enrollments: savedData.enrollments || demoEnrollments,
    teacherSubjects: savedData.teacherSubjects || demoTeacherSubjects,
    teachers: savedData.teachers || [demoAccounts.teacher],
  }
}
