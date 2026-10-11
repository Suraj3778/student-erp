import './Assignments.css'

export default function Assignments({ assignments = [] }) {
  function formatDate(date) {
    if (!date) return 'No due date'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function getDaysLeft(date) {
    if (!date) return null

    const now = new Date()
    const dueDate = new Date(date)

    const difference = dueDate - now
    return Math.ceil(difference / (1000 * 60 * 60 * 24))
  }

  return (
    <section className="assignments-page">

      {/* Header */}
      <div className="assignments-page-header">
        <div>
          <h1>Assignments</h1>
          <p>
            View and track your upcoming assignments.
          </p>
        </div>

        <div className="assignments-count">
          <span>Total Assignments</span>
          <strong>{assignments.length}</strong>
        </div>
      </div>

      {/* Assignment List */}
      <section className="assignments-card">

        <div className="assignments-card-header">
          <div>
            <h2>Upcoming Assignments</h2>
            <p>
              Stay updated with your academic tasks.
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="assignments-empty">
            <div className="assignments-empty-icon">
              📝
            </div>

            <h3>No Assignments Found</h3>

            <p>
              Your assignments will appear here once
              they are added by your faculty.
            </p>
          </div>
        ) : (
          <div className="assignments-list">

            {assignments.map((assignment) => {
              const daysLeft = getDaysLeft(
                assignment.due_date
              )

              const priority =
                assignment.priority || 'Medium'

              const priorityClass =
                priority.toLowerCase()

              return (
                <div
                  className="assignment-item"
                  key={assignment.id}
                >

                  <div className="assignment-icon">
                    📝
                  </div>

                  <div className="assignment-content">

                    <div className="assignment-top">
                      <div>
                        <span className="assignment-code">
                          {assignment.courses?.code ||
                            'Course'}
                        </span>

                        <h3>
                          {assignment.title}
                        </h3>
                      </div>

                      <span
                        className={`assignment-priority ${priorityClass}`}
                      >
                        {priority}
                      </span>
                    </div>

                    <p className="assignment-description">
                      {assignment.description ||
                        'No description available.'}
                    </p>

                    <div className="assignment-footer">

                      <span>
                        📚{' '}
                        {assignment.courses?.name ||
                          'Course'}
                      </span>

                      <span>
                        📅{' '}
                        {formatDate(
                          assignment.due_date
                        )}
                      </span>

                      {daysLeft !== null && (
                        <span
                          className={
                            daysLeft < 0
                              ? 'assignment-overdue'
                              : daysLeft <= 3
                              ? 'assignment-soon'
                              : ''
                          }
                        >
                          {daysLeft < 0
                            ? 'Overdue'
                            : daysLeft === 0
                            ? 'Due Today'
                            : `${daysLeft} days left`}
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </section>
    </section>
  )
}