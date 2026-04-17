import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const menuItems = [
  { to: '/dashboard', label: 'For You', icon: '🏠' },
  { to: '/dashboard?tab=explore', label: 'Explore', icon: '🧭' },
  { to: '/dashboard?tab=following', label: 'Following', icon: '🫧' },
  { to: '/dashboard?tab=friends', label: 'Friends', icon: '👥' },
  { to: '/dashboard?tab=activity', label: 'Activity', icon: '🔔' },
  { to: '/upload', label: 'Upload', icon: '⬆️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

const demoAccounts = [
  { name: 'Quran', handle: 'coran________' },
  { name: 'CEZ_16', handle: 'cez_16c' },
  { name: 'Extra Ci James', handle: 'extracijames' },
  { name: 'mia’s comet', handle: 'miatheswimmer' },
]

export default function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#131313]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[280px_1fr_120px]">
        <aside className="border-r border-black/10 bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
          <Link to="/dashboard" className="text-4xl font-black tracking-tight">HoloStem</Link>

          <div className="mt-4 rounded-full bg-black/5 px-4 py-2 text-sm text-black/50">🔍 Search</div>

          <nav className="mt-4 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  const activeByQuery = location.pathname === '/dashboard' && location.search === item.to.replace('/dashboard', '')
                  const active = isActive || activeByQuery
                  return `flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-semibold transition ${active ? 'bg-pink-50 text-pink-600' : 'hover:bg-black/5'}`
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button onClick={handleSignOut} className="mt-4 w-full rounded-lg border border-black/10 px-3 py-2 text-left text-sm hover:bg-black/5">
            Logout {user?.email ? `(${user.email})` : ''}
          </button>

          <div className="mt-6 border-t border-black/10 pt-4">
            <p className="mb-2 text-xl font-medium text-black/60">Following accounts</p>
            <ul className="space-y-3">
              {demoAccounts.map((account) => (
                <li key={account.handle} className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-black/20" />
                  <div>
                    <p className="text-lg font-semibold leading-tight">{account.name}</p>
                    <p className="text-base text-black/45">{account.handle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="px-2 py-4 sm:px-4 lg:px-6">
          <Outlet />
        </main>

        <aside className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-8">
          {Array.from({ length: 7 }).map((_, index) => (
            <button
              key={index}
              type="button"
              className="h-14 w-14 rounded-full bg-black/8 text-2xl text-black/50 hover:bg-black/15"
            >
              {index === 1 ? '⌃' : index === 2 ? '⌄' : ''}
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}
