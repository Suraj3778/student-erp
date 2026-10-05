import { useState } from 'react'
import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase'
import {
  createDemoUser,
  demoAccounts,
  loginDemoUser,
} from '../lib/demoData'
import './Auth.css'

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [selectedRole, setSelectedRole] = useState('user')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentDetails, setStudentDetails] = useState({
    phone: '',
    student_id: '',
    course: '',
    department: '',
    section: '',
    semester: '',
    year_level: '',
    academic_year: '',
    admission_year: '',
    university: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    const cleanedEmail = email.trim()
    const cleanedPassword = password.trim()
    const cleanedFullName = fullName.trim()

    if (!cleanedEmail || !cleanedPassword) {
      setError('Please enter email and password.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!isLogin && !cleanedFullName) {
      setError('Please enter your full name.')
      return
    }
    if (!isLogin) {
      const missingField = Object.entries(studentDetails).some(([, value]) => !String(value).trim())
      if (missingField) {
        setError('Complete all student and academic information before registering.')
        return
      }
      if (!/^\d{4}-\d{2}$/.test(studentDetails.academic_year.trim())) {
        setError('Enter the academic year in YYYY-YY format, for example 2026-27.')
        return
      }
      if (!Number.isInteger(Number(studentDetails.semester)) ||
          Number(studentDetails.semester) < 1 || Number(studentDetails.semester) > 8) {
        setError('Select a semester from 1 to 8.')
        return
      }
      if (!Number.isInteger(Number(studentDetails.year_level)) ||
          Number(studentDetails.year_level) < 1 || Number(studentDetails.year_level) > 4) {
        setError('Select a year level from 1 to 4.')
        return
      }
      if (!Number.isInteger(Number(studentDetails.admission_year)) ||
          Number(studentDetails.admission_year) < 2000) {
        setError('Enter a valid admission year.')
        return
      }
    }

    try {
      setLoading(true)

      const demoMatch = demoAccounts[selectedRole]
      if (
        isLogin &&
        demoMatch &&
        cleanedEmail === demoMatch.email &&
        cleanedPassword === demoMatch.password
      ) {
        const { data, error } = loginDemoUser({
          email: cleanedEmail,
          password: cleanedPassword,
          role: selectedRole,
        })

        if (error) throw error

        if (data?.user) {
          await onLogin(data.user, selectedRole)
          return
        }
      }

      if (!isSupabaseConfigured) {
        if (isLogin) {
          const { data, error } = loginDemoUser({
            email: cleanedEmail,
            password: cleanedPassword,
            role: selectedRole,
          })

          if (error) throw error

          if (data?.user) {
            await onLogin(data.user, selectedRole)
          }
        } else {
          const { data, error } = createDemoUser({
            email: cleanedEmail,
            password: cleanedPassword,
            options: {
              data: {
                full_name: cleanedFullName,
                ...studentDetails,
              },
            },
          })

          if (error) throw error

          if (data?.user) {
            setSuccess(
              'Demo account created successfully. You can now log in.'
            )
            setIsLogin(true)
          }
        }

        return
      }

      if (isLogin) {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: cleanedEmail,
            password: cleanedPassword,
          })

        if (error) throw error

        if (data?.user) {
          await onLogin(data.user, selectedRole)
        }
      } else {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanedEmail,
            password: cleanedPassword,
            options: {
              data: {
                full_name: cleanedFullName,
                portal_registration: 'student',
                phone: studentDetails.phone.trim(),
                student_id: studentDetails.student_id.trim(),
                course: studentDetails.course.trim(),
                department: studentDetails.department.trim(),
                section: studentDetails.section.trim(),
                semester: Number(studentDetails.semester),
                year_level: Number(studentDetails.year_level),
                academic_year: studentDetails.academic_year.trim(),
                admission_year: Number(studentDetails.admission_year),
                university: studentDetails.university.trim(),
              },
            },
          })

        if (error) throw error

        if (data?.user) {
          if (data.session) {
            await onLogin(data.user, 'user')
          } else {
            setSuccess(
              'Account created successfully. Please check your email to verify your account.'
            )

            setIsLogin(true)
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError(
        error?.message ||
          'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-page ${isLogin ? '' : 'auth-page-register'}`}>

      <div className={`auth-card ${isLogin ? '' : 'auth-card-register'}`}>

        <div className="auth-logo">
          <div className="auth-logo-icon">SP</div>
        </div>

        <div className="auth-header">
          <h1>
            Student<span>Hub</span>
          </h1>

          <p>
            United University Student Portal
          </p>
        </div>

        <div className="auth-tabs">

          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true)
              setError('')
              setSuccess('')
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false)
              setSelectedRole('user')
              setError('')
              setSuccess('')
            }}
          >
            Sign Up
          </button>

        </div>

        {isLogin && (
          <div className="auth-role-switch" role="tablist" aria-label="Select account type">
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'user'}
              className={selectedRole === 'user' ? 'active' : ''}
              onClick={() => {
                setSelectedRole('user')
                setError('')
                setSuccess('')
              }}
            >
              User
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'admin'}
              className={selectedRole === 'admin' ? 'active' : ''}
              onClick={() => {
                setSelectedRole('admin')
                setError('')
                setSuccess('')
              }}
            >
              Admin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'teacher'}
              className={selectedRole === 'teacher' ? 'active' : ''}
              onClick={() => {
                setSelectedRole('teacher')
                setError('')
                setSuccess('')
              }}
            >
              Teacher
            </button>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {!isLogin && (
            <div className="auth-registration-grid">
              <label className="auth-field">
                <span>Full Name</span>
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" autoComplete="name" />
              </label>
              {[
                ['phone', 'Phone number', 'tel'],
                ['student_id', 'Student ID', 'text'],
                ['course', 'Course / program', 'text'],
                ['department', 'Department', 'text'],
                ['section', 'Section', 'text'],
                ['academic_year', 'Academic year (YYYY-YY)', 'text'],
                ['admission_year', 'Admission year', 'number'],
                ['university', 'University', 'text'],
              ].map(([key, label, type]) => (
                <label className="auth-field" key={key}>
                  <span>{label}</span>
                  <input
                    required
                    type={type}
                    min={key === 'admission_year' ? '2000' : undefined}
                    value={studentDetails[key]}
                    onChange={(event) => setStudentDetails((previous) => ({ ...previous, [key]: event.target.value }))}
                  />
                </label>
              ))}
              <label className="auth-field">
                <span>Semester</span>
                <select required value={studentDetails.semester} onChange={(event) => setStudentDetails((previous) => ({ ...previous, semester: event.target.value }))}>
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => <option key={semester} value={semester}>{semester}</option>)}
                </select>
              </label>
              <label className="auth-field">
                <span>Year level</span>
                <select required value={studentDetails.year_level} onChange={(event) => setStudentDetails((previous) => ({ ...previous, year_level: event.target.value }))}>
                  <option value="">Select year level</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="auth-field">

            <label>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
            />

          </div>

          <div className="auth-field">

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete={
                isLogin
                  ? 'current-password'
                  : 'new-password'
              }
            />

          </div>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
              ? `${selectedRole === 'admin' ? 'Admin' : selectedRole === 'teacher' ? 'Teacher' : 'User'} Login`
              : 'Create Student Account'}
          </button>

        </form>

        {isLogin && demoAccounts[selectedRole] && (
          <p className="auth-demo-hint">
            Demo {selectedRole} login: {demoAccounts[selectedRole].email} / {demoAccounts[selectedRole].password}
          </p>
        )}

        <div className="auth-footer">

          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false)
                  setSelectedRole('user')
                  setError('')
                  setSuccess('')
                }}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                  setSuccess('')
                }}
              >
                Login
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  )
}

export default Auth