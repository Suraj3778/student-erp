import './Header.css'

export default function Header({
  studentName = 'Student',
  profile = null,
  sidebarOpen = false,
  setSidebarOpen,
  accountRole = 'user',
}) {
  const firstName =
    studentName?.split(' ')[0] || 'Student'

  const profileImage =
    profile?.profile_image || ''

  return (
    <header className="student-header">

      <div className="header-left">

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() =>
            setSidebarOpen?.(!sidebarOpen)
          }
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <div className="header-welcome">
          <span>Welcome back</span>

          <strong title={studentName}>
            {firstName}
          </strong>
        </div>

      </div>

      <div className="header-right">

        <button
          type="button"
          className="header-icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          🔔
        </button>

        <div className="header-profile">

          {profileImage ? (
            <img
              src={profileImage}
              alt={`${studentName} profile`}
              loading="lazy"
            />
          ) : (
            <div className="header-avatar" aria-label={`${studentName} initial`}>
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="header-profile-info">

            <strong>
              {studentName}
            </strong>

            <span>
              {accountRole === 'admin' ? 'Administrator' : accountRole === 'teacher' ? 'Faculty' : profile?.course || 'BCA'}
            </span>

          </div>

        </div>

      </div>

    </header>
  )
}