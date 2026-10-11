import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import './FeesAdmin.css'

export default function FeesAdmin() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])

  const [selectedStudent, setSelectedStudent] = useState('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [studentsResponse, feesResponse] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, student_id, full_name, email')
            .eq('role', 'student')
            .order('full_name'),

          supabase
            .from('fees')
            .select(`
              id,
              student_id,
              total_amount,
              paid_amount,
              pending_amount,
              due_date,
              status,
              created_at,
              profiles (
                id,
                student_id,
                full_name
              )
            `)
            .order('due_date', {
              ascending: true,
            }),
        ])

      if (studentsResponse.error) {
        throw studentsResponse.error
      }

      if (feesResponse.error) {
        throw feesResponse.error
      }

      setStudents(studentsResponse.data || [])
      setFees(feesResponse.data || [])
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Fees load nahi ho paaye.'
      )
    } finally {
      setLoading(false)
    }
  }

  function updateFee(id, field, value) {
    setFees((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  async function saveFee(item) {
    const totalAmount = Number(item.total_amount) || 0
    const paidAmount = Number(item.paid_amount) || 0

    if (totalAmount < 0 || paidAmount < 0) {
      setError('Fee amount negative nahi ho sakta.')
      return
    }

    if (paidAmount > totalAmount) {
      setError(
        'Paid amount total fee se zyada nahi ho sakta.'
      )
      return
    }

    const pendingAmount = Math.max(
      totalAmount - paidAmount,
      0
    )

    let status = 'Pending'

    if (pendingAmount === 0) {
      status = 'Paid'
    } else if (paidAmount > 0) {
      status = 'Partial'
    }

    try {
      setSavingId(item.id)
      setError('')
      setMessage('')

      const { error } = await supabase
        .from('fees')
        .update({
          total_amount: totalAmount,
          paid_amount: paidAmount,
          due_date: item.due_date || null,
          status,
        })
        .eq('id', item.id)

      if (error) throw error

      setMessage(
        `${item.profiles?.full_name || 'Student'} ki fee updated.`
      )

      await loadData()
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Fee update nahi ho paayi.'
      )
    } finally {
      setSavingId(null)
    }
  }

  const filteredFees = fees.filter((item) => {
    return (
      selectedStudent === 'all' ||
      item.student_id === selectedStudent
    )
  })

  function formatDate(date) {
    if (!date) return 'No date'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    )
  }

  return (
    <div className="fees-admin-page">

      <div className="fees-admin-header">

        <div>
          <span className="fees-admin-badge">
            ADMIN
          </span>

          <h1>Fee Management</h1>

          <p>
            View and update student fee records.
          </p>
        </div>

        <button
          type="button"
          className="fees-refresh-btn"
          onClick={loadData}
        >
          ↻ Refresh
        </button>

      </div>


      {error && (
        <div className="fees-alert fees-error">
          {error}
        </div>
      )}

      {message && (
        <div className="fees-alert fees-success">
          {message}
        </div>
      )}


      <div className="fees-filter-bar">

        <div className="fees-filter">
          <label>Student</label>

          <select
            value={selectedStudent}
            onChange={(e) =>
              setSelectedStudent(e.target.value)
            }
          >
            <option value="all">
              All Students
            </option>

            {students.map((student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="fees-record-count">
          <span>Records</span>
          <strong>{filteredFees.length}</strong>
        </div>

      </div>


      {loading ? (
        <div className="fees-loading">
          Loading fee records...
        </div>
      ) : (
        <div className="fees-admin-card">

          <div className="fees-table-wrapper">

            <table className="fees-admin-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredFees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="fees-empty"
                    >
                      No fee records found.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((item) => {

                    const total =
                      Number(item.total_amount) || 0

                    const paid =
                      Number(item.paid_amount) || 0

                    const pending = Math.max(
                      total - paid,
                      0
                    )

                    let status = 'Pending'

                    if (pending === 0) {
                      status = 'Paid'
                    } else if (paid > 0) {
                      status = 'Partial'
                    }

                    return (
                      <tr key={item.id}>

                        <td>
                          <div className="fee-student">

                            <div className="fee-avatar">
                              {item.profiles?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || 'S'}
                            </div>

                            <div>
                              <strong>
                                {item.profiles?.full_name ||
                                  'Student'}
                              </strong>

                              <span>
                                {item.profiles?.student_id ||
                                  'N/A'}
                              </span>
                            </div>

                          </div>
                        </td>


                        <td>
                          <input
                            className="fee-number-input"
                            type="number"
                            min="0"
                            value={
                              item.total_amount ?? 0
                            }
                            onChange={(e) =>
                              updateFee(
                                item.id,
                                'total_amount',
                                e.target.value
                              )
                            }
                          />
                        </td>


                        <td>
                          <input
                            className="fee-number-input"
                            type="number"
                            min="0"
                            value={
                              item.paid_amount ?? 0
                            }
                            onChange={(e) =>
                              updateFee(
                                item.id,
                                'paid_amount',
                                e.target.value
                              )
                            }
                          />
                        </td>


                        <td>
                          <strong className="pending-amount">
                            {formatMoney(pending)}
                          </strong>
                        </td>


                        <td>
                          <input
                            className="fee-date-input"
                            type="date"
                            value={
                              item.due_date || ''
                            }
                            onChange={(e) =>
                              updateFee(
                                item.id,
                                'due_date',
                                e.target.value
                              )
                            }
                          />
                        </td>


                        <td>
                          <span
                            className={`fee-status fee-status-${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>


                        <td>
                          <button
                            type="button"
                            className="fee-save-btn"
                            disabled={
                              savingId === item.id
                            }
                            onClick={() =>
                              saveFee(item)
                            }
                          >
                            {savingId === item.id
                              ? 'Saving...'
                              : 'Save'}
                          </button>
                        </td>

                      </tr>
                    )
                  })
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}