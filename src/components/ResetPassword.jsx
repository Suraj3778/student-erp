import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './ResetPassword.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (
          event === 'PASSWORD_RECOVERY' ||
          event === 'SIGNED_IN'
        ) {
          setReady(true)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleUpdatePassword(e) {
    e.preventDefault()

    setMessage('')
    setError('')

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        throw updateError
      }

      setMessage(
        'Password updated successfully. You can now login with your new password.'
      )

      setPassword('')
      setConfirmPassword('')

    } catch (err) {
      console.error(
        'Password update error:',
        err
      )

      setError(
        err.message ||
        'Unable to update password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-page">

      <div className="reset-password-card">

        <div className="reset-password-logo">
          S
        </div>

        <h1>Reset Password</h1>

        <p className="reset-password-subtitle">
          Create a new password for your
          Student Portal account.
        </p>

        {message && (
          <div className="reset-message success">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="reset-message error">
            ⚠ {error}
          </div>
        )}

        {!ready && !message ? (
          <div className="reset-loading">
            Verifying password reset link...
          </div>
        ) : (
          <form
            onSubmit={handleUpdatePassword}
            className="reset-password-form"
          >

            <div className="reset-field">

              <label>
                New Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
              />

            </div>

            <div className="reset-field">

              <label>
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="reset-password-btn"
            >
              {loading
                ? 'Updating...'
                : 'Update Password'}
            </button>

          </form>
        )}

        <button
          type="button"
          className="reset-back-btn"
          onClick={() => {
            window.location.href = '/'
          }}
        >
          ← Back to Login
        </button>

      </div>

    </div>
  )
}