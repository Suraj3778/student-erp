import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import {
  isSupabaseConfigured,
  supabase,
} from './lib/supabase'
import {
  getDemoDashboardData,
  getDemoCollection,
  getDemoSession,
  logoutDemoUser,
  saveDemoCollection,
  saveDemoProfile,
} from './lib/demoData'

import Auth from './components/Auth'
import ForcedPasswordChange from './components/Auth/ForcedPasswordChange'

import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'

import Dashboard from './components/Dashboard/Dashboard'
import Courses from './components/Courses/Courses'
import Attendance from './components/Attendance/Attendance'
import Assignments from './components/Assignments/AssignmentsPage'
import Results from './components/Results/Results'
import Timetable from './components/Timetable/Timetable'
import Fees from './components/Fees/Fees'
import Profile from './components/Profile/Profile'

const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'))
const TeacherWorkspace = lazy(() => import('./components/Teacher/TeacherWorkspace'))

import './App.css'

function getUserRole(candidate) {
  if (!candidate) return 'user'
  if (candidate.id === 'demo-admin-1') return 'admin'
  if (candidate.user_metadata?.demo_mode) {
    return ['admin', 'teacher'].includes(candidate.user_metadata?.role)
      ? candidate.user_metadata.role
      : 'user'
  }
  return ['admin', 'teacher'].includes(candidate.app_metadata?.role)
    ? candidate.app_metadata.role
    : 'user'
}

async function resolveUserRole(candidate) {
  const trustedRole = getUserRole(candidate)
  if (
    trustedRole === 'admin' ||
    (candidate?.app_metadata?.role === 'teacher' && trustedRole === 'teacher') ||
    candidate?.user_metadata?.demo_mode ||
    !candidate ||
    !supabase
  ) {
    return trustedRole
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', candidate.id)
      .maybeSingle()

    if (error) {
      console.error('Role lookup error:', error)
      return 'user'
    }
    const profileRole = String(data?.role || '').toLowerCase()
    return ['admin', 'teacher'].includes(profileRole) ? profileRole : 'user'
  } catch (error) {
    console.error('Role lookup error:', error)
    return 'user'
  }
}

function normalizeFee(record) {
  return {
    ...record,
    total: Number(record.total ?? record.total_amount ?? 0),
    paid: Number(record.paid ?? record.paid_amount ?? 0),
    pending: Number(record.pending ?? record.pending_amount ?? 0),
  }
}

function attendanceId(value, label) {
  let candidate = value
  while (candidate && typeof candidate === 'object') {
    candidate = candidate.id ?? candidate.student_id ?? candidate.course_id ?? candidate.uuid
  }
  if (typeof candidate !== 'string' || !candidate.trim()) {
    throw new Error(`Invalid ${label} identifier. Refresh the page and try again.`)
  }
  return candidate.trim()
}

function attendanceUuid(value, label) {
  const candidate = attendanceId(value, label)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
    throw new Error(`Invalid ${label} identifier. Refresh the page and try again.`)
  }
  return candidate
}

function attendanceRpcUuid(value, label) {
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object'
      ? value.id
      : null
  if (typeof candidate !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
    throw new Error(`Invalid ${label} ID. Refresh the page and try again.`)
  }
  return candidate
}

function attendanceSessionUuid(value) {
  if (typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value
  }
  if (Array.isArray(value) && value.length === 1) {
    return attendanceSessionUuid(value[0])
  }
  if (value && typeof value === 'object') {
    const returnedId = value.save_teacher_class_attendance ?? value.session_id ?? value.id
    if (returnedId !== undefined) return attendanceSessionUuid(returnedId)
  }
  throw new Error('Attendance RPC returned an invalid session ID.')
}

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function summarizeAttendanceSessions(sessions, fallback = []) {
  const totals = new Map()
  for (const session of sessions) {
    const courseId = session.course_id || session.courses?.id
    const course = session.courses || null
    for (const record of session.records || session.attendance_records || []) {
      const key = `${record.student_id}:${courseId}`
      const current = totals.get(key) || {
        id: `session-attendance-${key}`,
        student_id: record.student_id,
        courses: course,
        attended: 0,
        total: 0,
        lectures: [],
      }
      current.total += 1
      if (record.status === 'present') current.attended += 1
      current.lectures.push({
        id: record.id || `${session.id}-${record.student_id}`,
        lecture_number: session.lecture_number,
        session_type: session.session_type,
        held_on: session.held_on,
        status: record.status,
      })
      totals.set(key, current)
    }
  }

  const summaries = [...totals.values()].map((item) => ({
    ...item,
    percentage: item.total ? Math.round((item.attended / item.total) * 100) : 0,
  }))
  const summarizedCourses = new Set(summaries.map((item) => item.courses?.id))
  return [
    ...fallback.filter((item) => !summarizedCourses.has(item.courses?.id || item.course_id)),
    ...summaries,
  ]
}

function attendancePercentage(record) {
  const total = Number(record.total)
  const attended = Number(record.attended)
  return Number.isFinite(total) && total > 0 && Number.isFinite(attended)
    ? Math.round((attended / total) * 100)
    : 0
}

function withAttendancePercentages(records = []) {
  return records.map((record) => ({
    ...record,
    percentage: attendancePercentage(record),
  }))
}

function databaseRecord(collection, record) {
  const fields = {
    students: ['id', 'student_id', 'full_name', 'phone', 'course', 'semester', 'department', 'university', 'profile_image', 'section', 'year_level', 'academic_year', 'admission_year'],
    courses: ['id', 'code', 'name', 'teacher', 'credits', 'progress'],
    assignments: ['id', 'course_id', 'title', 'description', 'due_date', 'priority'],
    attendance: ['id', 'student_id', 'course_id', 'attended', 'total'],
    results: ['id', 'student_id', 'course_id', 'marks', 'max_marks', 'grade', 'semester'],
    timetable: ['id', 'course_id', 'day', 'start_time', 'end_time', 'room', 'teacher'],
    fees: ['id', 'student_id', 'total_amount', 'paid_amount', 'due_date', 'status'],
    enrollments: ['id', 'student_id', 'course_id'],
    teacherSubjects: ['id', 'teacher_id', 'course_id'],
  }
  const allowedFields = fields[collection] || []
  const payload = Object.fromEntries(
    allowedFields.filter((key) => key in record).map((key) => [key, record[key]]),
  )

  if (payload.course_id == null && record.courses?.id) {
    payload.course_id = record.courses.id
  }

  if (collection === 'fees') {
    payload.total_amount = Number(record.total || 0)
    payload.paid_amount = Number(record.paid || 0)
    const pendingAmount = Math.max(0, payload.total_amount - payload.paid_amount)
    payload.status = pendingAmount ? (payload.paid_amount ? 'partial' : 'pending') : 'paid'
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value]),
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [roleResolved, setRoleResolved] = useState(false)
  const [profile, setProfile] = useState(null)

  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [attendanceSessions, setAttendanceSessions] = useState([])
  const [results, setResults] = useState([])
  const [timetable, setTimetable] = useState([])
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [teacherSubjects, setTeacherSubjects] = useState([])

  const [active, setActive] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // =========================
  // CHECK SESSION
  // =========================

  const checkSession = useCallback(async () => {
    try {
      const savedSession = getDemoSession()

      if (!isSupabaseConfigured || !supabase || savedSession?.user?.user_metadata?.demo_mode) {
        const sessionUser = savedSession?.user ?? null
        setUser(sessionUser)
        setUserRole(getUserRole(sessionUser))
        return
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (session?.user) {
        setUser(session.user)
        setUserRole(await resolveUserRole(session.user))
        return
      }

      const sessionUser = savedSession?.user ?? null
      setUser(sessionUser)
      setUserRole(await resolveUserRole(sessionUser))
    } catch (error) {
      console.error('Session error:', error)
      const savedSession = getDemoSession()
      const sessionUser = savedSession?.user ?? null
      setUser(sessionUser)
      setUserRole(getUserRole(sessionUser))
    } finally {
      setRoleResolved(true)
      setLoading(false)
    }
  }, [])

  // =========================
  // LOAD ALL DASHBOARD DATA
  // =========================

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError('')

      if (!isSupabaseConfigured || !supabase || user.user_metadata?.demo_mode) {
        const demoData = getDemoDashboardData(user)
        setProfile(demoData.profile)
        const loadedAttendanceSessions = getDemoCollection('attendanceSessions')
        const assignedCourseIds = new Set(
          demoData.teacherSubjects
            .filter((assignment) => assignment.teacher_id === user.id)
            .map((assignment) => assignment.course_id),
        )
        const visibleCourseIds = userRole === 'admin'
          ? null
          : userRole === 'teacher'
            ? assignedCourseIds
            : new Set(demoData.enrollments
                .filter((enrollment) => enrollment.student_id === user.id)
                .map((enrollment) => enrollment.course_id))
        setCourses(userRole === 'admin'
          ? demoData.courses
          : userRole === 'teacher'
            ? demoData.courses.filter((course) => assignedCourseIds.has(course.id))
            : demoData.courses.filter((course) => demoData.enrollments.some(
                (enrollment) => enrollment.student_id === user.id && enrollment.course_id === course.id,
              )))
        setAssignments(visibleCourseIds
          ? demoData.assignments.filter((assignment) => visibleCourseIds.has(assignment.courses?.id || assignment.course_id))
          : demoData.assignments)
        const demoAttendance = summarizeAttendanceSessions(loadedAttendanceSessions, demoData.attendance)
        setAttendance(demoAttendance.filter((item) =>
          userRole === 'admin' ||
          (userRole === 'teacher'
            ? assignedCourseIds.has(item.courses?.id || item.course_id)
            : !item.student_id || item.student_id === user.id),
        ))
        setResults(demoData.results.filter((item) =>
          userRole === 'admin' ||
          (userRole === 'teacher'
            ? assignedCourseIds.has(item.courses?.id || item.course_id)
            : !item.student_id || item.student_id === user.id),
        ))
        setTimetable(visibleCourseIds
          ? demoData.timetable.filter((entry) => visibleCourseIds.has(entry.courses?.id || entry.course_id))
          : demoData.timetable)
        setStudents(userRole === 'teacher'
          ? demoData.students.filter((student) => demoData.enrollments.some(
              (enrollment) => enrollment.student_id === student.id && assignedCourseIds.has(enrollment.course_id),
            ))
          : userRole === 'admin'
            ? demoData.students
            : demoData.students.filter((student) => student.id === user.id))
        setFees(userRole === 'admin'
          ? demoData.fees
          : demoData.fees.filter((fee) => fee.student_id === user.id))
        setEnrollments(userRole === 'admin'
          ? demoData.enrollments
          : demoData.enrollments.filter((enrollment) =>
              userRole === 'teacher'
                ? assignedCourseIds.has(enrollment.course_id)
                : enrollment.student_id === user.id,
            ))
        setTeachers(demoData.teachers)
        setTeacherSubjects(demoData.teacherSubjects)
        setAttendanceSessions(loadedAttendanceSessions)
        setUserRole(getUserRole(user))
        return
      }

      // =========================
      // PROFILE
      // =========================

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(
          'Profile error:',
          profileError
        )
        const demoData = getDemoDashboardData(user)
        setProfile(demoData.profile)
      } else {
        setProfile(profileData)
      }

      if (userRole === 'teacher') {
        const { data: assignedSubjects, error: subjectError } = await supabase
          .from('teacher_subjects')
          .select('id, teacher_id, course_id')
          .eq('teacher_id', user.id)

        if (subjectError) throw subjectError
        const teacherCourseIds = (assignedSubjects || []).map((item) => item.course_id)
        setTeacherSubjects(assignedSubjects || [])

        if (teacherCourseIds.length === 0) {
          setCourses([])
          setStudents([])
          setEnrollments([])
          setAttendance([])
          setAttendanceSessions([])
          setResults([])
          setAssignments([])
          setTimetable([])
          setFees([])
          return
        }

        const { data: teacherCourses, error: teacherCoursesError } = await supabase
          .from('courses')
          .select('id, code, name, teacher, credits, progress')
          .in('id', teacherCourseIds)
        if (teacherCoursesError) throw teacherCoursesError
        setCourses(teacherCourses || [])

        const { data: teacherEnrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('id, student_id, course_id')
          .in('course_id', teacherCourseIds)
        if (enrollmentsError) throw enrollmentsError
        setEnrollments(teacherEnrollments || [])

        const enrolledStudentIds = [...new Set((teacherEnrollments || []).map((item) => item.student_id))]
        if (enrolledStudentIds.length) {
          const { data: roster, error: rosterError } = await supabase
            .from('profiles')
            .select('id, student_id, full_name, email, course, section, semester, year_level, academic_year')
            .in('id', enrolledStudentIds)
          if (rosterError) throw rosterError
          setStudents(roster || [])
        } else {
          setStudents([])
        }

        const { data: teacherAttendance, error: teacherAttendanceError } = await supabase
          .from('attendance')
          .select('id, student_id, attended, total, courses (id, code, name)')
          .in('course_id', teacherCourseIds)
        if (teacherAttendanceError) throw teacherAttendanceError
        setAttendance(withAttendancePercentages(teacherAttendance || []))

        const { data: teacherResults, error: teacherResultsError } = await supabase
          .from('results')
          .select('id, student_id, marks, max_marks, grade, semester, created_at, courses (id, code, name)')
          .in('course_id', teacherCourseIds)
        if (teacherResultsError) throw teacherResultsError
        setResults(teacherResults || [])

        const { data: teacherSessions, error: teacherSessionsError } = await supabase
          .from('attendance_sessions')
          .select('id, course_id, teacher_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on, courses (id, code, name), attendance_records!inner (id, student_id, status)')
          .in('course_id', teacherCourseIds)
          .order('held_on', { ascending: false })
        if (teacherSessionsError) throw teacherSessionsError
        const normalizedSessions = (teacherSessions || []).map((session) => ({
          ...session,
          records: session.attendance_records || [],
        }))
        setAttendanceSessions(normalizedSessions)
        setAttendance(summarizeAttendanceSessions(normalizedSessions, teacherAttendance || []))

        const { data: teacherAssignments, error: teacherAssignmentsError } = await supabase
          .from('assignments')
          .select('id, title, description, due_date, priority, course_id, courses (id, code, name)')
          .in('course_id', teacherCourseIds)
          .order('due_date', { ascending: true })
        if (teacherAssignmentsError) throw teacherAssignmentsError
        setAssignments(teacherAssignments || [])

        const { data: teacherTimetable, error: teacherTimetableError } = await supabase
          .from('timetable')
          .select('id, day, start_time, end_time, room, teacher, course_id, courses (id, code, name)')
          .in('course_id', teacherCourseIds)
          .order('start_time', { ascending: true })
        if (teacherTimetableError) throw teacherTimetableError
        setTimetable(teacherTimetable || [])
        setFees([])
        return
      }

      if (user.id === 'demo-admin-1' || user.id === 'demo-user-1') {
        const demoData = getDemoDashboardData(user)
        setStudents(demoData.students)
        setFees(demoData.fees)
      }

      // =========================
      // COURSES
      // =========================

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase
        .from('enrollments')
        .select(`
          id,
          courses (
            id,
            code,
            name,
            teacher,
            credits,
            progress
          )
        `)
        .eq('student_id', user.id)

      if (enrollmentError) {
        console.error(
          'Courses error:',
          enrollmentError
        )
        const demoData = getDemoDashboardData(user)
        setCourses(demoData.courses)
      } else {
        const courseList =
          enrollmentData
            ?.map((item) => item.courses)
            .filter(Boolean) || []

        setCourses(courseList)
        setEnrollments(enrollmentData || [])
      }

      // =========================
      // ASSIGNMENTS
      // =========================

      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          priority,
          courses (
            id,
            code,
            name
          )
        `)
        .order('due_date', {
          ascending: true,
        })

      if (assignmentError) {
        console.error(
          'Assignments error:',
          assignmentError
        )
        const demoData = getDemoDashboardData(user)
        setAssignments(demoData.assignments)
      } else {
        setAssignments(
          assignmentData || []
        )
      }

      // =========================
      // ATTENDANCE
      // =========================

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select(`
          id,
          attended,
          total,
          courses (
            id,
            code,
            name
          )
        `)
        .eq('student_id', user.id)

      if (attendanceError) {
        console.error(
          'Attendance error:',
          attendanceError
        )
        const demoData = getDemoDashboardData(user)
        setAttendance(demoData.attendance)
      } else {
        setAttendance(
          withAttendancePercentages(attendanceData || [])
        )
      }
      const { data: studentSessions, error: studentSessionsError } = await supabase
        .from('attendance_sessions')
        .select('id, course_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on, courses (id, code, name), attendance_records!inner (id, student_id, status)')
        .eq('attendance_records.student_id', user.id)
        .order('held_on', { ascending: false })
      if (studentSessionsError) {
        console.error('Class attendance history load error:', studentSessionsError)
        setLoadError(`Class-by-class attendance is unavailable until the attendance session migration is applied: ${studentSessionsError.message}`)
      } else {
        const normalizedSessions = (studentSessions || []).map((session) => ({
          ...session,
          records: (session.attendance_records || []).filter((record) => record.student_id === user.id),
        }))
        setAttendanceSessions(normalizedSessions)
        setAttendance((previous) => summarizeAttendanceSessions(normalizedSessions, previous))
      }

      // =========================
      // RESULTS
      // =========================

      const {
        data: resultData,
        error: resultError,
      } = await supabase
        .from('results')
        .select(`
          id,
          marks,
          max_marks,
          grade,
          semester,
          created_at,
          courses (
            id,
            code,
            name
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', {
          ascending: true,
        })

      if (resultError) {
        console.error(
          'Results error:',
          resultError
        )
        const demoData = getDemoDashboardData(user)
        setResults(demoData.results)
      } else {
        setResults(resultData || [])
      }

      // =========================
      // TIMETABLE
      // =========================

      const {
        data: timetableData,
        error: timetableError,
      } = await supabase
        .from('timetable')
        .select(`
          id,
          day,
          start_time,
          end_time,
          room,
          teacher,
          courses (
            id,
            code,
            name
          )
        `)
        .order('start_time', {
          ascending: true,
        })

      if (timetableError) {
        console.error(
          'Timetable error:',
          timetableError
        )
        const demoData = getDemoDashboardData(user)
        setTimetable(demoData.timetable)
      } else {
        setTimetable(
          timetableData || []
        )
      }

      if (userRole === 'admin') {
        const { data: allCourses, error: allCoursesError } = await supabase
          .from('courses')
          .select('id, code, name, teacher, credits, progress')
        if (allCoursesError) {
          console.error('Admin courses load error:', allCoursesError)
        } else {
          setCourses(allCourses || [])
        }

        const { data: allEnrollments, error: allEnrollmentsError } = await supabase
          .from('enrollments')
          .select('id, student_id, course_id')
        if (allEnrollmentsError) {
          console.error('Admin enrollments load error:', allEnrollmentsError)
        } else {
          setEnrollments(allEnrollments || [])
        }

        const { data: allAttendance, error: allAttendanceError } = await supabase
          .from('attendance')
          .select('id, student_id, attended, total, courses (id, code, name)')
        if (allAttendanceError) {
          console.error('Admin attendance load error:', allAttendanceError)
        } else {
          setAttendance(withAttendancePercentages(allAttendance || []))
        }
        const { data: allSessions, error: allSessionsError } = await supabase
          .from('attendance_sessions')
          .select('id, course_id, teacher_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on, courses (id, code, name), attendance_records!inner (id, student_id, status)')
          .order('held_on', { ascending: false })
        if (allSessionsError) {
          console.error('Admin class attendance load error:', allSessionsError)
          setLoadError(`Class-by-class attendance is unavailable until the attendance session migration is applied: ${allSessionsError.message}`)
        } else {
          const normalizedSessions = (allSessions || []).map((session) => ({
            ...session,
            records: session.attendance_records || [],
          }))
          setAttendanceSessions(normalizedSessions)
          setAttendance((previous) => summarizeAttendanceSessions(normalizedSessions, previous))
        }

        const { data: allResults, error: allResultsError } = await supabase
          .from('results')
          .select('id, student_id, marks, max_marks, grade, semester, created_at, courses (id, code, name)')
        if (allResultsError) {
          console.error('Admin results load error:', allResultsError)
        } else {
          setResults(allResults || [])
        }

        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('*')

        if (studentError) {
          console.error('Admin students load error:', studentError)
        } else {
          const profiles = studentData || []
          setStudents(profiles.filter((student) => !['admin', 'teacher'].includes(String(student.role || '').toLowerCase())))
          setTeachers(profiles
            .filter((profile) =>
              profile &&
              String(profile.role || '').toLowerCase() === 'teacher' &&
              isUuid(profile.id),
            )
            .map((profile) => ({
              ...profile,
              id: profile.id,
              email: profile.email || '',
              full_name: profile.full_name || '',
            })))
        }

        const { data: teacherSubjectData, error: teacherSubjectsError } = await supabase
          .from('teacher_subjects')
          .select('id, teacher_id, course_id')
        if (teacherSubjectsError) {
          console.error('Admin teacher-subject load error:', teacherSubjectsError)
        } else {
          setTeacherSubjects((teacherSubjectData || []).filter((assignment) =>
            assignment && isUuid(assignment.teacher_id) && isUuid(assignment.course_id),
          ))
        }

        const { data: feeData, error: feeError } = await supabase
          .from('fees')
          .select('*')

        if (feeError) {
          console.error('Admin fees load error:', feeError)
        } else {
          setFees((feeData || []).map(normalizeFee))
        }
      } else {
        const { data: feeData, error: feeError } = await supabase
          .from('fees')
          .select('*')
          .eq('student_id', user.id)

        if (feeError) {
          console.error('Fees load error:', feeError)
        } else {
          setFees((feeData || []).map(normalizeFee))
        }
      }
    } catch (error) {
      setLoadError(error.message || 'Could not load portal data.')
      console.error(
        'Dashboard data error:',
        error
      )
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    checkSession()

    if (!isSupabaseConfigured || !supabase) {
      return undefined
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      if (nextUser) {
        logoutDemoUser()
      }
      const activeUser = nextUser || getDemoSession()?.user || null
      setUser(activeUser)
      setUserRole(getUserRole(activeUser))
      setRoleResolved(
        !activeUser ||
        Boolean(activeUser.user_metadata?.demo_mode) ||
        ['admin', 'teacher'].includes(getUserRole(activeUser)),
      )
    })

    return () => subscription.unsubscribe()
  }, [checkSession])

  useEffect(() => {
    if (!user || user.user_metadata?.demo_mode || getUserRole(user) === 'admin') {
      setRoleResolved(true)
      return undefined
    }
    let cancelled = false
    resolveUserRole(user).then((role) => {
      if (!cancelled) {
        setUserRole(role)
        setRoleResolved(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (user && roleResolved && !user.app_metadata?.force_password_change) loadDashboardData()
  }, [user, roleResolved, loadDashboardData])

  async function handleUserLogin(nextUser, expectedRole = 'user') {
    const resolvedRole = await resolveUserRole(nextUser)
    if (resolvedRole !== expectedRole) {
      if (nextUser.user_metadata?.demo_mode) logoutDemoUser()
      else if (supabase) await supabase.auth.signOut()
      throw new Error(`This account is not registered as ${expectedRole}. Choose the correct account type.`)
    }
    setUserRole(resolvedRole)
    setRoleResolved(true)
    setActive(resolvedRole === 'teacher' ? 'teacher-workspace' : 'dashboard')
    setUser(nextUser)
  }

  async function completeForcedPasswordChange(newPassword) {
    if (!supabase) throw new Error('Password changes require a configured Supabase project.')
    await invokeTeacherAccountAdmin({ action: 'change-password', newPassword })

    const { data, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw refreshError
    if (!data.session?.user || data.session.user.app_metadata?.force_password_change) {
      throw new Error('Password changed, but the updated session could not be confirmed. Sign in again.')
    }
    setUser(data.session.user)
    setUserRole('teacher')
    setRoleResolved(true)
    setActive('teacher-workspace')
  }

  async function createTeacherAccount(input) {
    if (!supabase || userRole !== 'admin' || user.user_metadata?.demo_mode) {
      throw new Error('Live administrator access is required to create teacher accounts.')
    }
    const email = String(input.email || '').trim().toLowerCase()
    const password = String(input.temporaryPassword || '')
    const fullName = String(input.fullName || '').trim()
    const teacherId = String(input.teacherId || '').trim()
    const courseIds = Array.isArray(input.courseIds) ? input.courseIds : []
    const selectedCourses = courses.filter((course) => courseIds.includes(course.id))
    if (!email || !password || !fullName) {
      throw new Error('Enter the teacher’s full name, email, and temporary password.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid teacher email address.')
    }
    if (password.length < 12) {
      throw new Error('Temporary password must contain at least 12 characters.')
    }
    if (!teacherId) {
      throw new Error('Enter a teacher ID.')
    }
    if (selectedCourses.length !== courseIds.length || !selectedCourses.length) {
      throw new Error('Select at least one valid course before creating the teacher account.')
    }

    const data = await invokeTeacherAccountAdmin({
      email,
      password,
      full_name: fullName,
      phone: null,
      student_id: teacherId,
      course: selectedCourses.map((course) => course.code || course.name).join(', '),
      semester: null,
      department: null,
      university: null,
    })
    if (data?.success === false) {
      throw new Error(data.message || 'The server could not create the teacher account.')
    }
    const profile = data?.profile
    const returnedTeacherId = data?.user?.id || profile?.id
    if (!profile || !returnedTeacherId || profile.id && profile.id !== returnedTeacherId) {
      throw new Error('The server response did not include a matching teacher profile and Auth UUID.')
    }
    if (String(profile.role || '').toLowerCase() !== 'teacher') {
      throw new Error('The server created a profile without the required teacher role.')
    }
    const teacherUuid = attendanceUuid(returnedTeacherId, 'teacher account')

    const teacher = {
      ...profile,
      id: teacherUuid,
      email: data.user?.email || profile.email || email,
      full_name: profile.full_name || fullName,
      teacher_id: profile.teacher_id || String(input.teacherId || '').trim(),
      role: profile.role,
      accessEnabled: true,
    }
    const existingAssignments = Array.isArray(data.assignments) ? data.assignments : []
    if (existingAssignments.length && existingAssignments.some((assignment) =>
      !assignment ||
      assignment.teacher_id !== teacherUuid ||
      !courseIds.includes(assignment.course_id),
    )) {
      throw new Error('The server returned subject assignments that do not match the created teacher account.')
    }
    const assignments = existingAssignments.length
      ? existingAssignments
      : courseIds.map((courseId) => ({
          id: crypto.randomUUID(),
          teacher_id: teacherUuid,
          course_id: courseId,
        }))
    if (!existingAssignments.length) {
      const { error } = await supabase.from('teacher_subjects').insert(assignments)
      if (error) {
        throw new Error(`Teacher account was created, but course access could not be assigned: ${error.message}`)
      }
    }
    setTeachers((previous) => [teacher, ...previous.filter((item) => item.id !== teacherUuid)])
    setTeacherSubjects((previous) => [
      ...previous.filter((item) => item.teacher_id !== teacherUuid),
      ...assignments,
    ])
    return teacher
  }

  async function disableTeacherAccount(teacherId) {
    if (!supabase || userRole !== 'admin' || user.user_metadata?.demo_mode) {
      throw new Error('Live administrator access is required to manage teacher accounts.')
    }
    const data = await invokeTeacherAccountAdmin({ action: 'disable', teacherId })
    setTeachers((previous) => previous.map((teacher) =>
      teacher.id === teacherId ? { ...teacher, accessEnabled: false } : teacher,
    ))
    setTeacherSubjects((previous) => previous.filter((item) => item.teacher_id !== teacherId))
    return data
  }

  async function invokeTeacherAccountAdmin(body) {
    const { data, error } = await supabase.functions.invoke('teacher-account-admin', { body })
    if (error) {
      const response = error.context
      if (response instanceof Response) {
        let responseBody
        try {
          responseBody = await response.clone().json()
        } catch {
          responseBody = null
        }
        const serverMessage = typeof responseBody?.error === 'string'
          ? responseBody.error
          : typeof responseBody?.message === 'string'
            ? responseBody.message
            : ''
        if (serverMessage) throw new Error(serverMessage)
      }
      if (error.message === 'Failed to send a request to the Edge Function') {
        throw new Error(
          `Could not reach the teacher-account-admin Edge Function. Confirm it is deployed to the Supabase project configured in VITE_SUPABASE_URL and that the project URL is correct. Details: ${error.message}`,
        )
      }
      throw error
    }
    return data
  }

  function updateCollection(collection, setter, currentRecords) {
    return async (records) => {
      if (user.user_metadata?.demo_mode || user.id === 'demo-admin-1') {
        setter(records)
        saveDemoCollection(collection, records)
        return
      }

      if (userRole !== 'admin' || !supabase) {
        throw new Error('Only a verified administrator can modify this data.')
      }

      if (collection === 'students' && records.some((record) => !currentRecords.some((item) => item.id === record.id))) {
        throw new Error('New student accounts must be created with a trusted server-side Auth function.')
      }

      const table = collection === 'students'
        ? 'profiles'
        : collection === 'teacherSubjects'
          ? 'teacher_subjects'
          : collection
      const removed = currentRecords.filter((item) => !records.some((record) => record.id === item.id))
      const added = records.filter((item) => !currentRecords.some((record) => record.id === item.id))
      const changed = records.filter((record) => {
        const previous = currentRecords.find((item) => item.id === record.id)
        return previous && JSON.stringify(databaseRecord(collection, previous)) !== JSON.stringify(databaseRecord(collection, record))
      })

      for (const record of removed) {
        const { error } = await supabase.from(table).delete().eq('id', record.id)
        if (error) throw error
      }
      for (const record of added) {
        const { error } = await supabase.from(table).insert(databaseRecord(collection, record))
        if (error) throw error
      }
      for (const record of changed) {
        const { error } = await supabase
          .from(table)
          .update(databaseRecord(collection, record))
          .eq('id', record.id)
        if (error) throw error
      }

      setter(records)
    }
  }

  async function saveTeacherAttendanceSession(sessionInput) {
    if (userRole !== 'teacher') throw new Error('Only teacher accounts can mark class attendance.')
    const courseId = attendanceId(sessionInput?.course_id, 'subject')
    if (!Array.isArray(sessionInput.records)) {
      throw new Error('Attendance records must be a student list.')
    }
    const records = sessionInput.records.map((record) => ({
      student_id: attendanceId(record?.student_id, 'student'),
      status: record.status,
    }))
    const assignedCourseIds = teacherAssignedCourseIds()
    if (!assignedCourseIds.has(courseId)) {
      throw new Error('This subject is not assigned to your teacher account.')
    }

    const section = String(sessionInput.section ?? '')
    const semester = Number(sessionInput.semester)
    const yearLevel = Number(sessionInput.year_level)
    const academicYear = String(sessionInput.academic_year ?? '')
    if (!Number.isInteger(semester) || semester < 0 || semester > 8 ||
        !Number.isInteger(yearLevel) || yearLevel < 0 || yearLevel > 4) {
      throw new Error('Choose a valid cohort before saving attendance.')
    }
    const enrolledStudentIds = enrollments
      .filter((enrollment) => attendanceId(enrollment.course_id, 'subject') === courseId)
      .map((enrollment) => attendanceId(enrollment.student_id, 'student'))
    const courseRoster = students
      .filter((student) =>
        enrolledStudentIds.includes(attendanceId(student.id, 'student')) &&
        String(student.section || '') === section &&
        Number(student.semester || 0) === semester &&
        Number(student.year_level || 0) === yearLevel &&
        String(student.academic_year || '') === academicYear,
      )
      .map((student) => attendanceId(student.id, 'student'))
      .sort()
    const submittedStudentIds = records.map((record) => record.student_id).sort()
    if (
      !courseRoster.length ||
      courseRoster.length !== submittedStudentIds.length ||
      courseRoster.some((studentId, index) => studentId !== submittedStudentIds[index])
    ) {
      throw new Error('Attendance must be marked exactly once for every student enrolled in this subject.')
    }
    if (new Set(submittedStudentIds).size !== submittedStudentIds.length ||
        records.some((record) => !['present', 'absent'].includes(record.status))) {
      throw new Error('Choose present or absent exactly once for every student.')
    }

    const lectureNumber = Number(sessionInput.lecture_number)
    if (!Number.isInteger(lectureNumber) || lectureNumber < 1) {
      throw new Error('Lecture number must be a positive whole number.')
    }
    if (!['theory', 'lab'].includes(sessionInput.session_type)) {
      throw new Error('Choose Theory or Lab for the class type.')
    }

    if (user.user_metadata?.demo_mode) {
      const matchingSession = attendanceSessions.find((session) =>
        attendanceId(session.course_id, 'subject') === courseId &&
        String(session.section || '') === section &&
        Number(session.semester || 0) === semester &&
        Number(session.year_level || 0) === yearLevel &&
        String(session.academic_year || '') === academicYear &&
        Number(session.lecture_number) === lectureNumber &&
        session.session_type === sessionInput.session_type &&
        session.held_on === sessionInput.held_on,
      )
      const course = courses.find((item) => attendanceId(item.id, 'subject') === courseId)
      const savedSession = {
        id: matchingSession?.id || crypto.randomUUID(),
        course_id: courseId,
        teacher_id: user.id,
        section,
        semester,
        year_level: yearLevel,
        academic_year: academicYear,
        lecture_number: lectureNumber,
        session_type: sessionInput.session_type,
        held_on: sessionInput.held_on,
        courses: course ? { id: course.id, code: course.code, name: course.name } : null,
        records: records.map((record) => ({
          id: crypto.randomUUID(),
          student_id: record.student_id,
          status: record.status,
        })),
      }
      const nextSessions = matchingSession
        ? attendanceSessions.map((session) => session.id === matchingSession.id ? savedSession : session)
        : [savedSession, ...attendanceSessions]
      saveDemoCollection('attendanceSessions', nextSessions)
      setAttendanceSessions(nextSessions)

      const allSavedSessions = getDemoCollection('attendanceSessions')
      const savedData = getDemoDashboardData(user)
      const nextAttendance = summarizeAttendanceSessions(allSavedSessions, savedData.attendance)
      saveDemoCollection('attendance', nextAttendance)
      setAttendance(nextAttendance.filter((record) =>
        assignedCourseIds.has(attendanceId(record.courses?.id || record.course_id, 'subject')),
      ))
      return
    }

    if (!supabase) throw new Error('Supabase is not configured.')
    attendanceRpcUuid(user?.id, 'teacher')
    const rpcCourseId = attendanceRpcUuid(courseId, 'course')
    const rpcRecords = records.map((record) => ({
      student_id: attendanceRpcUuid(record.student_id, 'student'),
      status: record.status,
    }))
    const { data: rpcResult, error } = await supabase.rpc('save_teacher_class_attendance', {
      p_academic_year: academicYear,
      p_course_id: rpcCourseId,
      p_held_on: sessionInput.held_on,
      p_lecture_number: lectureNumber,
      p_records: rpcRecords,
      p_section: section,
      p_semester: semester,
      p_session_type: sessionInput.session_type,
      p_year_level: yearLevel,
    })
    if (error) throw error
    const sessionId = attendanceSessionUuid(rpcResult)

    const { data: savedSessionData, error: loadError } = await supabase
      .from('attendance_sessions')
      .select('id, course_id, teacher_id, section, semester, year_level, academic_year, lecture_number, session_type, held_on, courses (id, code, name), attendance_records (id, student_id, status)')
      .eq('id', sessionId)
      .single()
    if (loadError) throw loadError
    const savedSession = { ...savedSessionData, records: savedSessionData.attendance_records || [] }
    const nextSessions = attendanceSessions.some((item) => item.id === savedSession.id)
      ? attendanceSessions.map((item) => item.id === savedSession.id ? savedSession : item)
      : [savedSession, ...attendanceSessions]
    setAttendanceSessions(nextSessions)
    setAttendance(summarizeAttendanceSessions(nextSessions, attendance))
  }

  function teacherAssignedCourseIds() {
    return new Set(
      teacherSubjects
        .filter((assignment) => assignment.teacher_id === user.id)
        .map((assignment) => attendanceId(assignment.course_id, 'subject')),
    )
  }

  async function saveTeacherEntry(collection, entry) {
    if (!['attendance', 'results'].includes(collection)) {
      throw new Error('Teachers can only submit attendance and marks.')
    }
    const assignedCourseIds = teacherSubjects
      .filter((assignment) => assignment.teacher_id === user.id)
      .map((assignment) => assignment.course_id)
    if (!assignedCourseIds.includes(entry.course_id)) {
      throw new Error('This subject is not assigned to your teacher account.')
    }
    if (!students.some((student) => student.id === entry.student_id) ||
        !enrollments.some((enrollment) => enrollment.student_id === entry.student_id && enrollment.course_id === entry.course_id)) {
      throw new Error('This student is not enrolled in the selected subject.')
    }
    if (collection === 'attendance') {
      const total = Number(entry.total)
      const attended = Number(entry.attended)
      if (!Number.isInteger(total) || total < 1 || !Number.isInteger(attended) || attended < 0 || attended > total) {
        throw new Error('Attendance must use whole-number counts, with attended classes between zero and total classes.')
      }
      entry = { ...entry, total, attended, percentage: attendancePercentage({ total, attended }) }
    } else {
      const maxMarks = Number(entry.max_marks)
      const marks = Number(entry.marks)
      const semester = Number(entry.semester)
      if (!Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(marks) || marks < 0 || marks > maxMarks) {
        throw new Error('Marks must be between zero and the maximum marks.')
      }
      if (!Number.isInteger(semester) || semester < 1) {
        throw new Error('Semester must be a positive whole number.')
      }
      if (!String(entry.grade || '').trim()) {
        throw new Error('Enter a grade before saving marks.')
      }
      entry = { ...entry, marks, max_marks: maxMarks, semester, grade: entry.grade.trim() }
    }

    const records = collection === 'attendance' ? attendance : results
    const existing = entry.id
      ? records.find((record) => record.id === entry.id &&
          (record.courses?.id === entry.course_id || record.course_id === entry.course_id))
      : records.find((record) => record.student_id === entry.student_id &&
          (record.courses?.id === entry.course_id || record.course_id === entry.course_id) &&
          (collection !== 'results' || Number(record.semester) === Number(entry.semester)))

    const course = courses.find((item) => item.id === entry.course_id)
    if (collection === 'results' && Number(entry.marks) > Number(entry.max_marks)) {
      throw new Error('Marks cannot exceed the maximum marks.')
    }
    const nextRecord = {
      ...existing,
      ...entry,
      id: existing?.id || (user.user_metadata?.demo_mode ? crypto.randomUUID() : undefined),
      courses: course ? { id: course.id, code: course.code, name: course.name } : null,
    }
    delete nextRecord.course_id
    if (collection === 'attendance') nextRecord.updated_at = new Date().toISOString()
    else if (!existing) nextRecord.created_at = new Date().toISOString()

    if (user.user_metadata?.demo_mode) {
      const nextRecords = existing
        ? records.map((item) => item.id === existing.id ? nextRecord : item)
        : [nextRecord, ...records]
      saveDemoCollection(collection, nextRecords)
      if (collection === 'attendance') setAttendance(nextRecords)
      else setResults(nextRecords)
      return
    }

    if (!supabase) throw new Error('Supabase is not configured.')
    const values = collection === 'attendance'
      ? {
          student_id: entry.student_id,
          course_id: entry.course_id,
          attended: entry.attended,
          total: entry.total,
        }
      : {
          student_id: entry.student_id,
          course_id: entry.course_id,
          marks: entry.marks,
          max_marks: entry.max_marks,
          grade: entry.grade,
          semester: entry.semester,
        }

    const request = existing
      ? supabase.from(collection).update(values).eq('id', existing.id)
      : supabase.from(collection).insert(values)
    const { data, error } = await request
      .select(`id, student_id, ${collection === 'attendance' ? 'attended, total' : 'marks, max_marks, grade, semester'}, courses (id, code, name)`)
      .single()
    if (error) throw error

    const saved = {
      ...data,
      ...(collection === 'attendance' ? { percentage: attendancePercentage(data) } : {}),
      student_name: students.find((student) => student.id === data.student_id)?.full_name || '',
    }
    const nextRecords = existing
      ? records.map((item) => item.id === existing.id ? saved : item)
      : [saved, ...records]
    if (collection === 'attendance') setAttendance(nextRecords)
    else setResults(nextRecords)
  }

  async function saveTeacherAssignment(assignment) {
    if (userRole !== 'teacher') throw new Error('Only teachers can manage their subject assignments.')
    const assignedCourseIds = teacherAssignedCourseIds()
    const courseId = assignment.courses?.id || assignment.course_id
    if (!assignedCourseIds.has(courseId)) {
      throw new Error('You can only manage assignments for subjects assigned to your account.')
    }

    if (!assignment.title?.trim()) throw new Error('Assignment title is required.')
    if (assignment.title.trim().length > 160) throw new Error('Assignment title must be 160 characters or less.')
    if (!['Low', 'Medium', 'High'].includes(assignment.priority || 'Medium')) {
      throw new Error('Choose a valid assignment priority.')
    }

    if (user.user_metadata?.demo_mode) {
      const stored = getDemoDashboardData(user).assignments
      const course = courses.find((item) => item.id === courseId)
      const saved = {
        ...assignment,
        id: assignment.id || crypto.randomUUID(),
        course_id: courseId,
        due_date: assignment.due_date || '',
        courses: course ? { id: course.id, code: course.code, name: course.name } : assignment.courses,
      }
      const completeList = assignment.id
        ? stored.map((item) => item.id === assignment.id ? saved : item)
        : [saved, ...stored]
      saveDemoCollection('assignments', completeList)
      setAssignments(completeList.filter((item) => assignedCourseIds.has(item.courses?.id || item.course_id)))
      return
    }

    if (!supabase) throw new Error('Supabase is not configured.')
    const table = supabase.from('assignments')
    const values = {
      course_id: courseId,
      title: assignment.title.trim(),
      description: assignment.description?.trim() || null,
      due_date: assignment.due_date || null,
      priority: assignment.priority || 'Medium',
    }
    const selectFields = 'id, title, description, due_date, priority, courses (id, code, name)'
    const request = assignment.id
      ? table.update(values).eq('id', assignment.id)
      : table.insert(values)
    const { data, error } = await request.select(selectFields).single()
    if (error) throw error
    setAssignments((previous) => assignment.id
      ? previous.map((item) => item.id === assignment.id ? data : item)
      : [data, ...previous])
  }

  async function deleteTeacherAssignment(assignmentId) {
    if (userRole !== 'teacher') throw new Error('Only teachers can manage their subject assignments.')
    const assignment = assignments.find((item) => item.id === assignmentId)
    const courseId = assignment?.courses?.id || assignment?.course_id
    if (!assignment || !teacherAssignedCourseIds().has(courseId)) {
      throw new Error('This assignment is outside your assigned subjects.')
    }
    if (user.user_metadata?.demo_mode) {
      const stored = getDemoDashboardData(user).assignments
      const remaining = stored.filter((item) => item.id !== assignmentId)
      saveDemoCollection('assignments', remaining)
      setAssignments((previous) => previous.filter((item) => item.id !== assignmentId))
      return
    }
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('assignments')
      .delete()
      .eq('id', assignmentId)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Assignment was not deleted. Check the database role and policies.')
    setAssignments((previous) => previous.filter((item) => item.id !== assignmentId))
  }

  async function handleProfileSave(updates) {
    const nextProfile = { ...profile, ...updates }
    if (user.user_metadata?.demo_mode || user.id === 'demo-admin-1' || user.id === 'demo-user-1') {
      setProfile(nextProfile)
      saveDemoProfile(nextProfile)
      return
    }

    if (!supabase) {
      throw new Error('Profile updates require a configured database.')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name,
        phone: updates.phone,
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) throw error
    setProfile(data)
  }

  // =========================
  // LOGOUT
  // =========================

  async function handleLogout() {
    try {
      if (!isSupabaseConfigured || !supabase || user.user_metadata?.demo_mode) {
        logoutDemoUser()
      } else {
        await supabase.auth.signOut()
      }

      setUser(null)
      setUserRole('user')
      setRoleResolved(true)
      setProfile(null)
      setCourses([])
      setAssignments([])
      setAttendance([])
      setAttendanceSessions([])
      setResults([])
      setTimetable([])
      setStudents([])
      setFees([])
      setEnrollments([])
      setTeachers([])
      setTeacherSubjects([])
      setActive('dashboard')
    } catch (error) {
      console.error(
        'Logout error:',
        error
      )
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>

        <p>
          Loading Student Portal...
        </p>
      </div>
    )
  }

  // =========================
  // LOGIN
  // =========================

  if (!user) {
    return <Auth onLogin={handleUserLogin} />
  }

  if (user.app_metadata?.force_password_change) {
    return <ForcedPasswordChange onSubmit={completeForcedPasswordChange} />
  }

  // =========================
  // STUDENT INFORMATION
  // =========================

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (userRole === 'admin' ? 'Admin User' : userRole === 'teacher' ? 'Teacher' : 'Student')

  const studentId =
    profile?.student_id || profile?.teacher_id || (userRole === 'teacher' ? user.email : 'N/A')

  const studentCourse =
    profile?.course || 'BCA'

  const studentSemester =
    profile?.semester || '—'

  // =========================
  // ATTENDANCE
  // =========================

  const averageAttendance =
    attendance.length > 0
      ? Math.round(
          attendance.reduce(
            (sum, item) =>
              sum +
              attendancePercentage(item),
            0
          ) / attendance.length
        )
      : 0

  // =========================
  // ASSIGNMENTS
  // =========================

  const pendingAssignments =
    assignments.length

  // =========================
  // PAGE RENDER
  // =========================

  function renderPage() {
    if (userRole === 'teacher' && active !== 'profile') {
      return (
        <Suspense fallback={<div className="app-loading"><div className="loading-spinner" /><p>Loading teacher workspace...</p></div>}>
          <TeacherWorkspace
            courses={courses}
            students={students}
            enrollments={enrollments}
            attendanceSessions={attendanceSessions}
            results={results}
            assignments={assignments}
            timetable={timetable}
            user={user}
            onSaveAttendanceSession={saveTeacherAttendanceSession}
            onSaveResult={(entry) => saveTeacherEntry('results', entry)}
            onSaveAssignment={saveTeacherAssignment}
            onDeleteAssignment={deleteTeacherAssignment}
          />
        </Suspense>
      )
    }
    if (userRole === 'admin' && active !== 'profile') {
      return (
        <Suspense fallback={<div className="app-loading"><div className="loading-spinner" /><p>Loading administration workspace...</p></div>}>
          <AdminDashboard
            section={active}
            setActive={setActive}
            students={students}
            courses={courses}
            assignments={assignments}
            attendance={attendance}
            results={results}
            timetable={timetable}
            fees={fees}
            enrollments={enrollments}
            teachers={teachers}
            teacherSubjects={teacherSubjects}
            onStudentsChange={updateCollection('students', setStudents, students)}
            onCoursesChange={updateCollection('courses', setCourses, courses)}
            onAssignmentsChange={updateCollection('assignments', setAssignments, assignments)}
            onAttendanceChange={updateCollection('attendance', setAttendance, attendance)}
            onResultsChange={updateCollection('results', setResults, results)}
            onTimetableChange={updateCollection('timetable', setTimetable, timetable)}
            onFeesChange={updateCollection('fees', setFees, fees)}
            onEnrollmentsChange={updateCollection('enrollments', setEnrollments, enrollments)}
            onTeacherSubjectsChange={updateCollection('teacherSubjects', setTeacherSubjects, teacherSubjects)}
            isDemoAccount={user.id === 'demo-admin-1'}
            isLiveAdmin={userRole === 'admin' && !user.user_metadata?.demo_mode && user.id !== 'demo-admin-1'}
            onCreateTeacher={createTeacherAccount}
            onDisableTeacher={disableTeacherAccount}
          />
        </Suspense>
      )
    }

    switch (active) {
      case 'dashboard':
        return (
          <Dashboard
            studentName={studentName}
            studentId={studentId}
            studentCourse={studentCourse}
            studentSemester={studentSemester}
            studentSection={profile?.section}
            studentYearLevel={profile?.year_level}
            academicYear={profile?.academic_year}
            courses={courses}
            assignments={assignments}
            attendance={attendance}
            averageAttendance={averageAttendance}
            pendingAssignments={pendingAssignments}
            setActive={setActive}
            isAdmin={userRole === 'admin'}
          />
        )

      case 'courses':
        return (
          <Courses
            courses={courses}
          />
        )

      case 'attendance':
        return (
          <Attendance
            attendance={attendance}
          />
        )

      case 'assignments':
        return (
          <Assignments
            assignments={assignments}
          />
        )

      case 'results':
        return (
          <Results
            results={results}
            studentSemester={studentSemester}
          />
        )

      case 'timetable':
        return (
          <Timetable
            timetable={timetable}
            studentSemester={studentSemester}
          />
        )

      case 'fees':
        return <Fees fees={fees} user={user} profile={profile} />

      case 'profile':
        return (
          <Profile
            profile={profile}
            user={user}
            accountRole={userRole}
            assignedSubjects={courses}
            onSave={handleProfileSave}
            allowAddress={Boolean(user.user_metadata?.demo_mode)}
          />
        )

      default:
        return (
          <Dashboard
            studentName={studentName}
            studentId={studentId}
            studentCourse={studentCourse}
            studentSemester={studentSemester}
            courses={courses}
            assignments={assignments}
            attendance={attendance}
            averageAttendance={averageAttendance}
            pendingAssignments={pendingAssignments}
            setActive={setActive}
            isAdmin={userRole === 'admin'}
          />
        )
    }
  }

  // =========================
  // MAIN APPLICATION
  // =========================

  return (
    <div className="student-app">

      <Sidebar
        active={userRole === 'teacher' && active !== 'profile' ? 'teacher-workspace' : active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        studentName={studentName}
        studentId={studentId}
        onLogout={handleLogout}
        userRole={userRole}
        accountRole={userRole}
      />

      <div className="main-wrapper">

        <Header
          studentName={studentName}
          profile={profile}
          accountRole={userRole}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="main-content">
          {loadError && <div className="app-data-error" role="alert">{loadError}</div>}
          {renderPage()}
        </main>

      </div>

    </div>
  )
}

export default App