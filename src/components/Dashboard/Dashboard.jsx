import './Dashboard.css'

export default function Dashboard({
  studentName = 'Student',
  studentId = 'N/A',
  studentCourse = 'BCA',
  studentSemester = '—',
  studentSection = '',
  studentYearLevel = '',
  academicYear = '',
  courses = [],
  assignments = [],
  attendance = [],
  averageAttendance = 0,
  pendingAssignments = 0,
  setActive,
  isAdmin = false,
}) {
  const completedCourses = courses.filter(
    (course) => Number(course.progress || 0) >= 75
  ).length

  return (
    <div className="dashboard-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="dashboard-header">

        <div>
          <p className="dashboard-greeting">
            Welcome back,
          </p>

          <h1>
            {studentName} 👋
          </h1>

          <p className="dashboard-subtitle">
            {isAdmin ? 'Here is your administrative overview.' : 'Here is your academic overview.'}
          </p>
        </div>

        <div className="dashboard-student-info">

          <strong>
            {studentId}
          </strong>

          <span>
            {[studentCourse, `Semester ${studentSemester}`, studentSection && `Section ${studentSection}`, studentYearLevel && `Year ${studentYearLevel}`, academicYear].filter(Boolean).join(' • ')}
          </span>

        </div>

      </div>

      {/* =========================
          QUICK STATS
      ========================= */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon purple">
            📚
          </div>

          <div>
            <span>{isAdmin ? 'Total Students' : 'Total Courses'}</span>
            <strong>
              {isAdmin ? '1248' : courses.length}
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon green">
            ✓
          </div>

          <div>
            <span>{isAdmin ? 'Attendance Rate' : 'Attendance'}</span>
            <strong>
              {isAdmin ? '92%' : `${averageAttendance}%`}
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon orange">
            📝
          </div>

          <div>
            <span>{isAdmin ? 'Open Tasks' : 'Assignments'}</span>
            <strong>
              {isAdmin ? '34' : pendingAssignments}
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon blue">
            🎓
          </div>

          <div>
            <span>{isAdmin ? 'Active Courses' : 'Completed Courses'}</span>
            <strong>
              {isAdmin ? '24' : completedCourses}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          MAIN GRID
      ========================= */}

      <div className="dashboard-grid">

        {/* COURSES */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                My Courses
              </h2>

              <p>
                Your enrolled courses
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActive?.('courses')
              }
            >
              View All
            </button>

          </div>

          {courses.length === 0 ? (
            <div className="dashboard-empty">
              <span>📚</span>

              <p>
                No courses found.
              </p>
            </div>
          ) : (
            <div className="dashboard-course-list">

              {courses.slice(0, 5).map(
                (course) => {

                  const progress = Math.min(
                    Math.max(
                      Number(
                        course.progress || 0
                      ),
                      0
                    ),
                    100
                  )

                  return (
                    <div
                      className="dashboard-course-item"
                      key={course.id}
                    >

                      <div className="dashboard-course-info">

                        <div>
                          <strong>
                            {course.name}
                          </strong>

                          <span>
                            {course.code}
                          </span>
                        </div>

                        <b>
                          {progress}%
                        </b>

                      </div>

                      <div className="dashboard-progress">

                        <span
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </section>

        {/* ASSIGNMENTS */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Assignments
              </h2>

              <p>
                Upcoming assignments
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActive?.('assignments')
              }
            >
              View All
            </button>

          </div>

          {assignments.length === 0 ? (
            <div className="dashboard-empty">
              <span>📝</span>

              <p>
                No assignments found.
              </p>
            </div>
          ) : (
            <div className="dashboard-assignment-list">

              {assignments
                .slice(0, 5)
                .map((assignment) => (

                  <div
                    className="dashboard-assignment-item"
                    key={assignment.id}
                  >

                    <div className="dashboard-assignment-icon">
                      📝
                    </div>

                    <div className="dashboard-assignment-info">

                      <strong>
                        {assignment.title}
                      </strong>

                      <span>
                        {assignment.courses?.name ||
                          'Course'}
                      </span>

                    </div>

                    <div className="dashboard-assignment-date">

                      {assignment.due_date
                        ? new Date(
                            assignment.due_date
                          ).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                            }
                          )
                        : 'No date'}

                    </div>

                  </div>

                ))}

            </div>
          )}

        </section>

      </div>

      {/* =========================
          ATTENDANCE
      ========================= */}

      <section className="dashboard-card dashboard-attendance-card">

        <div className="dashboard-card-header">

          <div>
            <h2>
              Attendance Overview
            </h2>

            <p>
              Your subject-wise attendance
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActive?.('attendance')
            }
          >
            View Details
          </button>

        </div>

        {attendance.length === 0 ? (
          <div className="dashboard-empty">
            <span>📊</span>

            <p>
              No attendance data available.
            </p>
          </div>
        ) : (
          <div className="dashboard-attendance-list">

            {attendance
              .slice(0, 5)
              .map((item) => {

                const total = Number(item.total)
                const attended = Number(item.attended)
                const percentage = total > 0 && Number.isFinite(attended)
                  ? Math.min(Math.max(Math.round((attended / total) * 100), 0), 100)
                  : 0

                return (
                  <div
                    className="dashboard-attendance-item"
                    key={item.id}
                  >

                    <div className="dashboard-attendance-info">

                      <strong>
                        {item.courses?.name ||
                          'Course'}
                      </strong>

                      <span>
                        {item.courses?.code ||
                          'N/A'}
                      </span>

                    </div>

                    <div className="dashboard-attendance-progress">

                      <div className="dashboard-progress">

                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <strong>
                        {percentage}%
                      </strong>

                    </div>

                  </div>
                )
              })}

          </div>
        )}

      </section>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <section className="dashboard-quick-actions">

        <button
          type="button"
          onClick={() =>
            setActive?.('courses')
          }
        >
          <span>📚</span>
          <strong>Courses</strong>
          <small>
            View all courses
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            setActive?.('attendance')
          }
        >
          <span>📊</span>
          <strong>Attendance</strong>
          <small>
            Check attendance
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            setActive?.('assignments')
          }
        >
          <span>📝</span>
          <strong>Assignments</strong>
          <small>
            Check deadlines
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            setActive?.('profile')
          }
        >
          <span>👤</span>
          <strong>Profile</strong>
          <small>
            View your profile
          </small>
        </button>

      </section>

    </div>
  )
}