import './Dashboard.css'

function formatDate(date) {
  if (!date) return 'N/A'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Dashboard({
  studentName = 'Student',
  studentId = 'N/A',
  studentCourse = 'BCA',
  studentSemester = 6,
  courses = [],
  assignments = [],
  attendance = [],
  averageAttendance = 0,
  pendingAssignments = 0,
  setActive,
}) {
  const firstName =
    studentName.split(' ')[0] || 'Student'

  const upcomingAssignments = assignments
    .slice(0, 4)

  const topCourses = courses.slice(0, 5)

  return (
    <section className="dashboard-page">

      {/* =========================
          WELCOME
      ========================= */}

      <div className="dashboard-welcome">

        <div>
          <p className="dashboard-welcome-label">
            Student Dashboard
          </p>

          <h1>
            Welcome back, {firstName}! 👋
          </h1>

          <p className="dashboard-welcome-text">
            Here's what's happening with your
            academic progress.
          </p>
        </div>

        <div className="dashboard-student-badge">
          <span>
            {studentCourse}
          </span>

          <strong>
            Semester {studentSemester}
          </strong>
        </div>

      </div>

      {/* =========================
          STATS
      ========================= */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon purple">
            📚
          </div>

          <div>
            <span>Total Courses</span>

            <strong>
              {courses.length}
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon green">
            ✓
          </div>

          <div>
            <span>Attendance</span>

            <strong>
              {averageAttendance}%
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon orange">
            📝
          </div>

          <div>
            <span>Assignments</span>

            <strong>
              {pendingAssignments}
            </strong>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon blue">
            🎓
          </div>

          <div>
            <span>Student ID</span>

            <strong className="student-id-value">
              {studentId}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          MAIN GRID
      ========================= */}

      <div className="dashboard-main-grid">

        {/* =========================
            COURSES
        ========================= */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>My Courses</h2>

              <p>
                Your currently enrolled courses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActive?.('courses')}
              className="dashboard-view-btn"
            >
              View All
            </button>

          </div>

          {topCourses.length === 0 ? (
            <div className="dashboard-empty">
              <span>📚</span>
              <p>No courses available.</p>
            </div>
          ) : (
            <div className="dashboard-course-list">

              {topCourses.map((course) => (

                <div
                  className="dashboard-course-item"
                  key={course.id}
                >

                  <div className="dashboard-course-icon">
                    {course.name?.charAt(0) || 'C'}
                  </div>

                  <div className="dashboard-course-info">

                    <h3>
                      {course.name}
                    </h3>

                    <p>
                      {course.code}
                      {' • '}
                      {course.teacher || 'Faculty'}
                    </p>

                    <div className="dashboard-course-progress">

                      <div>
                        <span>
                          Progress
                        </span>

                        <strong>
                          {course.progress || 0}%
                        </strong>
                      </div>

                      <div className="dashboard-progress-bar">
                        <span
                          style={{
                            width: `${Math.min(
                              Number(course.progress || 0),
                              100
                            )}%`,
                          }}
                        ></span>
                      </div>

                    </div>

                  </div>

                  <span className="dashboard-credit">
                    {course.credits || 0} Credits
                  </span>

                </div>

              ))}

            </div>
          )}

        </section>

        {/* =========================
            ATTENDANCE
        ========================= */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>Attendance</h2>

              <p>
                Your subject-wise attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActive?.('attendance')}
              className="dashboard-view-btn"
            >
              View All
            </button>

          </div>

          <div className="dashboard-attendance-overview">

            <div
              className="attendance-circle"
              style={{
                '--attendance':
                  `${Math.min(
                    averageAttendance,
                    100
                  )}%`,
              }}
            >
              <div>
                <strong>
                  {averageAttendance}%
                </strong>

                <span>
                  Overall
                </span>
              </div>
            </div>

            <div className="attendance-overview-text">

              <h3>
                {averageAttendance >= 75
                  ? 'Good Attendance'
                  : 'Attendance is Low'}
              </h3>

              <p>
                {averageAttendance >= 75
                  ? 'You are meeting the minimum attendance requirement.'
                  : 'Please attend more classes to maintain the required attendance.'}
              </p>

              <div className="attendance-requirement">
                Minimum Required: <strong>75%</strong>
              </div>

            </div>

          </div>

          <div className="dashboard-attendance-list">

            {attendance.slice(0, 4).map((item) => {

              const percentage =
                Number(item.percentage || 0)

              return (
                <div
                  className="dashboard-attendance-row"
                  key={item.id}
                >

                  <div>
                    <strong>
                      {item.courses?.name || 'Course'}
                    </strong>

                    <span>
                      {item.courses?.code || 'N/A'}
                    </span>
                  </div>

                  <div className="dashboard-attendance-value">
                    <strong>
                      {percentage}%
                    </strong>

                    <span>
                      {item.attended || 0}/
                      {item.total || 0}
                    </span>
                  </div>

                </div>
              )
            })}

          </div>

        </section>

      </div>

      {/* =========================
          ASSIGNMENTS
      ========================= */}

      <section className="dashboard-card dashboard-assignments-card">

        <div className="dashboard-card-header">

          <div>
            <h2>Upcoming Assignments</h2>

            <p>
              Keep track of your pending assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActive?.('assignments')}
            className="dashboard-view-btn"
          >
            View All
          </button>

        </div>

        {upcomingAssignments.length === 0 ? (
          <div className="dashboard-empty">
            <span>📝</span>
            <p>No assignments available.</p>
          </div>
        ) : (
          <div className="dashboard-assignment-list">

            {upcomingAssignments.map((assignment) => (

              <div
                className="dashboard-assignment-item"
                key={assignment.id}
              >

                <div className="assignment-icon">
                  📝
                </div>

                <div className="assignment-info">

                  <h3>
                    {assignment.title}
                  </h3>

                  <p>
                    {assignment.courses?.name ||
                      'Course'}
                  </p>

                </div>

                <div className="assignment-due">

                  <span>
                    Due Date
                  </span>

                  <strong>
                    {formatDate(
                      assignment.due_date
                    )}
                  </strong>

                </div>

                <span
                  className={`assignment-priority ${
                    String(
                      assignment.priority || ''
                    ).toLowerCase()
                  }`}
                >
                  {assignment.priority ||
                    'Medium'}
                </span>

              </div>

            ))}

          </div>
        )}

      </section>

    </section>
  )
}