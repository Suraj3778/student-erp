import './Results.css'

export default function Results({ results = [] }) {
  const totalMarks = results.reduce(
    (sum, item) => sum + Number(item.marks || 0),
    0
  )

  const totalMaxMarks = results.reduce(
    (sum, item) => sum + Number(item.max_marks || 0),
    0
  )

  const percentage =
    totalMaxMarks > 0
      ? Math.round((totalMarks / totalMaxMarks) * 100)
      : 0

  function getGradeClass(grade) {
    if (!grade) return ''

    const value = grade.toUpperCase()

    if (value.startsWith('A')) return 'excellent'
    if (value.startsWith('B')) return 'good'
    if (value.startsWith('C')) return 'average'

    return 'low'
  }

  return (
    <section className="results-page">

      {/* Header */}
      <div className="results-page-header">
        <div>
          <h1>Results</h1>
          <p>
            View your academic performance and semester results.
          </p>
        </div>

        <div className="results-semester">
          <span>Current Semester</span>
          <strong>
            Semester {results[0]?.semester || 6}
          </strong>
        </div>
      </div>

      {/* Summary */}
      <div className="results-summary">

        <div className="results-summary-card">
          <div className="results-summary-icon">
            %
          </div>

          <div>
            <span>Overall Percentage</span>
            <strong>{percentage}%</strong>
          </div>
        </div>

        <div className="results-summary-card">
          <div className="results-summary-icon green">
            ✓
          </div>

          <div>
            <span>Total Marks</span>
            <strong>
              {totalMarks}/{totalMaxMarks}
            </strong>
          </div>
        </div>

        <div className="results-summary-card">
          <div className="results-summary-icon blue">
            #
          </div>

          <div>
            <span>Subjects</span>
            <strong>{results.length}</strong>
          </div>
        </div>

      </div>

      {/* Results Table */}
      <section className="results-card">

        <div className="results-card-header">
          <div>
            <h2>Subject-wise Results</h2>
            <p>
              Your marks and grades for each course.
            </p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="results-empty">
            <div className="results-empty-icon">
              🎓
            </div>

            <h3>No Results Available</h3>

            <p>
              Your examination results will appear here
              once they are published.
            </p>
          </div>
        ) : (
          <div className="results-table-wrapper">

            <table className="results-table">

              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>

              <tbody>

                {results.map((result) => {
                  const marks = Number(result.marks || 0)
                  const maxMarks = Number(
                    result.max_marks || 0
                  )

                  const subjectPercentage =
                    maxMarks > 0
                      ? Math.round(
                          (marks / maxMarks) * 100
                        )
                      : 0

                  return (
                    <tr key={result.id}>

                      <td>
                        <strong>
                          {result.courses?.name ||
                            'Course'}
                        </strong>
                      </td>

                      <td className="result-code">
                        {result.courses?.code || 'N/A'}
                      </td>

                      <td>
                        <strong>
                          {marks}/{maxMarks}
                        </strong>
                      </td>

                      <td>
                        <div className="result-progress">

                          <div className="result-progress-top">
                            <strong>
                              {subjectPercentage}%
                            </strong>
                          </div>

                          <div className="result-progress-bar">
                            <span
                              style={{
                                width: `${Math.min(
                                  subjectPercentage,
                                  100
                                )}%`,
                              }}
                            ></span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`result-grade ${getGradeClass(
                            result.grade
                          )}`}
                        >
                          {result.grade || 'N/A'}
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

    </section>
  )
}