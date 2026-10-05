import { useState } from 'react'
import './ForcedPasswordChange.css'

export default function ForcedPasswordChange({ onSubmit }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('Choose a password with at least 12 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }

    try {
      setSaving(true)
      await onSubmit(password)
    } catch (submitError) {
      console.error('Required password change failed:', submitError)
      setError(submitError.message || 'Could not update your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="forced-password-page">
      <section className="forced-password-card">
        <div className="forced-password-mark" aria-hidden="true">SH</div>
        <p className="forced-password-eyebrow">ACCOUNT SECURITY</p>
        <h1>Set your personal password</h1>
        <p className="forced-password-copy">
          Your administrator gave you a temporary password. Create a new password to continue to your teacher workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>

          <p className="forced-password-hint">Use at least 12 characters.</p>
          {error && <p className="forced-password-error" role="alert">{error}</p>}
          <button type="submit" disabled={saving}>
            {saving ? 'Updating password…' : 'Update password and continue'}
          </button>
        </form>
      </section>
    </main>
  )
}
