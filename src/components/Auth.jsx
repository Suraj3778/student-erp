import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('role')
  const [selectedRole, setSelectedRole] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function resetMessages() {
    setMessage('')
    setError('')
  }

  function changeMode(newMode) {
    setMode(newMode)
    resetMessages()
  }

  function selectRole(role) {
    setSelectedRole(role)
    setMode('login')
    resetMessages()
  }

  function returnToRoleSelection() {
    setMode('role')
    setSelectedRole(null)
    resetMessages()
  }

  async function handleLogin(e) {
    e.preventDefault()

    resetMessages()

    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }

    try {
      setLoading(true)

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) {
        throw loginError
      }

      if (data?.user) {
        const expectedRole = selectedRole === 'student' ? 'user' : selectedRole || 'user'
        await onLogin?.(data.user, expectedRole)
      }
      setMessage('Login successful.')

    } catch (err) {
      console.error('Login error:', err)

      setError(
        err.message ||
        'Unable to login.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()

    resetMessages()

    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      )
      return
    }

    try {
      setLoading(true)

      const {
        data,
        error: signupError,
      } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      if (signupError) {
        throw signupError
      }

      if (data?.session && data?.user) {
        await onLogin?.(data.user, 'user')

        setMessage(
          'Account created successfully.'
        )
      } else {
        setMessage(
          'Account created. Please check your email to verify your account.'
        )
      }

    } catch (err) {
      console.error('Signup error:', err)

      setError(
        err.message ||
        'Unable to create account.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()

    resetMessages()

    if (!email.trim()) {
      setError(
        'Please enter your email address.'
      )
      return
    }

    try {
      setLoading(true)

      const {
        error: resetError,
      } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      )

      if (resetError) {
        throw resetError
      }

      setMessage(
        'Password reset link has been sent to your email.'
      )

    } catch (err) {
      console.error(
        'Password reset error:',
        err
      )

      setError(
        err.message ||
        'Unable to send reset email.'
      )
    } finally {
      setLoading(false)
    }
  }

  function renderLogin() {
    return (
      <form
        className="auth-form"
        onSubmit={handleLogin}
      >

        <div className="auth-field">
          <label htmlFor="auth-login-email">Email Address</label>

          <input
            id="auth-login-email"
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
          <label htmlFor="auth-login-password">Password</label>

          <div className="password-wrapper">

            <input
              id="auth-login-password"
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

          </div>
        </div>

        <div className="auth-forgot">
          <button
            type="button"
            onClick={() =>
              changeMode('forgot')
            }
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading}
        >
          {loading
            ? 'Signing in...'
            : 'Sign In'}
        </button>

      </form>
    )
  }

  function renderSignup() {
    return (
      <form
        className="auth-form"
        onSubmit={handleSignup}
      >

        <div className="auth-field">
          <label htmlFor="auth-signup-name">Full Name</label>

          <input
            id="auth-signup-name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Enter your full name"
            autoComplete="name"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="auth-signup-email">Email Address</label>

          <input
            id="auth-signup-email"
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
          <label htmlFor="auth-signup-password">Password</label>

          <div className="password-wrapper">

            <input
              id="auth-signup-password"
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

          </div>
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading}
        >
          {loading
            ? 'Creating Account...'
            : 'Create Account'}
        </button>

      </form>
    )
  }

  function renderForgot() {
    return (
      <form
        className="auth-form"
        onSubmit={handleForgotPassword}
      >

        <div className="auth-forgot-info">
          Enter your registered email address and
          we'll send you a password reset link.
        </div>

        <div className="auth-field">
          <label htmlFor="auth-reset-email">Email Address</label>

          <input
            id="auth-reset-email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading}
        >
          {loading
            ? 'Sending...'
            : 'Send Reset Link'}
        </button>

        <button
          type="button"
          className="auth-back-btn"
          onClick={() =>
            changeMode('login')
          }
        >
          ← Back to Login
        </button>

      </form>
    )
  }

  return (
    <div className="auth-page">

      <div className="auth-container">

        {/* Left Side */}

        <div className="auth-brand">

          <div className="auth-brand-logo">
            S
          </div>

          <h1>StudentHub</h1>

          <p>
            United University Prayagraj
          </p>

          <div className="auth-brand-info">
            <span>🎓</span>

            <div>
              <strong>
                Manage your academics
              </strong>

              <p>
                Courses, attendance, assignments,
                results and more.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side */}

        <div className="auth-card">

          {mode === 'role' ? (
            <>
              <div className="auth-card-header">
                <p className="auth-overline">SECURE PORTAL ACCESS</p>
                <h2>Choose your workspace</h2>
                <p>Select your role to continue to the appropriate sign-in.</p>
              </div>

              <div className="auth-role-grid" aria-label="Choose a sign-in role">
                <button
                  type="button"
                  className="auth-role-card"
                  onClick={() => selectRole('student')}
                >
                  <span className="auth-role-icon auth-role-student" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c.5-3.5 3-5.5 7-5.5s6.5 2 7 5.5" />
                    </svg>
                  </span>
                  <span className="auth-role-title">Student</span>
                  <span className="auth-role-description">Courses, attendance and academic progress.</span>
                  <span className="auth-role-action">Continue <span aria-hidden="true">→</span></span>
                </button>
                <button
                  type="button"
                  className="auth-role-card"
                  onClick={() => selectRole('teacher')}
                >
                  <span className="auth-role-icon auth-role-teacher" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M3 5.5h18v12H3z" />
                      <path d="M8 21h8M12 17.5V21M7 9h4M7 12h7" />
                    </svg>
                  </span>
                  <span className="auth-role-title">Teacher</span>
                  <span className="auth-role-description">Attendance, marks and assigned classes.</span>
                  <span className="auth-role-action">Continue <span aria-hidden="true">→</span></span>
                </button>
                <button
                  type="button"
                  className="auth-role-card"
                  onClick={() => selectRole('admin')}
                >
                  <span className="auth-role-icon auth-role-admin" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 3 20 6v5.5c0 4.5-3.2 7.7-8 9.5-4.8-1.8-8-5-8-9.5V6z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <span className="auth-role-title">Administrator</span>
                  <span className="auth-role-description">Manage academic operations and records.</span>
                  <span className="auth-role-action">Continue <span aria-hidden="true">→</span></span>
                </button>
              </div>

              <p className="auth-role-security">
                Your access is determined by your verified account permissions.
              </p>
            </>
          ) : (
          <>
          <div className="auth-role-context">
            <button type="button" className="auth-back-btn" onClick={returnToRoleSelection}>
              ← Choose a different role
            </button>
            <span className="auth-role-pill">
              {selectedRole === 'admin' ? 'Administrator' : selectedRole === 'teacher' ? 'Teacher' : 'Student'} sign in
            </span>
          </div>

          <div className="auth-card-header">

            <h2>
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Reset Password'}
            </h2>

            <p>
              {mode === 'login'
                ? `Sign in with your ${selectedRole === 'admin' ? 'administrator' : selectedRole} account.`
                : mode === 'signup'
                  ? 'Create your student portal account.'
                  : 'Recover access to your account.'}
            </p>

          </div>

          {message && (
            <div className="auth-message success" role="status">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="auth-message error" role="alert">
              ⚠ {error}
            </div>
          )}

          {mode === 'login' &&
            renderLogin()}

          {mode === 'signup' &&
            renderSignup()}

          {mode === 'forgot' &&
            renderForgot()}

          {mode !== 'forgot' && (
            <div className="auth-switch">

              {mode === 'login' && selectedRole === 'student' ? (
                <>
                  Don't have an account?

                  <button
                    type="button"
                    onClick={() =>
                      changeMode('signup')
                    }
                  >
                    Create Account
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?

                  <button
                    type="button"
                    onClick={() =>
                      changeMode('login')
                    }
                  >
                    Sign In
                  </button>
                </>
              ) : selectedRole !== 'student' ? (
                <span>Use the account provided by your institution.</span>
              ) : null}

            </div>
          )}
          </>
          )}
        </div>

      </div>

    </div>
  )
}