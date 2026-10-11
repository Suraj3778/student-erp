import './Timetable.css'

const DAYS = [
  { key: 'Monday', short: 'MON' },
  { key: 'Tuesday', short: 'TUE' },
  { key: 'Wednesday', short: 'WED' },
  { key: 'Thursday', short: 'THU' },
  { key: 'Friday', short: 'FRI' },
  { key: 'Saturday', short: 'SAT' },
]

function formatTime(time) {
  if (!time) return ''

  const [hours, minutes] = time.split(':')
  let hour = Number(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'

  hour = hour % 12 || 12

  return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`
}

function getCourseName(item) {
  return item?.courses?.name || 'Course'
}

function getCourseCode(item) {
  return item?.courses?.code || 'N/A'
}

export default function Timetable({ timetable = [] }) {
  const groupedTimetable = DAYS.reduce((acc, day) => {
    acc[day.key] = timetable
      .filter((item) => item.day === day.key)
      .sort((a, b) =>
        String(a.start_time).localeCompare(
          String(b.start_time)
        )
      )

    return acc
  }, {})

  return (
    <section className="timetable-page">

      {/* Header */}
      <div className="timetable-page-header">
        <div>
          <h1>Class Timetable</h1>
          <p>Your weekly class schedule.</p>
        </div>
      </div>

      {/* Empty State */}
      {timetable.length === 0 ? (
        <div className="timetable-empty">
          <div className="timetable-empty-icon">📅</div>

          <h3>No Timetable Available</h3>

          <p>
            Your class timetable will appear here once it
            is added by the university.
          </p>
        </div>
      ) : (
        <div className="timetable-grid">

          {DAYS.map((day) => {
            const classes = groupedTimetable[day.key] || []

            return (
              <div
                className="timetable-day-card"
                key={day.key}
              >

                {/* Day Header */}
                <div className="timetable-day-header">

                  <span className="timetable-day-badge">
                    {day.short}
                  </span>

                  <h2>{day.key}</h2>

                </div>

                {/* Classes */}
                <div className="timetable-classes">

                  {classes.length === 0 ? (
                    <div className="no-class">
                      <span>📚</span>
                      <p>No classes</p>
                    </div>
                  ) : (
                    classes.map((item) => (

                      <div
                        className="timetable-class"
                        key={item.id}
                      >

                        {/* Time */}
                        <div className="class-time" aria-label={`Class time ${formatTime(item.start_time)} to ${formatTime(item.end_time)}`}>
                          <strong>{formatTime(item.start_time)}</strong>
                          <span aria-hidden="true">to</span>
                          <strong>{formatTime(item.end_time)}</strong>
                        </div>

                        {/* Details */}
                        <div className="class-details">

                          <h3>
                            {getCourseName(item)}
                          </h3>

                          <p className="class-code">
                            {getCourseCode(item)}
                          </p>

                          <p className="class-teacher">
                            👨‍🏫 {item.teacher || 'Faculty'}
                          </p>

                          <p className="class-room">
                            📍 {item.room || 'Room'}
                          </p>

                        </div>

                      </div>

                    ))
                  )}

                </div>

              </div>
            )
          })}

        </div>
      )}

    </section>
  )
}