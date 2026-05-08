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
  { to: '/upload', label: 'Upload video', icon: '⬆️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

const navIconBaseUrl = 'https://unrealcake8.github.io/cdn-hls'

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', iconFileName: 'home.png' },
  { to: '/dashboard?tab=following', label: 'Following', iconFileName: 'following.png' },
  { to: '/upload', label: 'Create', icon: '+' },
  { to: '/dashboard?tab=activity', label: 'Inbox', iconFileName: 'inbox.png' },
  { to: '/profile', label: 'Profile', iconFileName: 'profile.png' },
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
        .select('id, username, display_name, avatar_url')
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
      <p className="mb-2 text-xl font-medium theme-muted">Suggested accounts</p>
      <ul className="space-y-3">
        {accounts.map((account) => (
          <li key={account.id}>
            <div className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-black/10">
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
                  <span className="brand-avatar flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                    {(account.display_name || account.username || '?')[0].toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold leading-tight">
                    {account.display_name || account.username}
                  </p>
                  <p className="truncate text-sm theme-muted">@{account.username}</p>
                </div>
              </Link>
              {user?.id && user.id !== account.id && (
                <button
                  onClick={() => handleToggleFollow(account.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    followingMap[account.id]
                      ? 'brand-button-soft text-current'
                      : 'brand-button'
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
  const searchParams = new URLSearchParams(location.search)
  const currentSearchQuery = searchParams.get('q') ?? ''
  const currentTab = searchParams.get('tab') || 'for-you'
  const [searchText, setSearchText] = useState(currentSearchQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setSearchText(currentSearchQuery)
  }, [currentSearchQuery])

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (currentTab && currentTab !== 'for-you') {
      params.set('tab', currentTab)
    }
    if (searchText.trim()) {
      params.set('q', searchText.trim())
    }
    const query = params.toString()
    navigate(`/dashboard${query ? `?${query}` : ''}`)
  }

  return (
    <div className="theme-app-bg min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[280px_1fr_120px]">
        <aside className="theme-panel hidden border-r p-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-auto">
          <Link to="/dashboard" className="brand-wordmark text-4xl font-black tracking-tight">
            HoloStem
          </Link>
          <form className="mt-4" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="app-search">Search videos and profiles</label>
            <input
              id="app-search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="theme-input w-full rounded-full border px-4 py-2 text-sm"
              placeholder="🔍 Search videos and profiles"
              type="search"
            />
          </form>
          <nav className="mt-4 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  const itemPath = item.to.split('?')[0]
                  const itemSearch = item.to.split('?')[1] || ''
                  const itemTab = new URLSearchParams(itemSearch).get('tab') || 'for-you'
                  const active = itemPath === '/dashboard'
                    ? location.pathname === '/dashboard' && currentTab === itemTab
                    : isActive
                  return `flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-semibold transition ${
                    active ? 'brand-button-soft brand-accent-text' : 'hover:bg-[rgba(227,232,191,0.08)]'
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
              className="brand-outline mt-4 w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-[rgba(227,232,191,0.08)]"
            >
              Logout {user?.email ? `(${user.email})` : ''}
            </button>
          ) : (
            <NavLink
              to="/auth"
              className="brand-outline mt-4 block w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-[rgba(227,232,191,0.08)]"
            >
              Login / Sign up
            </NavLink>
          )}

          <SuggestedAccounts />
        </aside>

        <main className="pb-20 lg:pb-0">
          <section className={`mobile-shell-top fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 text-[var(--brand-cream)] lg:hidden ${location.pathname === '/dashboard' && currentTab === 'for-you' ? 'bg-transparent' : 'bg-[var(--brand-black)]'}`}>
            {location.pathname === '/dashboard' && currentTab === 'activity' ? (
              <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-extrabold">Inbox</h1>
            ) : location.pathname === '/dashboard' ? (
              <div className="flex w-full items-center justify-around pr-12 text-base font-bold text-[rgba(227,232,191,0.65)] drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">
                <Link to="/dashboard?tab=explore" className={currentTab === 'explore' ? 'text-[var(--brand-cream)]' : ''}>Explore</Link>
                <Link to="/dashboard" className={`relative ${currentTab === 'for-you' ? 'text-[var(--brand-cream)]' : ''}`}>
                  For You
                  {currentTab === 'for-you' && <span className="absolute -bottom-3 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-[var(--brand-cream)]" />}
                </Link>
              </div>
            ) : location.pathname === '/profile' || location.pathname.startsWith('/u/') ? (
              <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-extrabold">Profile</h1>
            ) : (
              <Link to="/dashboard" className="brand-wordmark text-2xl font-black tracking-tight">HoloStem</Link>
            )}
            {location.pathname === '/dashboard' ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-search-panel"
                className="absolute right-3 top-4 text-2xl leading-none text-[var(--brand-cream)]"
              >
                ⌕
              </button>
            ) : user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="absolute right-3 top-4 rounded-full border border-[rgba(227,232,191,0.25)] px-3 py-1 text-xs font-bold text-[var(--brand-cream)]"
              >
                Logout
              </button>
            ) : null}
            {mobileMenuOpen && (
              <form
                id="mobile-search-panel"
                onSubmit={(event) => { handleSearchSubmit(event); setMobileMenuOpen(false) }}
                className="absolute left-3 right-3 top-16 rounded-2xl bg-[rgba(18,24,13,0.97)] p-3 shadow-2xl"
              >
                <label className="sr-only" htmlFor="app-search-mobile">Search videos and profiles</label>
                <input
                  id="app-search-mobile"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="w-full rounded-full border border-[rgba(227,232,191,0.16)] bg-[rgba(227,232,191,0.10)] px-4 py-2 text-sm text-[var(--brand-cream)] placeholder:text-[rgba(227,232,191,0.5)]"
                  placeholder="Search videos and profiles"
                  type="search"
                />
              </form>
            )}
          </section>
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(227,232,191,0.16)] bg-[var(--brand-black)] px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 text-[var(--brand-cream)] lg:hidden">
        <ul className="grid grid-cols-5 items-end gap-1">
          {mobileNavItems.map((item) => {
            const itemSearch = item.to.split('?')[1] || ''
            const targetTab = new URLSearchParams(itemSearch).get('tab') || 'for-you'
            const active = item.to === '/upload'
              ? location.pathname === '/upload'
              : item.to === '/profile'
                ? location.pathname === '/profile' || location.pathname.startsWith('/u/')
                : location.pathname === '/dashboard' && currentTab === targetTab
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-bold ${
                    active ? 'text-[var(--brand-cream)]' : 'text-[rgba(227,232,191,0.55)]'
                  }`}
                >
                  {item.label === 'Create' ? (
                    <span className="brand-plus relative mb-0.5 grid h-8 w-12 place-items-center rounded-xl text-3xl font-black leading-none">+</span>
                  ) : (
                    <img
                      src={`${navIconBaseUrl}/${item.iconFileName}`}
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-7 object-contain"
                    />
                  )}
                  <span>{item.label === 'Create' ? '' : item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
