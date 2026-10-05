import './Courses.css'

export default function Courses({ courses = [] }) {
  return (
    <section className="courses-page">

      {/* Header */}
      <div className="courses-page-header">
        <div>
          <h1>My Courses</h1>
          <p>
            Your enrolled courses for the current semester.
          </p>
        </div>

        <div className="courses-count">
          <strong>{courses.length}</strong>
          <span>Enrolled Courses</span>
        </div>
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="courses-empty">

          <div className="courses-empty-icon">
            📚
          </div>

          <h2>No Courses Found</h2>

          <p>
            Your enrolled courses will appear here once
            they are added to your account.
          </p>

        </div>
      ) : (
        <div className="courses-grid">

          {courses.map((course) => {

            const progress = Math.min(
              Math.max(
                Number(course.progress || 0),
                0
              ),
              100
            )

            return (
              <article
                className="course-card"
                key={course.id}
              >

                {/* Course Top */}
                <div className="course-card-top">

                  <div className="course-code">
                    {course.code}
                  </div>

                  <div className="course-credits">
                    {course.credits || 4} Credits
                  </div>

                </div>

                {/* Course Content */}
                <div className="course-card-body">

                  <h2>
                    {course.name}
                  </h2>

                  <p className="course-teacher">
                    👨‍🏫{' '}
                    {course.teacher ||
                      'Faculty not assigned'}
                  </p>

                  {/* Progress */}
                  <div className="course-progress">

                    <div className="course-progress-header">

                      <span>
                        Course Progress
                      </span>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="course-progress-bar">

                      <span
                        style={{
                          width: `${progress}%`,
                        }}
                      ></span>

                    </div>

                  </div>

                </div>

                {/* Footer */}
                <div className="course-card-footer">

                  <span>
                    Course Code
                  </span>

                  <strong>
                    {course.code}
                  </strong>

                </div>

              </article>
            )
          })}

        </div>
      )}

    </section>
  )
}