import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { appConfig } from '../config/appConfig'

const navItems = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/watch', label: 'Watch' },
  { to: '/app/listen', label: 'Listen' },
  { to: '/app/play', label: 'Play' },
  { to: '/app/social', label: 'Social' },
  { to: '/app/profile', label: 'Profile' },
  { to: '/app/settings', label: 'Settings' },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>{appConfig.appName}</h1>
        <p className="muted">PWA Media Platform</p>
        <nav className="side-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="muted">Signed in as</p>
            <strong>{user?.fullName}</strong>
          </div>
          <button type="button" className="btn" onClick={handleLogout}>
            Sign out
          </button>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
