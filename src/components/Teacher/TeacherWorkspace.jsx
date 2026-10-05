import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getDemoCollection, saveDemoCollection } from '../../lib/demoData'
import './TeacherWorkspace.css'

function requireCourseUuid(courseId) {
  const id = courseId && typeof courseId === 'object' ? courseId.id : courseId
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Selected subject is not a valid database course. Refresh the page and select an assigned subject.')
  }
  return id
}

function requireStudentUuid(student) {
  const id = student && typeof student === 'object' ? student.id : student
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid student ID. Refresh the page and try again.')
  }
  return id
}

const UNASSIGNED_COHORT_VALUE = '__unassigned__'

function cohortFilterValue(value) {
  return value == null || value === '' ? UNASSIGNED_COHORT_VALUE : String(value)
}

export default function TeacherWorkspace({
  courses = [],
  students = [],
  enrollments = [],
  attendanceSessions = [],
  onSaveAttendanceSession,
  user,
}) {
  const [courseId, setCourseId] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [yearLevelFilter, setYearLevelFilter] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [attendance, setAttendance] = useState({})
  const [marks, setMarks] = useState({})

  const [assessmentName, setAssessmentName] = useState('Daily Test')
  const [maxMarks, setMaxMarks] = useState(20)
  const [lectureNumber, setLectureNumber] = useState(1)
  const [sessionType, setSessionType] = useState('theory')

  const [activeTab, setActiveTab] = useState('attendance')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const currentCourse = useMemo(
    () => courses.find((course) => course.id === courseId),
    [courses, courseId]
  )

  const courseStudents = useMemo(
    () =>
      students.filter((student) =>
        enrollments.some(
          (enrollment) =>
            enrollment.student_id === student.id &&
            enrollment.course_id === courseId
        )
      ),
    [students, enrollments, courseId]
  )

  const cohortOptions = useMemo(() => ({
    sections: [...new Set(courseStudents.map((student) => cohortFilterValue(student.section)))],
    semesters: [...new Set(courseStudents.map((student) => cohortFilterValue(student.semester)))],
    yearLevels: [...new Set(courseStudents.map((student) => cohortFilterValue(student.year_level)))],
    academicYears: [...new Set(courseStudents.map((student) => cohortFilterValue(student.academic_year)))],
  }), [courseStudents])
  const cohortReady = Boolean(sectionFilter && semesterFilter && yearLevelFilter && academicYearFilter)
  const selectedCohort = {
    section: sectionFilter === UNASSIGNED_COHORT_VALUE ? '' : sectionFilter,
    semester: sectionFilter ? Number(semesterFilter === UNASSIGNED_COHORT_VALUE ? 0 : semesterFilter) : null,
    year_level: yearLevelFilter === UNASSIGNED_COHORT_VALUE ? 0 : Number(yearLevelFilter),
    academic_year: academicYearFilter === UNASSIGNED_COHORT_VALUE ? '' : academicYearFilter,
  }
  const visibleStudents = useMemo(() => cohortReady
    ? courseStudents.filter((student) =>
      cohortFilterValue(student.section) === sectionFilter &&
      cohortFilterValue(student.semester) === semesterFilter &&
      cohortFilterValue(student.year_level) === yearLevelFilter &&
      cohortFilterValue(student.academic_year) === academicYearFilter,
    )
    : [], [courseStudents, cohortReady, sectionFilter, semesterFilter, yearLevelFilter, academicYearFilter])

  function resetCohortFilters() {
    setSectionFilter('')
    setSemesterFilter('')
    setYearLevelFilter('')
    setAcademicYearFilter('')
  }

  useEffect(() => {
    if (courses.length > 0 && !courses.some((course) => course.id === courseId)) {
      setCourseId(courses[0].id)
    }
  }, [courses, courseId])

  const loadDailyData = useCallback(async () => {
    if (!currentCourse) return

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const attendanceDefaults = {}
      const marksDefaults = {}

      visibleStudents.forEach((student) => {
        attendanceDefaults[student.id] = 'present'
        marksDefaults[student.id] = ''
      })

      setAttendance(attendanceDefaults)
      setMarks(marksDefaults)

      if (user?.user_metadata?.demo_mode) {
        const savedSession = getDemoCollection('attendanceSessions').find((session) =>
          session.course_id === currentCourse.id &&
          String(session.section || '') === selectedCohort.section &&
          Number(session.semester || 0) === selectedCohort.semester &&
          Number(session.year_level || 0) === selectedCohort.year_level &&
          String(session.academic_year || '') === selectedCohort.academic_year &&
          session.held_on === date &&
          Number(session.lecture_number) === Number(lectureNumber) &&
          session.session_type === sessionType,
        )
        const savedAttendance = savedSession?.records || []
        const savedMarks = getDemoCollection('teacherDailyMarks')
          .filter((record) =>
            record.course_id === currentCourse.id &&
            record.assessment_name === assessmentName.trim() &&
            record.assessment_date === date
          )
        savedAttendance.forEach((record) => {
          attendanceDefaults[record.student_id] = record.status
        })
        savedMarks.forEach((record) => {
          marksDefaults[record.student_id] = record.marks
        })
        setAttendance(attendanceDefaults)
        setMarks(marksDefaults)
        return
      }

      const selectedCourseId = requireCourseUuid(currentCourse.id)
      const [
        marksResponse,
      ] = await Promise.all([
        supabase
          .from('assessment_marks')
          .select('student_id, marks')
          .eq('course_id', selectedCourseId)
          .eq('assessment_name', assessmentName.trim())
          .eq('assessment_date', date),
      ])

      if (marksResponse.error) {
        throw marksResponse.error
      }

      const savedAttendance = {
        ...attendanceDefaults,
      }

      const savedMarks = {
        ...marksDefaults,
      }

      ;(marksResponse.data || []).forEach((item) => {
        savedMarks[item.student_id] = item.marks
      })

      const savedSession = attendanceSessions.find((session) =>
        session.course_id === selectedCourseId &&
        String(session.section || '') === selectedCohort.section &&
        Number(session.semester || 0) === selectedCohort.semester &&
        Number(session.year_level || 0) === selectedCohort.year_level &&
        String(session.academic_year || '') === selectedCohort.academic_year &&
        session.held_on === date &&
        Number(session.lecture_number) === Number(lectureNumber) &&
        session.session_type === sessionType,
      )
      ;(savedSession?.records || []).forEach((item) => {
        savedAttendance[item.student_id] = item.status
      })

      setAttendance(savedAttendance)
      setMarks(savedMarks)
    } catch (err) {
      console.error('Daily data error:', err)
      setError(err.message || 'Daily data load nahi ho paaya.')
    } finally {
      setLoading(false)
    }
  }, [
    currentCourse,
    visibleStudents,
    user,
    selectedCohort.section,
    selectedCohort.semester,
    selectedCohort.year_level,
    selectedCohort.academic_year,
    date,
    assessmentName,
    lectureNumber,
    sessionType,
    attendanceSessions,
  ])

  useEffect(() => {
    if (currentCourse && cohortReady) {
      loadDailyData()
    }
  }, [currentCourse, cohortReady, loadDailyData])

  function changeAttendance(studentId, status) {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }))
  }

  function changeMarks(studentId, value) {
    setMarks((previous) => ({
      ...previous,
      [studentId]: value,
    }))
  }

  async function saveAttendance() {
    if (!currentCourse || !user?.id) return

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const records = visibleStudents.map((student) => ({
        student_id: student.id,
        status: attendance[student.id],
      }))

      if (records.some((record) => !['present', 'absent'].includes(record.status))) {
        throw new Error('Mark every student present or absent before saving attendance.')
      }
      if (!records.length) {
        throw new Error('Is subject mein koi enrolled student nahi hai.')
      }

      if (user.user_metadata?.demo_mode) {
        const existingSessions = getDemoCollection('attendanceSessions')
        const nextSession = {
          id: crypto.randomUUID(),
          course_id: currentCourse.id,
          teacher_id: user.id,
          ...selectedCohort,
          lecture_number: Number(lectureNumber),
          session_type: sessionType,
          held_on: date,
          records,
        }
        const sessionKey = `${currentCourse.id}:${selectedCohort.section}:${selectedCohort.semester}:${selectedCohort.year_level}:${selectedCohort.academic_year}:${lectureNumber}:${sessionType}:${date}`
        saveDemoCollection('attendanceSessions', [
          ...existingSessions.filter((session) =>
            `${session.course_id}:${session.section || ''}:${session.semester || 0}:${session.year_level || 0}:${session.academic_year || ''}:${session.lecture_number}:${session.session_type}:${session.held_on}` !== sessionKey,
          ),
          nextSession,
        ])
        setMessage(`Attendance successfully saved for ${date}.`)
        return
      }

      if (!onSaveAttendanceSession) {
        throw new Error('Class attendance service is unavailable. Refresh the page and try again.')
      }
      const courseUuid = requireCourseUuid(currentCourse.id)
      const rpcRecords = visibleStudents.map((student) => ({
        student_id: requireStudentUuid(student),
        status: attendance[student.id],
      }))
      await onSaveAttendanceSession({
        course_id: courseUuid,
        ...selectedCohort,
        lecture_number: Number(lectureNumber),
        session_type: sessionType,
        held_on: date,
        records: rpcRecords,
      })

      setMessage(
        `Attendance successfully saved for ${date}.`
      )
    } catch (err) {
      console.error('Attendance save error:', err)
      setError(
        err.message || 'Attendance save nahi ho paayi.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveMarks() {
    if (!currentCourse || !user?.id) return

    if (!assessmentName.trim()) {
      setError('Assessment name enter karo.')
      return
    }

    const maximum = Number(maxMarks)

    if (!Number.isFinite(maximum) || maximum <= 0) {
      setError('Maximum marks valid hone chahiye.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const records = visibleStudents
        .filter(
          (student) =>
            marks[student.id] !== '' &&
            marks[student.id] !== null &&
            marks[student.id] !== undefined
        )
        .map((student) => ({
          student_id: student.id,
          course_id: currentCourse.id,
          assessment_name: assessmentName.trim(),
          assessment_date: date,
          marks: Number(marks[student.id]),
          max_marks: maximum,
          marked_by: user.id,
        }))

      if (!records.length) {
        throw new Error(
          'Kam se kam ek student ke marks enter karo.'
        )
      }

      const invalidMarks = records.some(
        (record) =>
          !Number.isFinite(record.marks) ||
          record.marks < 0 ||
          record.marks > record.max_marks
      )

      if (invalidMarks) {
        throw new Error(
          'Marks 0 se maximum marks ke beech hone chahiye.'
        )
      }

      if (user.user_metadata?.demo_mode) {
        const savedRecords = getDemoCollection('teacherDailyMarks')
        const recordKeys = new Set(records.map((record) =>
          `${record.student_id}:${record.course_id}:${record.assessment_name}:${record.assessment_date}`,
        ))
        const nextRecords = [
          ...savedRecords.filter((record) =>
            !recordKeys.has(`${record.student_id}:${record.course_id}:${record.assessment_name}:${record.assessment_date}`),
          ),
          ...records,
        ]
        saveDemoCollection('teacherDailyMarks', nextRecords)
        setMessage(`Marks successfully saved for ${assessmentName}.`)
        return
      }

      const selectedCourseId = requireCourseUuid(currentCourse.id)
      const { error: saveError } = await supabase
        .from('assessment_marks')
        .upsert(records.map((record) => ({ ...record, course_id: selectedCourseId })), {
          onConflict:
            'student_id,course_id,assessment_name,assessment_date',
        })

      if (saveError) throw saveError

      setMessage(
        `Marks successfully saved for ${assessmentName}.`
      )
    } catch (err) {
      console.error('Marks save error:', err)
      setError(
        err.message || 'Marks save nahi ho paaye.'
      )
    } finally {
      setSaving(false)
    }
  }

  const presentCount = visibleStudents.filter(
    (student) =>
      attendance[student.id] === 'present'
  ).length

  const absentCount =
    visibleStudents.length - presentCount

  return (
    <section className="teacher-workspace">

      {/* Header */}
      <div className="teacher-workspace-header">
        <div>
          <p className="teacher-eyebrow">
            FACULTY WORKSPACE
          </p>

          <h1>Teacher Dashboard</h1>

          <p>
            Manage daily attendance and marks for your
            assigned subjects.
          </p>
        </div>

        <div className="teacher-login-id">
          Teacher · {user?.email || user?.id}
        </div>
      </div>

      {/* Controls */}
      <div className="teacher-control-card">

        <label>
          <span>Assigned Subject</span>

          <select
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value)
              resetCohortFilters()
              setMessage('')
              setError('')
            }}
          >
            <option value="">
              Select subject
            </option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.code} — {course.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Date</span>

          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setMessage('')
              setError('')
            }}
          />
        </label>

        <label>
          <span>Lecture number</span>
          <input min="1" step="1" type="number" value={lectureNumber} onChange={(event) => setLectureNumber(Number(event.target.value))} />
        </label>

        <label>
          <span>Session type</span>
          <select value={sessionType} onChange={(event) => setSessionType(event.target.value)}>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
        </label>

      </div>

      {currentCourse && (
        <div className="teacher-control-card">
          <label>
            <span>Section</span>
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="">Select section</option>
              {cohortOptions.sections.map((value) => (
                <option key={value} value={value}>{value === UNASSIGNED_COHORT_VALUE ? 'Unassigned' : value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Semester</span>
            <select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
              <option value="">Select semester</option>
              {cohortOptions.semesters.map((value) => (
                <option key={value} value={value}>{value === UNASSIGNED_COHORT_VALUE ? 'Unassigned' : value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Year</span>
            <select value={yearLevelFilter} onChange={(event) => setYearLevelFilter(event.target.value)}>
              <option value="">Select year</option>
              {cohortOptions.yearLevels.map((value) => (
                <option key={value} value={value}>{value === UNASSIGNED_COHORT_VALUE ? 'Unassigned' : value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Academic year</span>
            <select value={academicYearFilter} onChange={(event) => setAcademicYearFilter(event.target.value)}>
              <option value="">Select academic year</option>
              {cohortOptions.academicYears.map((value) => (
                <option key={value} value={value}>{value === UNASSIGNED_COHORT_VALUE ? 'Unassigned' : value}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Subject Info */}
      {currentCourse && (
        <div className="teacher-subject-card">

          <div>
            <span>Current Subject</span>

            <h2>
              {currentCourse.name}
            </h2>

            <p>
              {currentCourse.code}
            </p>
          </div>

          <div className="teacher-subject-stats">

            <div>
              <strong>
                {visibleStudents.length}
              </strong>
              <span>Students</span>
            </div>

            <div>
              <strong>
                {presentCount}
              </strong>
              <span>Present</span>
            </div>

            <div>
              <strong>
                {absentCount}
              </strong>
              <span>Absent</span>
            </div>

          </div>

        </div>
      )}

      {/* Tabs */}
      <div className="teacher-tabs">

        <button
          type="button"
          className={
            activeTab === 'attendance'
              ? 'active'
              : ''
          }
          onClick={() => setActiveTab('attendance')}
        >
          📅 Daily Attendance
        </button>

        <button
          type="button"
          className={
            activeTab === 'marks'
              ? 'active'
              : ''
          }
          onClick={() => setActiveTab('marks')}
        >
          📝 Daily Marks
        </button>

      </div>

      {/* Messages */}
      {message && (
        <div className="teacher-notice success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="teacher-notice error">
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && currentCourse && cohortReady ? (
        <div className="teacher-empty">
          Loading daily data...
        </div>
      ) : !courses.length ? (
        <div className="teacher-empty">
          <h2>No Subject Assigned</h2>

          <p>
            Admin ne abhi aapko koi subject assign nahi
            kiya hai.
          </p>
        </div>
      ) : !currentCourse ? (
        <div className="teacher-empty">
          <h2>Select a Subject</h2>
          <p>Choose an assigned subject to view its student cohorts.</p>
        </div>
      ) : !courseStudents.length ? (
        <div className="teacher-empty">
          <h2>No Students</h2>

          <p>
            Is subject mein abhi koi student enrolled nahi
            hai.
          </p>
        </div>
      ) : !cohortReady ? (
        <div className="teacher-empty">
          <h2>Select a Student Cohort</h2>
          <p>Choose section, semester, year, and academic year before viewing or recording class data.</p>
        </div>
      ) : !visibleStudents.length ? (
        <div className="teacher-empty">
          <h2>No Students in This Cohort</h2>
          <p>No students are enrolled in this subject for the selected academic cohort.</p>
        </div>
      ) : (
        <>
          {/* Attendance */}
          {activeTab === 'attendance' && (
            <div className="teacher-table-card">

              <div className="teacher-table-header">

                <div>
                  <h2>
                    Daily Attendance
                  </h2>

                  <p>
                    {currentCourse?.code} · {date}
                  </p>
                </div>

                <button
                  type="button"
                  className="teacher-save-btn"
                  onClick={saveAttendance}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Attendance'}
                </button>

              </div>

              <div className="teacher-table-wrapper">

                <table className="teacher-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>

                  <tbody>

                    {visibleStudents.map(
                      (student, index) => (
                        <tr key={student.id}>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <div className="teacher-student">
                              <div className="teacher-student-avatar">
                                {student.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {student.full_name}
                                </strong>

                                <span>
                                  {student.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {student.student_id || 'N/A'}
                          </td>

                          <td>
                            <div className="attendance-actions">

                              <button
                                type="button"
                                className={
                                  attendance[
                                    student.id
                                  ] === 'present'
                                    ? 'present active'
                                    : 'present'
                                }
                                onClick={() =>
                                  changeAttendance(
                                    student.id,
                                    'present'
                                  )
                                }
                              >
                                ✓ Present
                              </button>

                              <button
                                type="button"
                                className={
                                  attendance[
                                    student.id
                                  ] === 'absent'
                                    ? 'absent active'
                                    : 'absent'
                                }
                                onClick={() =>
                                  changeAttendance(
                                    student.id,
                                    'absent'
                                  )
                                }
                              >
                                ✕ Absent
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* Marks */}
          {activeTab === 'marks' && (
            <div className="teacher-table-card">

              <div className="marks-settings">

                <label>
                  <span>
                    Assessment Name
                  </span>

                  <input
                    type="text"
                    value={assessmentName}
                    onChange={(event) =>
                      setAssessmentName(
                        event.target.value
                      )
                    }
                    placeholder="Unit Test 1"
                  />
                </label>

                <label>
                  <span>
                    Maximum Marks
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={maxMarks}
                    onChange={(event) =>
                      setMaxMarks(
                        event.target.value
                      )
                    }
                  />
                </label>

              </div>

              <div className="teacher-table-header">

                <div>
                  <h2>
                    Daily Marks
                  </h2>

                  <p>
                    {currentCourse?.code} · {date}
                  </p>
                </div>

                <button
                  type="button"
                  className="teacher-save-btn"
                  onClick={saveMarks}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Marks'}
                </button>

              </div>

              <div className="teacher-table-wrapper">

                <table className="teacher-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Marks / {maxMarks}</th>
                    </tr>
                  </thead>

                  <tbody>

                    {visibleStudents.map(
                      (student, index) => (
                        <tr key={student.id}>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <div className="teacher-student">
                              <div className="teacher-student-avatar">
                                {student.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {student.full_name}
                                </strong>

                                <span>
                                  {student.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {student.student_id || 'N/A'}
                          </td>

                          <td>
                            <input
                              className="teacher-marks-input"
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={
                                marks[student.id] ?? ''
                              }
                              onChange={(event) =>
                                changeMarks(
                                  student.id,
                                  event.target.value
                                )
                              }
                              placeholder="Enter marks"
                            />
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}
        </>
      )}

    </section>
  )
}