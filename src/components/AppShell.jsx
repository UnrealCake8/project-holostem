import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchFollowStatus, followUser, unfollowUser } from '../lib/contentApi'

const menuItems = [
  { to: '/dashboard', label: 'For You', icon: '🏠' },
  { to: '/dashboard?tab=explore', label: 'Explore', icon: '🧭' },
  { to: '/dashboard?tab=following', label: 'Following', icon: '🫧' },
  { to: '/dashboard?tab=activity', label: 'Activity', icon: '🔔' },
  { to: '/upload', label: 'Add Video Link', icon: '🔗' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

function SuggestedAccounts() {
  const [accounts, setAccounts] = useState([])
  const [followingMap, setFollowingMap] = useState({})
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      // Fetch up to 5 real profiles — exclude the current logged-in user
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .not('username', 'is', null)
        .limit(5)

      if (user?.id) {
        query = query.neq('id', user.id)
      }

      const { data, error } = await query
      if (!error && data) setAccounts(data)
    }
    load()
  }, [user?.id])

  useEffect(() => {
    async function hydrateStatuses() {
      if (!user?.id || accounts.length === 0) return
      const entries = await Promise.all(
        accounts.map(async (account) => [account.id, await fetchFollowStatus(user.id, account.id)]),
      )
      setFollowingMap(Object.fromEntries(entries))
    }
    hydrateStatuses()
  }, [accounts, user?.id])

  async function handleToggleFollow(accountId) {
    if (!user?.id) return
    const next = !followingMap[accountId]
    setFollowingMap((prev) => ({ ...prev, [accountId]: next }))
    try {
      if (next) await followUser(user.id, accountId)
      else await unfollowUser(user.id, accountId)
    } catch {
      setFollowingMap((prev) => ({ ...prev, [accountId]: !next }))
    }
  }

  if (accounts.length === 0) return null

  return (
    <div className="mt-6 border-t border-black/10 pt-4 simple-mode-hidden">
      <p className="mb-2 text-xl font-medium text-black/60">Suggested accounts</p>
      <ul className="space-y-3">
        {accounts.map((account) => (
          <li key={account.id}>
            <div className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-black/5">
              <Link
                to={`/u/${account.username}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {account.avatar_url ? (
                  <img
                    src={account.avatar_url}
                    alt={account.username}
                    className="h-10 w-10 rounded-full object-cover bg-black/20"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                    {(account.full_name || account.username || '?')[0].toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold leading-tight">
                    {account.full_name || account.username}
                  </p>
                  <p className="truncate text-sm text-black/45">@{account.username}</p>
                </div>
              </Link>
              {user?.id && user.id !== account.id && (
                <button
                  onClick={() => handleToggleFollow(account.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    followingMap[account.id]
                      ? 'bg-black/10 text-black'
                      : 'bg-pink-500 text-white'
                  }`}
                >
                  {followingMap[account.id] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
          <Link to="/dashboard" className="text-4xl font-black tracking-tight">
            HoloStem
          </Link>
          <div className="mt-4 rounded-full bg-black/5 px-4 py-2 text-sm text-black/50">
            🔍 Search
          </div>
          <nav className="mt-4 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  const activeByQuery =
                    location.pathname === '/dashboard' &&
                    location.search === item.to.replace('/dashboard', '')
                  const active = isActive || activeByQuery
                  return `flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-semibold transition ${
                    active ? 'bg-pink-50 text-pink-600' : 'hover:bg-black/5'
                  }`
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {user ? (
            <button
              onClick={handleSignOut}
              className="mt-4 w-full rounded-lg border border-black/10 px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              Logout {user?.email ? `(${user.email})` : ''}
            </button>
          ) : (
            <NavLink
              to="/auth"
              className="mt-4 block w-full rounded-lg border border-black/10 px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              Login / Sign up
            </NavLink>
          )}

          <SuggestedAccounts />
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
