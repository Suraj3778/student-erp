import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './CoursesAdmin.css'

export default function CoursesAdmin() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    code: '',
    name: '',
    teacher: '',
    credits: 4,
    progress: 0,
  })

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      setCourses(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Courses load nahi ho paaye.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'credits' || name === 'progress'
          ? Number(value)
          : value,
    }))
  }

  async function handleAddCourse(e) {
    e.preventDefault()

    if (!form.code.trim() || !form.name.trim()) {
      setError('Course code aur course name required hai.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('courses')
        .insert([
          {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            teacher: form.teacher.trim(),
            credits: form.credits,
            progress: form.progress,
          },
        ])

      if (error) throw error

      setMessage('Course successfully added.')

      setForm({
        code: '',
        name: '',
        teacher: '',
        credits: 4,
        progress: 0,
      })

      await loadCourses()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Course add nahi ho paaya.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCourse(id) {
    const confirmDelete = window.confirm(
      'Kya aap is course ko delete karna chahte hain?'
    )

    if (!confirmDelete) return

    try {
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage('Course deleted successfully.')
      await loadCourses()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Course delete nahi ho paaya.')
    }
  }

  return (
    <div className="courses-admin-page">

      <div className="courses-admin-header">
        <div>
          <span className="courses-admin-badge">
            ADMIN
          </span>

          <h1>Course Management</h1>

          <p>
            Add, view and manage university courses.
          </p>
        </div>

        <button
          type="button"
          className="course-refresh-btn"
          onClick={loadCourses}
        >
          ↻ Refresh
        </button>
      </div>


      {error && (
        <div className="course-alert course-error">
          {error}
        </div>
      )}

      {message && (
        <div className="course-alert course-success">
          {message}
        </div>
      )}


      <div className="course-admin-layout">

        <div className="add-course-card">

          <h2>Add New Course</h2>

          <p className="card-description">
            Enter course details below.
          </p>

          <form onSubmit={handleAddCourse}>

            <div className="course-form-group">
              <label>Course Code</label>

              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="CAUCBC306T"
              />
            </div>


            <div className="course-form-group">
              <label>Course Name</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Software Engineering"
              />
            </div>


            <div className="course-form-group">
              <label>Teacher</label>

              <input
                name="teacher"
                value={form.teacher}
                onChange={handleChange}
                placeholder="Dr. Teacher Name"
              />
            </div>


            <div className="course-form-row">

              <div className="course-form-group">
                <label>Credits</label>

                <input
                  type="number"
                  name="credits"
                  min="1"
                  max="10"
                  value={form.credits}
                  onChange={handleChange}
                />
              </div>


              <div className="course-form-group">
                <label>Progress %</label>

                <input
                  type="number"
                  name="progress"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={handleChange}
                />
              </div>

            </div>


            <button
              type="submit"
              className="add-course-btn"
              disabled={saving}
            >
              {saving ? 'Adding...' : '+ Add Course'}
            </button>

          </form>

        </div>


        <div className="courses-list-card">

          <div className="courses-list-heading">
            <div>
              <h2>All Courses</h2>
              <span>{courses.length} courses</span>
            </div>
          </div>


          {loading ? (
            <div className="course-loading">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="course-empty">
              No courses found.
            </div>
          ) : (
            <div className="course-admin-list">

              {courses.map((course) => (
                <div
                  className="course-admin-item"
                  key={course.id}
                >

                  <div className="course-admin-info">

                    <div className="course-code">
                      {course.code}
                    </div>

                    <div>
                      <h3>{course.name}</h3>

                      <p>
                        {course.teacher || 'Teacher not assigned'}
                        {' • '}
                        {course.credits || 0} Credits
                      </p>
                    </div>

                  </div>


                  <div className="course-progress-box">

                    <div>
                      <span>Progress</span>
                      <strong>
                        {course.progress || 0}%
                      </strong>
                    </div>

                    <div className="course-progress-bar">
                      <span
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(course.progress || 0),
                              0
                            ),
                            100
                          )}%`,
                        }}
                      ></span>
                    </div>

                  </div>


                  <button
                    type="button"
                    className="delete-course-btn"
                    onClick={() =>
                      handleDeleteCourse(course.id)
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