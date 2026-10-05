import './Sidebar.css'

export default function Sidebar({
  active = 'dashboard',
  setActive,
  sidebarOpen = false,
  setSidebarOpen,
  studentName = 'Student',
  studentId = 'N/A',
  onLogout,
  userRole = 'user',
  accountRole = userRole,
}) {
  const menuItems = userRole === 'admin'
    ? [
        { id: 'dashboard', label: 'Admin Dashboard', icon: '🏠' },
        { id: 'students', label: 'Students', icon: '👥' },
        { id: 'courses', label: 'Courses', icon: '📚' },
        { id: 'enrollments', label: 'Enrollments', icon: '🔗' },
        { id: 'teacher_subjects', label: 'Teachers & Subjects', icon: '👩‍🏫' },
        { id: 'assignments', label: 'Assignments', icon: '📝' },
        { id: 'attendance', label: 'Attendance', icon: '📊' },
        { id: 'results', label: 'Reports', icon: '📈' },
        { id: 'timetable', label: 'Schedule', icon: '🗓️' },
        { id: 'fees', label: 'Fees', icon: '💳' },
        { id: 'profile', label: 'Profile', icon: '👤' },
      ]
    : userRole === 'teacher'
      ? [
          { id: 'teacher-workspace', label: 'Attendance & Marks', icon: '📊' },
          { id: 'profile', label: 'Faculty Profile', icon: '👤' },
        ]
      : [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'courses', label: 'My Courses', icon: '📚' },
        { id: 'attendance', label: 'Attendance', icon: '📊' },
        { id: 'assignments', label: 'Assignments', icon: '📝' },
        { id: 'results', label: 'Results', icon: '🎓' },
        { id: 'timetable', label: 'Timetable', icon: '🗓️' },
        { id: 'fees', label: 'Fees', icon: '💳' },
        { id: 'profile', label: 'Profile', icon: '👤' },
      ]

  const handleNavigation = (id) => {
    setActive?.(id)
    setSidebarOpen?.(false)
  }

  const handleLogout = async () => {
    setSidebarOpen?.(false)
    await onLogout?.()
  }

  const initial =
    studentName
      ?.charAt(0)
      ?.toUpperCase() || 'S'

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen?.(false)
          }
        />
      )}

      <aside
        className={`student-sidebar ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >

        {/* Logo */}
        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            SP
          </div>

          <div className="sidebar-logo-text">
            <strong>
              {userRole === 'admin' ? 'Admin' : userRole === 'teacher' ? 'Faculty' : 'Student'}<span>Portal</span>
            </strong>

            <small>
              United University
            </small>
          </div>

        </div>

        {/* Student Profile */}
        <div className="sidebar-student">

          <div className="sidebar-avatar">
            {initial}
          </div>

          <div className="sidebar-student-info">

            <strong>
              {studentName}
            </strong>

            <span>
              {accountRole === 'admin' ? 'Administrator' : accountRole === 'teacher' ? `Teacher · ${studentId}` : studentId}
            </span>

          </div>

        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">

          <p className="sidebar-section-title">
            MENU
          </p>

          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={active === item.id}
              className={`sidebar-menu-item ${
                active === item.id
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleNavigation(item.id)
              }
            >

              <span className="sidebar-menu-icon">
                {item.icon}
              </span>

              <span className="sidebar-menu-label">
                {item.label}
              </span>

            </button>
          ))}

        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">

          <div className="sidebar-help">

            <div className="sidebar-help-icon">
              💡
            </div>

            <div>
              <strong>
                Need Help?
              </strong>

              <span>
                Contact support
              </span>
            </div>

          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>
              🚪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>
    </>
  )
}