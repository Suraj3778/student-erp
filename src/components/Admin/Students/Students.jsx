import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './Students.css'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          student_id,
          full_name,
          email,
          phone,
          course,
          semester,
          department,
          university,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setStudents(data || [])
    } catch (err) {
      console.error('Students error:', err)
      setError(err.message || 'Students load nahi ho paaye.')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const value = search.toLowerCase()

    return (
      student.full_name?.toLowerCase().includes(value) ||
      student.email?.toLowerCase().includes(value) ||
      student.student_id?.toLowerCase().includes(value)
    )
  })

  return (
    <div className="students-page">

      <div className="students-top">
        <div>
          <span className="students-badge">ADMIN</span>
          <h1>Students</h1>
          <p>View and manage registered students.</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={loadStudents}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="students-toolbar">

        <div className="students-count">
          <strong>{students.length}</strong>
          <span>Total Students</span>
        </div>

        <div className="students-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search student, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </div>

      {loading && (
        <div className="students-message">
          <div className="students-spinner"></div>
          <p>Loading students...</p>
        </div>
      )}

      {!loading && error && (
        <div className="students-error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="students-table-card">

          <div className="table-wrapper">

            <table className="students-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>

                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="empty-students"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>

                      <td>
                        <div className="student-cell">

                          <div className="student-avatar">
                            {student.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || 'S'}
                          </div>

                          <div>
                            <strong>
                              {student.full_name || 'Student'}
                            </strong>

                            <span>
                              {student.phone || 'No phone'}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="student-id">
                          {student.student_id || 'N/A'}
                        </span>
                      </td>

                      <td>
                        {student.email || 'N/A'}
                      </td>

                      <td>
                        {student.course || 'BCA'}
                      </td>

                      <td>
                        Semester {student.semester || '-'}
                      </td>

                      <td>
                        <span
                          className={
                            student.role === 'admin'
                              ? 'role-badge admin-role'
                              : 'role-badge student-role'
                          }
                        >
                          {student.role || 'student'}
                        </span>
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