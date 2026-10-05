import './Timetable.css'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(value) {
  if (!value) return '—'
  const match = String(value).match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  const hour = Number(match[1])
  return `${String(hour).padStart(2, '0')}:${match[2]}`
}

export default function Timetable({ timetable = [], studentSemester = 6 }) {
  const schedule = weekdays.map((day) => ({
    day,
    shortDay: day.slice(0, 3).toUpperCase(),
    classes: timetable
      .filter((item) => {
        const itemDay = String(item.day || '').trim().toLowerCase()
        return itemDay === day.toLowerCase() || itemDay === day.slice(0, 3).toLowerCase()
      })
      .sort((left, right) => String(left.start_time || '').localeCompare(String(right.start_time || ''))),
  }))

  return (
    <section className="timetable-page">
      <div className="timetable-page-header">
        <div><h1>Timetable</h1><p>View your weekly class schedule.</p></div>
        <div className="timetable-semester">Semester {studentSemester}</div>
      </div>

      {timetable.length ? (
        <div className="timetable-week">
          {schedule.map((day) => (
            <div className="timetable-day" key={day.day}>
              <div className="timetable-day-header">
                <span>{day.shortDay}</span><strong>{day.day}</strong>
              </div>
              {day.classes.length ? (
                <div className="timetable-classes">
                  {day.classes.map((item) => (
                    <div className="timetable-class" key={item.id}>
                      <div className="timetable-time">{formatTime(item.start_time)} - {formatTime(item.end_time)}</div>
                      <div className="timetable-class-content">
                        <h3>{item.courses?.name || 'Class'}</h3>
                        <span className="timetable-code">{item.courses?.code || '—'}</span>
                        <div className="timetable-details">
                          <span>👨‍🏫 {item.teacher || 'Faculty not assigned'}</span>
                          <span>📍 {item.room || 'Room not assigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="timetable-empty-day">No classes scheduled.</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">Your weekly schedule will appear here once published.</div>
      )}

      <div className="timetable-info">
        <div className="timetable-info-icon">🗓️</div>
        <div><h3>Weekly Schedule</h3><p>Please check the timetable regularly for changes in class timings or rooms.</p></div>
      </div>
    </section>
  )
}
