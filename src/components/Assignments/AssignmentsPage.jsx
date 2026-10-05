import './Assignments.css'
import { useState } from 'react'

const PAGE_LOAD_TIME = new Date()

export default function AssignmentsPage({ assignments = [] }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  return (
    <div className="assignments-page">

      <div className="assignments-page-header">
        <div>
          <h1>Assignments</h1>
          <p>
            Manage your assignments and keep track of
            upcoming deadlines.
          </p>
        </div>

        <div className="assignment-header-count">
          <strong>{assignments.length}</strong>
          <span>Total Assignments</span>
        </div>
      </div>

      <div className="assignments-stats">

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon purple">
            📝
          </div>

          <div>
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon orange">
            ⏳
          </div>

          <div>
            <span>Upcoming</span>
            <strong>
              {
                assignments.filter((item) => {
                  if (!item.due_date) return false

                  const date = new Date(item.due_date)

                  return (
                    !Number.isNaN(date.getTime()) &&
                    date >= PAGE_LOAD_TIME
                  )
                }).length
              }
            </strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon red">
            !
          </div>

          <div>
            <span>High Priority</span>
            <strong>
              {
                assignments.filter(
                  (item) =>
                    String(
                      item.priority || ''
                    ).toLowerCase() === 'high'
                ).length
              }
            </strong>
          </div>
        </div>

      </div>

      <section className="assignments-card">

        <div className="assignments-card-header">
          <div>
            <h2>All Assignments</h2>
            <p>
              Your current assignment schedule.
            </p>
          </div>

          <span className="assignment-list-count">
            {assignments.length} Items
          </span>
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
          <div className="assignment-full-list">

            {assignments.map((assignment) => {

              const priority =
                String(
                  assignment.priority || 'Medium'
                ).toLowerCase()

              const dueDate = assignment.due_date
                ? new Date(assignment.due_date)
                : null

              const formattedDate =
                dueDate &&
                !Number.isNaN(dueDate.getTime())
                  ? dueDate.toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )
                  : 'No date'

              return (
                <div
                  className="assignment-full-item"
                  key={assignment.id}
                >

                  <div className="assignment-main-icon">
                    📝
                  </div>

                  <div className="assignment-main-info">

                    <div className="assignment-title-row">

                      <h3>
                        {assignment.title ||
                          'Untitled Assignment'}
                      </h3>

                      <span
                        className={`assignment-priority ${
                          priority === 'high'
                            ? 'high'
                            : priority === 'low'
                            ? 'low'
                            : 'medium'
                        }`}
                      >
                        {assignment.priority ||
                          'Medium'}
                      </span>

                    </div>

                    <p className="assignment-description">
                      {assignment.description ||
                        'No description available.'}
                    </p>

                    <div className="assignment-course">

                      <span className="assignment-course-icon">
                        📚
                      </span>

                      <span>
                        {assignment.courses?.name ||
                          'Course'}
                      </span>

                      {assignment.courses?.code && (
                        <b>
                          {assignment.courses.code}
                        </b>
                      )}

                    </div>

                  </div>

                  <div className="assignment-deadline">

                    <span>Due Date</span>

                    <strong>
                      {formattedDate}
                    </strong>

                    {dueDate &&
                    !Number.isNaN(
                      dueDate.getTime()
                    ) ? (
                      <small>
                        {dueDate < PAGE_LOAD_TIME
                          ? 'Overdue'
                          : 'Upcoming'}
                      </small>
                    ) : (
                      <small>
                        No deadline
                      </small>
                    )}

                  </div>

                  <button
                    className="assignment-view-btn"
                    type="button"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    View
                  </button>

                </div>
              )
            })}

          </div>
        )}

      </section>

      <div className="assignment-tips">

        <div className="assignment-tip">
          <div className="tip-icon">
            💡
          </div>

          <div>
            <strong>Stay Organized</strong>

            <p>
              Keep track of your deadlines and submit
              assignments on time.
            </p>
          </div>
        </div>

        <div className="assignment-tip">
          <div className="tip-icon">
            ⏰
          </div>

          <div>
            <strong>Plan Ahead</strong>

            <p>
              Start high-priority assignments early to
              avoid last-minute pressure.
            </p>
          </div>
        </div>

      </div>

      {selectedAssignment && (
        <div className="assignment-dialog-backdrop" onClick={() => setSelectedAssignment(null)}>
          <section
            className="assignment-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="assignment-dialog-header">
              <div>
                <span>{selectedAssignment.courses?.code || 'Assignment'}</span>
                <h2 id="assignment-dialog-title">{selectedAssignment.title || 'Untitled Assignment'}</h2>
              </div>
              <button type="button" aria-label="Close assignment details" onClick={() => setSelectedAssignment(null)}>×</button>
            </div>
            <p>{selectedAssignment.description || 'No description available.'}</p>
            <dl>
              <div><dt>Course</dt><dd>{selectedAssignment.courses?.name || 'Not assigned'}</dd></div>
              <div><dt>Due date</dt><dd>{selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString('en-IN') : 'No deadline'}</dd></div>
              <div><dt>Priority</dt><dd>{selectedAssignment.priority || 'Medium'}</dd></div>
            </dl>
            <p className="assignment-dialog-note">Submission is not enabled until your institution connects an assignment submission service.</p>
          </section>
        </div>
      )}

    </div>
  )
}