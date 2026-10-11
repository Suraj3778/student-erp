import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './AssignmentsAdmin.css'

export default function AssignmentsAdmin() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [assignmentResponse, courseResponse] =
        await Promise.all([
          supabase
            .from('assignments')
            .select(`
              id,
              title,
              description,
              due_date,
              priority,
              created_at,
              courses (
                id,
                code,
                name
              )
            `)
            .order('due_date', {
              ascending: true,
            }),

          supabase
            .from('courses')
            .select('id, code, name')
            .order('code'),
        ])

      if (assignmentResponse.error) {
        throw assignmentResponse.error
      }

      if (courseResponse.error) {
        throw courseResponse.error
      }

      setAssignments(assignmentResponse.data || [])
      setCourses(courseResponse.data || [])
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Assignments load nahi ho paaye.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleAddAssignment(e) {
    e.preventDefault()

    if (!form.course_id) {
      setError('Please select a course.')
      return
    }

    if (!form.title.trim()) {
      setError('Assignment title required hai.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('assignments')
        .insert([
          {
            course_id: form.course_id,
            title: form.title.trim(),
            description:
              form.description.trim() || null,
            due_date: form.due_date
              ? new Date(form.due_date).toISOString()
              : null,
            priority: form.priority,
          },
        ])

      if (error) throw error

      setMessage(
        'Assignment successfully added.'
      )

      setForm({
        course_id: '',
        title: '',
        description: '',
        due_date: '',
        priority: 'Medium',
      })

      await loadData()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Assignment add nahi ho paaya.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAssignment(id) {
    const confirmDelete = window.confirm(
      'Kya aap is assignment ko delete karna chahte hain?'
    )

    if (!confirmDelete) return

    try {
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage(
        'Assignment deleted successfully.'
      )

      await loadData()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Assignment delete nahi ho paaya.'
      )
    }
  }

  function formatDate(date) {
    if (!date) return 'No due date'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function priorityClass(priority) {
    if (priority === 'High') {
      return 'assignment-high'
    }

    if (priority === 'Low') {
      return 'assignment-low'
    }

    return 'assignment-medium'
  }

  return (
    <div className="assignments-admin-page">

      <div className="assignments-admin-header">

        <div>
          <span className="assignments-admin-badge">
            ADMIN
          </span>

          <h1>Assignment Management</h1>

          <p>
            Create and manage student assignments.
          </p>
        </div>

        <button
          type="button"
          className="assignment-refresh-btn"
          onClick={loadData}
        >
          ↻ Refresh
        </button>

      </div>


      {error && (
        <div className="assignment-alert assignment-error">
          {error}
        </div>
      )}

      {message && (
        <div className="assignment-alert assignment-success">
          {message}
        </div>
      )}


      <div className="assignment-admin-layout">

        {/* ADD ASSIGNMENT */}

        <div className="add-assignment-card">

          <h2>Add Assignment</h2>

          <p className="assignment-card-description">
            Create a new assignment for a course.
          </p>

          <form onSubmit={handleAddAssignment}>

            <div className="assignment-form-group">
              <label>Course</label>

              <select
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
              >
                <option value="">
                  Select Course
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


            <div className="assignment-form-group">
              <label>Title</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="DBMS Assignment 1"
              />
            </div>


            <div className="assignment-form-group">
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Assignment description..."
                rows="4"
              />
            </div>


            <div className="assignment-form-group">
              <label>Due Date</label>

              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>


            <div className="assignment-form-group">
              <label>Priority</label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
              </select>
            </div>


            <button
              type="submit"
              className="add-assignment-btn"
              disabled={saving}
            >
              {saving
                ? 'Adding...'
                : '+ Add Assignment'}
            </button>

          </form>

        </div>


        {/* ASSIGNMENT LIST */}

        <div className="assignments-list-card">

          <div className="assignments-list-heading">
            <div>
              <h2>All Assignments</h2>

              <span>
                {assignments.length} assignments
              </span>
            </div>
          </div>


          {loading ? (
            <div className="assignment-loading">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="assignment-empty">
              No assignments found.
            </div>
          ) : (
            <div className="assignment-admin-list">

              {assignments.map((assignment) => (
                <div
                  className="assignment-admin-item"
                  key={assignment.id}
                >

                  <div className="assignment-info">

                    <div className="assignment-icon">
                      📝
                    </div>

                    <div>
                      <h3>
                        {assignment.title}
                      </h3>

                      <p>
                        {assignment.courses?.code}
                        {' • '}
                        {assignment.courses?.name}
                      </p>

                      {assignment.description && (
                        <small>
                          {assignment.description}
                        </small>
                      )}
                    </div>

                  </div>


                  <div className="assignment-meta">

                    <span
                      className={`assignment-priority ${priorityClass(
                        assignment.priority
                      )}`}
                    >
                      {assignment.priority}
                    </span>

                    <span className="assignment-due">
                      Due: {formatDate(
                        assignment.due_date
                      )}
                    </span>

                  </div>


                  <button
                    type="button"
                    className="delete-assignment-btn"
                    onClick={() =>
                      handleDeleteAssignment(
                        assignment.id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  )
}