import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Students from './Students/Students'
import CoursesAdmin from './Courses/CoursesAdmin'
import AttendanceAdmin from './Attendance/AttendanceAdmin'
import AssignmentsAdmin from './Assignments/AssignmentsAdmin'
import ResultsAdmin from './Results/ResultsAdmin'
import FeesAdmin from './Fees/FeesAdmin'
import './Admin.css'

export default function Admin({ profile }) {
  const [activeSection, setActiveSection] = useState('dashboard')

  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    assignments: 0,
    fees: 0,
  })

  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoadingStats(true)

      const [
        studentsResponse,
        coursesResponse,
        assignmentsResponse,
        feesResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student'),

        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('assignments')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('fees')
          .select('id', { count: 'exact', head: true }),
      ])

      setStats({
        students: studentsResponse.count || 0,
        courses: coursesResponse.count || 0,
        assignments: assignmentsResponse.count || 0,
        fees: feesResponse.count || 0,
      })
    } catch (error) {
      console.error('Admin stats error:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (activeSection === 'students') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <Students />
      </div>
    )
  }

  if (activeSection === 'courses') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <CoursesAdmin />
      </div>
    )
  }

  if (activeSection === 'attendance') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <AttendanceAdmin />
      </div>
    )
  }

  if (activeSection === 'assignments') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <AssignmentsAdmin />
      </div>
    )
  }

  if (activeSection === 'results') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <ResultsAdmin />
      </div>
    )
  }

  if (activeSection === 'fees') {
    return (
      <div>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setActiveSection('dashboard')}
        >
          ← Back to Admin
        </button>

        <FeesAdmin />
      </div>
    )
  }

  return (
    <div className="admin-page">

      <div className="admin-header">

        <div>
          <span className="admin-badge">
            ADMIN PANEL
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage your Student Portal from one place.
          </p>
        </div>

        <div className="admin-welcome">

          <div className="admin-avatar">
            {profile?.full_name
              ?.charAt(0)
              ?.toUpperCase() || 'A'}
          </div>

          <div>
            <strong>
              {profile?.full_name || 'Administrator'}
            </strong>

            <span>
              Administrator
            </span>
          </div>

        </div>

      </div>


      <div className="admin-stats">

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            👨‍🎓
          </div>

          <div>
            <span>Total Students</span>

            <strong>
              {loadingStats ? '...' : stats.students}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            📚
          </div>

          <div>
            <span>Total Courses</span>

            <strong>
              {loadingStats ? '...' : stats.courses}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            📝
          </div>

          <div>
            <span>Assignments</span>

            <strong>
              {loadingStats ? '...' : stats.assignments}
            </strong>
          </div>

        </div>


        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            💰
          </div>

          <div>
            <span>Fee Records</span>

            <strong>
              {loadingStats ? '...' : stats.fees}
            </strong>
          </div>

        </div>

      </div>


      <div className="admin-section">

        <div className="section-heading">

          <h2>Management</h2>

          <p>
            Choose what you want to manage.
          </p>

        </div>


        <div className="admin-management-grid">

          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('students')
            }
          >
            <span className="management-icon">
              👨‍🎓
            </span>

            <div>
              <h3>Students</h3>
              <p>
                View and manage student profiles
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('courses')
            }
          >
            <span className="management-icon">
              📚
            </span>

            <div>
              <h3>Courses</h3>
              <p>
                Add and manage courses
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('attendance')
            }
          >
            <span className="management-icon">
              ✓
            </span>

            <div>
              <h3>Attendance</h3>
              <p>
                Manage student attendance
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('assignments')
            }
          >
            <span className="management-icon">
              📝
            </span>

            <div>
              <h3>Assignments</h3>
              <p>
                Create and manage assignments
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('results')
            }
          >
            <span className="management-icon">
              📊
            </span>

            <div>
              <h3>Results</h3>
              <p>
                Manage student results
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="management-card"
            onClick={() =>
              setActiveSection('fees')
            }
          >
            <span className="management-icon">
              💰
            </span>

            <div>
              <h3>Fees</h3>
              <p>
                Manage student fee records
              </p>
            </div>

            <span className="management-arrow">
              →
            </span>
          </button>

        </div>

      </div>

    </div>
  )
}