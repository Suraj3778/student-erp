import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Profile.css'

export default function Profile({ profile, user }) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    })
  }, [profile])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setMessage('')
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!form.full_name.trim()) {
      setError('Please enter your full name.')
      return
    }

    try {
      setSaving(true)

      const {
        data,
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
      })

      setMessage('Profile updated successfully.')

    } catch (err) {
      console.error('Profile update error:', err)

      setError(
        err.message ||
        'Unable to update profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  const studentId =
    profile?.student_id || 'N/A'

  const course =
    profile?.course || 'BCA'

  const semester =
    profile?.semester || 6

  const department =
    profile?.department ||
    'Computer Applications'

  const university =
    profile?.university ||
    'United University Prayagraj'

  const email =
    profile?.email ||
    user?.email ||
    ''

  return (
    <section className="profile-page">

      {/* Header */}

      <div className="profile-page-header">
        <div>
          <h1>My Profile</h1>

          <p>
            View and update your personal information.
          </p>
        </div>
      </div>

      {/* Profile Card */}

      <div className="profile-layout">

        {/* Left Profile Card */}

        <section className="profile-card profile-overview">

          <div className="profile-avatar">
            {form.full_name
              ? form.full_name
                  .charAt(0)
                  .toUpperCase()
              : 'S'}
          </div>

          <h2>
            {form.full_name || 'Student'}
          </h2>

          <p className="profile-student-id">
            {studentId}
          </p>

          <span className="profile-course-badge">
            {course}
          </span>

          <div className="profile-overview-details">

            <div>
              <span>Semester</span>
              <strong>
                {semester}
              </strong>
            </div>

            <div>
              <span>Department</span>
              <strong>
                {department}
              </strong>
            </div>

          </div>

        </section>

        {/* Right Details */}

        <section className="profile-card">

          <div className="profile-card-header">
            <div>
              <h2>Personal Information</h2>

              <p>
                Update your personal details below.
              </p>
            </div>
          </div>

          <form
            className="profile-form"
            onSubmit={handleSave}
          >

            {/* Name */}

            <div className="profile-form-group">

              <label htmlFor="full_name">
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

            </div>

            {/* Email */}

            <div className="profile-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                disabled
              />

              <small>
                Email is managed through your
                authentication account.
              </small>

            </div>

            {/* Phone */}

            <div className="profile-form-group">

              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />

            </div>

            {/* Student ID */}

            <div className="profile-form-group">

              <label>
                Student ID
              </label>

              <input
                type="text"
                value={studentId}
                disabled
              />

            </div>

            {/* Course */}

            <div className="profile-form-group">

              <label>
                Course
              </label>

              <input
                type="text"
                value={course}
                disabled
              />

            </div>

            {/* University */}

            <div className="profile-form-group">

              <label>
                University
              </label>

              <input
                type="text"
                value={university}
                disabled
              />

            </div>

            {/* Messages */}

            {message && (
              <div className="profile-success">
                ✓ {message}
              </div>
            )}

            {error && (
              <div className="profile-error">
                ⚠ {error}
              </div>
            )}

            {/* Save */}

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </form>

        </section>

      </div>

    </section>
  )
}