import './Courses.css'

export default function Courses({ courses = [] }) {
  return (
    <section className="courses-page">

      {/* Header */}
      <div className="courses-page-header">
        <div>
          <h1>My Courses</h1>
          <p>
            View all your enrolled courses and academic progress.
          </p>
        </div>

        <div className="courses-count">
          <span>Enrolled Courses</span>
          <strong>{courses.length}</strong>
        </div>
      </div>

      {/* Empty State */}
      {courses.length === 0 ? (
        <div className="courses-empty">
          <div className="courses-empty-icon">
            📚
          </div>

          <h3>No Courses Found</h3>

          <p>
            No enrolled courses are available for your account.
          </p>
        </div>
      ) : (
        <div className="courses-grid">

          {courses.map((course) => {
            const progress = Number(course.progress || 0)

            let progressClass = 'good'

            if (progress < 50) {
              progressClass = 'low'
            } else if (progress < 75) {
              progressClass = 'average'
            }

            return (
              <article
                className="course-card"
                key={course.id}
              >

                {/* Top */}
                <div className="course-card-top">

                  <div className="course-icon">
                    📚
                  </div>

                  <span className="course-code">
                    {course.code}
                  </span>

                </div>

                {/* Course Info */}
                <div className="course-content">

                  <h2>{course.name}</h2>

                  <p className="course-teacher">
                    👨‍🏫 {course.teacher || 'Faculty not assigned'}
                  </p>

                  <div className="course-meta">

                    <span>
                      Credits
                      <strong>
                        {course.credits || 0}
                      </strong>
                    </span>

                    <span>
                      Progress
                      <strong>
                        {progress}%
                      </strong>
                    </span>

                  </div>

                  {/* Progress */}
                  <div className="course-progress">

                    <div className="course-progress-header">
                      <span>Course Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="course-progress-track">
                      <span
                        className={progressClass}
                        style={{
                          width: `${Math.min(
                            Math.max(progress, 0),
                            100
                          )}%`,
                        }}
                      ></span>
                    </div>

                  </div>

                </div>

              </article>
            )
          })}

        </div>
      )}

    </section>
  )
}