import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './AttendanceAdmin.css'

export default function AttendanceAdmin() {
  const [attendance, setAttendance] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])

  const [selectedStudent, setSelectedStudent] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        studentsResponse,
        coursesResponse,
        attendanceResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, student_id, full_name, email')
          .eq('role', 'student')
          .order('full_name'),

        supabase
          .from('courses')
          .select('id, code, name')
          .order('code'),

        supabase
          .from('attendance')
          .select(`
            id,
            student_id,
            course_id,
            attended,
            total,
            profiles (
              id,
              student_id,
              full_name
            ),
            courses (
              id,
              code,
              name
            )
          `)
          .order('updated_at', {
            ascending: false,
          }),
      ])

      if (studentsResponse.error) {
        throw studentsResponse.error
      }

      if (coursesResponse.error) {
        throw coursesResponse.error
      }

      if (attendanceResponse.error) {
        throw attendanceResponse.error
      }

      setStudents(studentsResponse.data || [])
      setCourses(coursesResponse.data || [])
      setAttendance(attendanceResponse.data || [])
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Attendance data load nahi ho paaya.'
      )
    } finally {
      setLoading(false)
    }
  }

  function updateAttendanceValue(id, field, value) {
    setAttendance((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: Math.max(
                0,
                Number(value) || 0
              ),
            }
          : item
      )
    )
  }

  async function saveAttendance(item) {
    const attended = Number(item.attended) || 0
    const total = Number(item.total) || 0

    if (attended > total) {
      setError(
        'Attended classes total classes se zyada nahi ho sakti.'
      )
      return
    }

    try {
      setSavingId(item.id)
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('attendance')
        .update({
          attended,
          total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (error) throw error

      setMessage(
        `${item.profiles?.full_name || 'Student'} ki attendance updated.`
      )

      await loadData()
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Attendance update nahi ho paayi.'
      )
    } finally {
      setSavingId(null)
    }
  }

  const filteredAttendance = attendance.filter((item) => {
    const studentMatch =
      selectedStudent === 'all' ||
      item.student_id === selectedStudent

    const courseMatch =
      selectedCourse === 'all' ||
      item.course_id === selectedCourse

    return studentMatch && courseMatch
  })

  return (
    <div className="attendance-admin-page">

      <div className="attendance-admin-header">
        <div>
          <span className="attendance-admin-badge">
            ADMIN
          </span>

          <h1>Attendance Management</h1>

          <p>
            View and update student attendance records.
          </p>
        </div>

        <button
          type="button"
          className="attendance-refresh-btn"
          onClick={loadData}
        >
          ↻ Refresh
        </button>
      </div>


      {error && (
        <div className="attendance-alert attendance-error">
          {error}
        </div>
      )}

      {message && (
        <div className="attendance-alert attendance-success">
          {message}
        </div>
      )}


      <div className="attendance-filters">

        <div className="attendance-filter">
          <label>Student</label>

          <select
            value={selectedStudent}
            onChange={(e) =>
              setSelectedStudent(e.target.value)
            }
          >
            <option value="all">
              All Students
            </option>

            {students.map((student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.full_name}
              </option>
            ))}
          </select>
        </div>


        <div className="attendance-filter">
          <label>Course</label>

          <select
            value={selectedCourse}
            onChange={(e) =>
              setSelectedCourse(e.target.value)
            }
          >
            <option value="all">
              All Courses
            </option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>


        <div className="attendance-total">
          <span>Records</span>
          <strong>{filteredAttendance.length}</strong>
        </div>

      </div>


      {loading ? (
        <div className="attendance-loading">
          Loading attendance...
        </div>
      ) : (
        <div className="attendance-admin-card">

          <div className="attendance-table-wrapper">

            <table className="attendance-admin-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Attended</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="attendance-empty"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((item) => {

                    const percentage =
                      item.total > 0
                        ? Math.round(
                            (Number(item.attended) /
                              Number(item.total)) *
                              100
                          )
                        : 0

                    return (
                      <tr key={item.id}>

                        <td>
                          <div className="attendance-student">

                            <div className="attendance-avatar">
                              {item.profiles?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || 'S'}
                            </div>

                            <div>
                              <strong>
                                {item.profiles?.full_name ||
                                  'Student'}
                              </strong>

                              <span>
                                {item.profiles?.student_id ||
                                  'N/A'}
                              </span>
                            </div>

                          </div>
                        </td>


                        <td>
                          <div className="attendance-course">
                            <strong>
                              {item.courses?.code}
                            </strong>

                            <span>
                              {item.courses?.name}
                            </span>
                          </div>
                        </td>


                        <td>
                          <input
                            className="attendance-number-input"
                            type="number"
                            min="0"
                            value={item.attended}
                            onChange={(e) =>
                              updateAttendanceValue(
                                item.id,
                                'attended',
                                e.target.value
                              )
                            }
                          />
                        </td>


                        <td>
                          <input
                            className="attendance-number-input"
                            type="number"
                            min="0"
                            value={item.total}
                            onChange={(e) =>
                              updateAttendanceValue(
                                item.id,
                                'total',
                                e.target.value
                              )
                            }
                          />
                        </td>


                        <td>
                          <span
                            className={
                              percentage >= 75
                                ? 'attendance-good'
                                : 'attendance-low'
                            }
                          >
                            {percentage}%
                          </span>
                        </td>


                        <td>
                          <button
                            type="button"
                            className="attendance-save-btn"
                            disabled={
                              savingId === item.id
                            }
                            onClick={() =>
                              saveAttendance(item)
                            }
                          >
                            {savingId === item.id
                              ? 'Saving...'
                              : 'Save'}
                          </button>
                        </td>

                      </tr>
                    )
                  })
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}