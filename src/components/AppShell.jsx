import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-3">
          <Link to="/dashboard" className="text-lg font-semibold text-neon-cyan">HoloStem</Link>
          <nav className="flex items-center gap-2 text-sm">
            {['dashboard', 'profile', 'settings', 'admin'].map((path) => (
              <NavLink
                key={path}
                to={`/${path}`}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${isActive ? 'bg-neon-violet/40' : 'bg-white/5 hover:bg-white/10'}`
                }
              >
                {path[0].toUpperCase() + path.slice(1)}
              </NavLink>
            ))}
            {user && (
              <button className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10" onClick={handleSignOut}>
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
