import './Attendance.css'

function attendancePercentage(item) {
  const total = Number(item.total)
  const attended = Number(item.attended)
  return Number.isFinite(total) && total > 0 && Number.isFinite(attended)
    ? Math.round((attended / total) * 100)
    : 0
}

export default function Attendance({ attendance = [] }) {
  const lectureRows = attendance
    .flatMap((item) =>
      (item.lectures || []).map((lecture) => ({
        ...lecture,
        courseName: item.courses?.name || 'Course',
      })),
    )
    .sort((left, right) =>
      String(right.held_on || '').localeCompare(String(left.held_on || '')) ||
      left.courseName.localeCompare(right.courseName) ||
      Number(left.lecture_number || 0) - Number(right.lecture_number || 0) ||
      String(left.session_type || '').localeCompare(String(right.session_type || '')),
    )

  const averageAttendance =
    attendance.length > 0
      ? Math.round(
          attendance.reduce(
            (sum, item) =>
              sum + attendancePercentage(item),
            0
          ) / attendance.length
        )
      : 0

  return (
    <section className="attendance-page">

      {/* Header */}
      <div className="attendance-page-header">
        <div>
          <h1>Attendance</h1>
          <p>
            Track your attendance for all enrolled courses.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="attendance-summary">

        <div className="attendance-summary-card">
          <div className="attendance-summary-icon">
            %
          </div>

          <div>
            <span>Overall Attendance</span>
            <strong>{averageAttendance}%</strong>
          </div>
        </div>

        <div className="attendance-summary-card">
          <div className="attendance-summary-icon green">
            ✓
          </div>

          <div>
            <span>Courses Tracked</span>
            <strong>{attendance.length}</strong>
          </div>
        </div>

        <div className="attendance-summary-card">
          <div className="attendance-summary-icon orange">
            75
          </div>

          <div>
            <span>Minimum Required</span>
            <strong>75%</strong>
          </div>
        </div>

      </div>

      {/* Attendance Table */}
      <section className="attendance-card">

        <div className="attendance-card-header">
          <div>
            <h2>Subject-wise Attendance</h2>
            <p>
              Your attendance details by course.
            </p>
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="attendance-empty">

            <div className="attendance-empty-icon">
              📊
            </div>

            <h3>No Attendance Data</h3>

            <p>
              Attendance data will appear here once
              it is added by your faculty.
            </p>

          </div>
        ) : (
          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {attendance.map((item) => {
                  const percentage = attendancePercentage(item)

                  const isGood =
                    percentage >= 75

                  return (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {item.courses?.name ||
                            'Course'}
                        </strong>
                      </td>

                      <td>
                        {item.courses?.code ||
                          'N/A'}
                      </td>

                      <td>
                        {item.attended ?? 0}
                      </td>

                      <td>
                        {item.total ?? 0}
                      </td>

                      <td>
                        <div className="attendance-progress">

                          <div className="attendance-progress-top">
                            <strong>
                              {percentage}%
                            </strong>
                          </div>

                          <div className="attendance-progress-bar">
                            <span
                              style={{
                                width: `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                              }}
                            ></span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`attendance-status ${
                            isGood
                              ? 'good'
                              : 'low'
                          }`}
                        >
                          {isGood
                            ? 'Good'
                            : 'Low'}
                        </span>
                      </td>

                    </tr>
                  )
                })}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {lectureRows.length > 0 && (
        <section className="attendance-card attendance-lecture-history">
          <div className="attendance-card-header">
            <div>
              <h2>Class-by-class attendance</h2>
              <p>Lecture number, class type, date, and your recorded status.</p>
            </div>
          </div>
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead><tr><th>Date</th><th>Course</th><th>Lecture</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {lectureRows.map((lecture) => (
                  <tr key={lecture.id}>
                    <td>{lecture.held_on || '—'}</td>
                    <td><strong>{lecture.courseName}</strong></td>
                    <td>{lecture.lecture_number ?? '—'}</td>
                    <td>{lecture.session_type === 'lab' ? 'Lab' : 'Theory'}</td>
                    <td><span className={`attendance-status ${lecture.status === 'present' ? 'good' : 'low'}`}>{lecture.status === 'present' ? 'Present' : 'Absent'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Information */}
      <div className="attendance-note">

        <div className="attendance-note-icon">
          i
        </div>

        <div>
          <h3>Attendance Requirement</h3>

          <p>
            Students should maintain at least 75%
            attendance to meet the minimum academic
            requirement.
          </p>
        </div>

      </div>

    </section>
  )
}