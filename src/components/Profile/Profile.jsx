import { useState } from 'react'
import './Profile.css'

export default function Profile({
  profile = null,
  user = null,
  onSave,
  allowAddress = false,
  accountRole = 'user',
  assignedSubjects = [],
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    'Student'

  const email =
    profile?.email ||
    user?.email ||
    'Not available'

  const studentId =
    profile?.student_id ||
    'N/A'

  const phone =
    profile?.phone ||
    'Not available'

  const course =
    profile?.course ||
    'BCA'

  const semester =
    profile?.semester ||
    '—'

  const department =
    profile?.department ||
    'Computer Applications'

  const university =
    profile?.university ||
    'United University Prayagraj'
  const isStudent = accountRole === 'user'
  const roleLabel = accountRole === 'admin' ? 'Administrator' : accountRole === 'teacher' ? 'Teacher' : 'Student'
  const roleId = accountRole === 'teacher' ? profile?.teacher_id || email : null

  const profileImage =
    profile?.profile_image ||
    ''

  const initial =
    studentName
      .charAt(0)
      .toUpperCase()

  return (
    <section className="profile-page">

      {/* Header */}
      <div className="profile-page-header">

        <div>
          <h1>My Profile</h1>

          <p>
            View and manage your {roleLabel.toLowerCase()} profile.
          </p>
        </div>

        <button
          type="button"
          className="profile-edit-btn"
          onClick={() =>
            setShowEdit(!showEdit)
          }
        >
          {showEdit ? 'Cancel' : 'Edit Profile'}
        </button>

      </div>

      {/* Profile Hero */}
      <section className="profile-hero">

        <div className="profile-avatar">

          {profileImage ? (
            <img
              src={profileImage}
              alt={studentName}
            />
          ) : (
            <span>
              {initial}
            </span>
          )}

        </div>

        <div className="profile-hero-info">

          <h2>
            {studentName}
          </h2>

          <p>{isStudent ? `${course} • Semester ${semester}` : roleLabel}</p>
          {isStudent ? (
          <span className="profile-student-id">Student ID: {studentId}</span>
          ) : (
          <span className="profile-student-id">{roleLabel} account · {email}</span>
          )}

        </div>

      </section>

      {/* Profile Details */}
      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h2>Personal Information</h2>

            <p>Your basic account information.</p>
          </div>

        </div>

        <div className="profile-details-grid">

          <div className="profile-detail">

            <span>Full Name</span>

            <strong>
              {studentName}
            </strong>

          </div>

          <div className="profile-detail">

            <span>Email Address</span>

            <strong>
              {email}
            </strong>

          </div>

          {isStudent ? (
            <div className="profile-detail">
              <span>Student ID</span>
              <strong>{studentId}</strong>
            </div>
          ) : (
            <div className="profile-detail">
              <span>Account role</span>
              <strong>{roleLabel}</strong>
            </div>
          )}

          <div className="profile-detail">

            <span>Phone Number</span>

            <strong>
              {phone}
            </strong>

          </div>

        </div>

      </section>

      {isStudent ? (
      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h2>Academic Information</h2>

            <p>
              Your current academic details.
            </p>
          </div>

        </div>

        <div className="profile-details-grid">

          <div className="profile-detail">

            <span>Course</span>

            <strong>
              {course}
            </strong>

          </div>

          <div className="profile-detail">
            <span>Semester</span>

            <strong>
              Semester {semester}
            </strong>

          </div>

          <div className="profile-detail">
            <span>Section</span>
            <strong>{profile?.section || 'Not assigned'}</strong>
          </div>

          <div className="profile-detail">
            <span>Year level</span>
            <strong>{profile?.year_level || 'Not assigned'}</strong>
          </div>

          <div className="profile-detail">
            <span>Academic year</span>
            <strong>{profile?.academic_year || 'Not assigned'}</strong>
          </div>

          <div className="profile-detail">
            <span>Admission year</span>
            <strong>{profile?.admission_year || 'Not available'}</strong>
          </div>

          <div className="profile-detail">

            <span>Department</span>

            <strong>
              {department}
            </strong>

          </div>

          <div className="profile-detail">

            <span>University</span>

            <strong>
              {university}
            </strong>

          </div>

        </div>

      </section>
      ) : (
        <section className="profile-card">
          <div className="profile-card-header">
            <div><h2>{accountRole === 'admin' ? 'Administrator access' : 'Faculty access'}</h2>
              <p>{accountRole === 'admin' ? 'Administrative account permissions.' : 'Your assigned subject codes.'}</p>
            </div>
          </div>
          <div className="profile-details-grid">
            <div className="profile-detail"><span>Account role</span><strong>{roleLabel}</strong></div>
            <div className="profile-detail"><span>Login ID</span><strong>{roleId || email}</strong></div>
            {accountRole === 'admin' && <div className="profile-detail"><span>Access</span><strong>Portal administration</strong></div>}
            {accountRole === 'teacher' && (
              <div className="profile-detail">
                <span>Assigned subjects</span>
                <strong>{assignedSubjects.length ? assignedSubjects.map((subject) => subject.code).filter(Boolean).join(', ') : 'No subjects assigned'}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Edit Notice */}
      {showEdit && (
        <section className="profile-card profile-edit-card">

          <div className="profile-card-header">

            <div>
              <h2>Edit Profile</h2>

              <p>Update your contact details and display name.</p>
            </div>

          </div>

          <form
            className="profile-form"
            onSubmit={async (event) => {
              event.preventDefault()
              setSaving(true)
              setMessage(null)
              try {
                await onSave?.({
                  full_name: form.full_name.trim(),
                  phone: form.phone.trim(),
                  address: form.address.trim(),
                })
                setShowEdit(false)
                setMessage({ kind: 'success', text: 'Profile updated successfully.' })
              } catch (error) {
                setMessage({ kind: 'error', text: error.message || 'Could not update profile.' })
              } finally {
                setSaving(false)
              }
            }}
          >
            <label className="profile-form-group">
              <span>Full Name</span>
              <input required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
            </label>
            <label className="profile-form-group">
              <span>Phone Number</span>
              <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            {allowAddress && (
              <label className="profile-form-group profile-form-wide">
                <span>Address</span>
                <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </label>
            )}
            {message && <div className={`profile-${message.kind}`}>{message.text}</div>}
            <div className="profile-form-actions">
              <button type="button" className="profile-cancel-btn" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="profile-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>

        </section>
      )}
      {message && !showEdit && <p className={`profile-${message.kind}`}>{message.text}</p>}

      {/* Account Information */}
      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h2>Account Information</h2>

            <p>
              Your portal account details.
            </p>
          </div>

        </div>

        <div className="profile-account-row">

          <div className="profile-account-icon">
            🔐
          </div>

          <div>
            <strong>
              Account Status
            </strong>

            <span>
              Active
            </span>
          </div>

        </div>

      </section>

    </section>
  )
}