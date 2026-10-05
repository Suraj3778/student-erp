import './Results.css'

export default function Results({ results = [], studentSemester = 6 }) {
  const scoredResults = results.map((result) => ({
    ...result,
    marks: Number(result.marks || 0),
    maxMarks: Math.max(1, Number(result.max_marks || 100)),
  }))
  const averageMarks = scoredResults.length
    ? Math.round(scoredResults.reduce((sum, result) => sum + (result.marks / result.maxMarks) * 100, 0) / scoredResults.length)
    : 0
  const passedSubjects = scoredResults.filter((result) => (result.marks / result.maxMarks) * 100 >= 40).length
  const performance = averageMarks >= 85 ? 'Excellent' : averageMarks >= 70 ? 'Good' : averageMarks >= 40 ? 'Fair' : '—'
  const semesters = scoredResults.map((result) => Number(result.semester)).filter(Number.isFinite)
  const semester = semesters.length ? Math.max(...semesters) : studentSemester

  return (
    <section className="results-page">
      <div className="results-page-header">
        <div>
          <h1>Results</h1>
          <p>View your semester examination results and academic performance.</p>
        </div>
        <div className="result-semester-badge">Semester {semester}</div>
      </div>

      <div className="results-summary">
        <div className="result-summary-card">
          <div className="result-summary-icon purple">📊</div>
          <div><span>Average Marks</span><strong>{averageMarks}%</strong></div>
        </div>
        <div className="result-summary-card">
          <div className="result-summary-icon green">✓</div>
          <div><span>Subjects Passed</span><strong>{passedSubjects}/{scoredResults.length}</strong></div>
        </div>
        <div className="result-summary-card">
          <div className="result-summary-icon blue">🎓</div>
          <div><span>Performance</span><strong>{performance}</strong></div>
        </div>
      </div>

      <section className="results-card">
        <div className="results-card-header">
          <div><h2>Semester Results</h2><p>Subject-wise marks and grades.</p></div>
        </div>
        {scoredResults.length ? (
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead><tr><th>Course</th><th>Code</th><th>Marks</th><th>Maximum</th><th>Grade</th><th>Status</th></tr></thead>
              <tbody>
                {scoredResults.map((result) => {
                  const passed = (result.marks / result.maxMarks) * 100 >= 40
                  return (
                    <tr key={result.id}>
                      <td><strong>{result.courses?.name || 'Course'}</strong></td>
                      <td>{result.courses?.code || '—'}</td>
                      <td>{result.marks}</td>
                      <td>{result.maxMarks}</td>
                      <td><span className="result-grade">{result.grade || '—'}</span></td>
                      <td><span className={`result-status ${passed ? 'pass' : 'fail'}`}>{passed ? 'Pass' : 'Needs review'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">Results will appear here when published by the university.</div>
        )}
      </section>

      <section className="results-performance">
        <div className="results-performance-icon">🏆</div>
        <div>
          <h3>{scoredResults.length ? 'Your academic summary' : 'Results not published yet'}</h3>
          <p>{scoredResults.length ? `Your current average is ${averageMarks}%.` : 'Please check again after your results are released.'}</p>
        </div>
      </section>
    </section>
  )
}
