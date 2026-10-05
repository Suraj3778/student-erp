import './Fees.css'

export default function Fees({ fees = [], user = null, profile = null }) {
  const feeRecord = fees.find((item) =>
    item.student_id === user?.id ||
    item.student_id === profile?.student_id ||
    item.student_id === profile?.id
  )
  const totalFees = Math.max(0, Number(feeRecord?.total || 0))
  const paidFees = Math.min(totalFees, Math.max(0, Number(feeRecord?.paid || 0)))
  const pendingFees = totalFees - paidFees
  const paymentProgress = totalFees ? Math.round((paidFees / totalFees) * 100) : 0

  return (
    <section className="fees-page">
      <div className="fees-page-header">
        <div><h1>Fees</h1><p>View your fee details and payment status.</p></div>
        {feeRecord && <div className="fees-status-badge">{pendingFees > 0 ? 'Payment Pending' : 'Paid'}</div>}
      </div>

      {feeRecord ? (
        <>
          <div className="fees-summary">
            <div className="fee-summary-card"><div className="fee-summary-icon purple">₹</div><div><span>Total Fees</span><strong>₹{totalFees.toLocaleString('en-IN')}</strong></div></div>
            <div className="fee-summary-card"><div className="fee-summary-icon green">✓</div><div><span>Paid Amount</span><strong>₹{paidFees.toLocaleString('en-IN')}</strong></div></div>
            <div className="fee-summary-card"><div className="fee-summary-icon orange">!</div><div><span>Pending Amount</span><strong>₹{pendingFees.toLocaleString('en-IN')}</strong></div></div>
          </div>

          <section className="fees-card">
            <div className="fees-card-header"><div><h2>Payment Overview</h2><p>Semester {feeRecord.semester || profile?.semester || '—'} fee status.</p></div></div>
            <div className="fees-progress-section">
              <div className="fees-progress-header"><span>Payment Progress</span><strong>{paymentProgress}%</strong></div>
              <div className="fees-progress-bar"><span style={{ width: `${paymentProgress}%` }} /></div>
              <div className="fees-progress-info"><span>Paid: ₹{paidFees.toLocaleString('en-IN')}</span><span>Remaining: ₹{pendingFees.toLocaleString('en-IN')}</span></div>
            </div>
          </section>

          <section className="fees-card">
            <div className="fees-card-header"><div><h2>Fee Record</h2><p>Your current account summary.</p></div></div>
            <div className="fee-details-list">
              <div className="fee-detail-row"><div><strong>Semester {feeRecord.semester || profile?.semester || '—'} fee</strong><span>Total assessed amount</span></div><strong>₹{totalFees.toLocaleString('en-IN')}</strong></div>
              <div className="fee-detail-row"><div><strong>Payments received</strong><span>Amount recorded by accounts</span></div><strong>₹{paidFees.toLocaleString('en-IN')}</strong></div>
              <div className="fee-detail-total"><span>Balance due</span><strong>₹{pendingFees.toLocaleString('en-IN')}</strong></div>
            </div>
          </section>
          {pendingFees > 0 && <div className="fees-notice"><div className="fees-notice-icon">!</div><div><h3>Pending Fee Payment</h3><p>Your pending fee amount is ₹{pendingFees.toLocaleString('en-IN')}. Contact the accounts department for verified payment instructions.</p></div></div>}
        </>
      ) : (
        <section className="fees-card">
          <div className="no-data">No fee record is currently available for your account. Please contact the accounts department.</div>
        </section>
      )}
    </section>
  )
}
