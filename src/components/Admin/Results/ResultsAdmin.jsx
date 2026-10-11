import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './ResultsAdmin.css'

export default function ResultsAdmin() {
  const [results, setResults] = useState([])
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

      const [studentsResponse, coursesResponse, resultsResponse] =
        await Promise.all([
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
            .from('results')
            .select(`
              id,
              student_id,
              course_id,
              marks,
              max_marks,
              grade,
              semester,
              created_at,
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
            .order('created_at', { ascending: false }),
        ])

      if (studentsResponse.error) {
        throw studentsResponse.error
      }

      if (coursesResponse.error) {
        throw coursesResponse.error
      }

      if (resultsResponse.error) {
        throw resultsResponse.error
      }

      setStudents(studentsResponse.data || [])
      setCourses(coursesResponse.data || [])
      setResults(resultsResponse.data || [])
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Results load nahi ho paaye.'
      )
    } finally {
      setLoading(false)
    }
  }

  function updateResult(id, field, value) {
    setResults((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  function calculateGrade(marks, maxMarks) {
    const percentage =
      Number(maxMarks) > 0
        ? (Number(marks) / Number(maxMarks)) * 100
        : 0

    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'F'
  }

  async function saveResult(item) {
    const marks = Number(item.marks) || 0
    const maxMarks = Number(item.max_marks) || 0

    if (maxMarks <= 0) {
      setError('Maximum marks 0 se greater hone chahiye.')
      return
    }

    if (marks < 0 || marks > maxMarks) {
      setError(
        'Marks maximum marks se zyada nahi ho sakte.'
      )
      return
    }

    const grade = calculateGrade(marks, maxMarks)

    try {
      setSavingId(item.id)
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('results')
        .update({
          marks,
          max_marks: maxMarks,
          grade,
        })
        .eq('id', item.id)

      if (error) throw error

      setMessage(
        `${item.profiles?.full_name || 'Student'} ka result updated.`
      )

      await loadData()
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Result update nahi ho paaya.'
      )
    } finally {
      setSavingId(null)
    }
  }

  const filteredResults = results.filter((item) => {
    const studentMatch =
      selectedStudent === 'all' ||
      item.student_id === selectedStudent

    const courseMatch =
      selectedCourse === 'all' ||
      item.course_id === selectedCourse

    return studentMatch && courseMatch
  })

  return (
    <div className="results-admin-page">

      <div className="results-admin-header">
        <div>
          <span className="results-admin-badge">
            ADMIN
          </span>

          <h1>Results Management</h1>

          <p>
            View and update student marks and grades.
          </p>
        </div>

        <button
          type="button"
          className="results-refresh-btn"
          onClick={loadData}
        >
          ↻ Refresh
        </button>
      </div>


      {error && (
        <div className="results-alert results-error">
          {error}
        </div>
      )}

      {message && (
        <div className="results-alert results-success">
          {message}
        </div>
      )}


      <div className="results-filters">

        <div className="results-filter">
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


        <div className="results-filter">
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


        <div className="results-total">
          <span>Records</span>
          <strong>{filteredResults.length}</strong>
        </div>

      </div>


      {loading ? (
        <div className="results-loading">
          Loading results...
        </div>
      ) : (
        <div className="results-admin-card">

          <div className="results-table-wrapper">

            <table className="results-admin-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Marks</th>
                  <th>Maximum</th>
                  <th>Grade</th>
                  <th>Semester</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="results-empty"
                    >
                      No result records found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item) => (
                    <tr key={item.id}>

                      <td>
                        <div className="result-student">

                          <div className="result-avatar">
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
                        <div className="result-course">
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
                          className="result-number-input"
                          type="number"
                          min="0"
                          value={item.marks}
                          onChange={(e) =>
                            updateResult(
                              item.id,
                              'marks',
                              e.target.value
                            )
                          }
                        />
                      </td>


                      <td>
                        <input
                          className="result-number-input"
                          type="number"
                          min="1"
                          value={item.max_marks}
                          onChange={(e) =>
                            updateResult(
                              item.id,
                              'max_marks',
                              e.target.value
                            )
                          }
                        />
                      </td>


                      <td>
                        <span className="result-grade">
                          {calculateGrade(
                            item.marks,
                            item.max_marks
                          )}
                        </span>
                      </td>


                      <td>
                        Semester {item.semester || '-'}
                      </td>


                      <td>
                        <button
                          type="button"
                          className="result-save-btn"
                          disabled={
                            savingId === item.id
                          }
                          onClick={() =>
                            saveResult(item)
                          }
                        >
                          {savingId === item.id
                            ? 'Saving...'
                            : 'Save'}
                        </button>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}