import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { appConfig } from './config/appConfig'
import { useAuth } from './features/auth/AuthContext'
import {
  listenCatalog,
  playCatalog,
  socialFeatures,
  watchCatalog,
} from './features/content/mockCatalog'

function AuthGate({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestGate({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/app" replace /> : children
}

function AuthForm({ mode }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    const result = isSignup ? signUp(payload) : signIn(payload)

    if (!result.ok) {
      const entries = Object.values(result.errors || {})
      setError(entries.flat().join('. '))
      return
    }

    window.location.assign('/app')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <p className="muted">HoloStem MVP with production-style architecture</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && <input name="fullName" placeholder="Full name" required />}
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn primary">
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="muted">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a href={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Sign in' : 'Create one'}
          </a>
        </p>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const stats = useMemo(
    () => [
      { label: 'Watch items', value: watchCatalog.length },
      { label: 'Listen items', value: listenCatalog.length },
      { label: 'Games', value: playCatalog.length },
      { label: 'Plan', value: user?.plan === 'premium' ? 'Premium' : 'Free' },
    ],
    [user?.plan],
  )

  return (
    <section>
      <h2>Dashboard</h2>
      <p className="muted">All-in-one media, social, and entertainment platform.</p>
      <div className="grid cards">
        {stats.map((item) => (
          <article key={item.label} className="card">
            <h3>{item.label}</h3>
            <p>{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function CatalogPage({ title, items, metaKey }) {
  const [query, setQuery] = useState('')
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase().trim()),
  )

  return (
    <section>
      <h2>{title}</h2>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${title.toLowerCase()}`}
        className="search"
      />
      <div className="grid cards">
        {filtered.map((item) => (
          <article key={item.id} className="card">
            <h3>{item.title}</h3>
            <p>{item.type}</p>
            <p className="muted">{item[metaKey]}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function SocialPage() {
  return (
    <section>
      <h2>Social Hub</h2>
      <p className="muted">Core capabilities scoped for future backend integration.</p>
      <div className="list">
        {socialFeatures.map((item) => (
          <div key={item} className="list-item">
            {item}
          </div>
        ))}
      </div>
      <p className="muted">API base: {appConfig.apiBaseUrl}</p>
    </section>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  return (
    <section>
      <h2>Profile</h2>
      <div className="card">
        <p>
          <strong>Name:</strong> {user?.fullName}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Plan:</strong> {user?.plan}
        </p>
        <p>
          <strong>Privacy:</strong> {user?.privacy}
        </p>
      </div>
    </section>
  )
}

function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const plan = form.get('plan')
    const privacy = form.get('privacy')
    updateProfile({ plan, privacy })
    setMessage('Settings saved')
  }

  return (
    <section>
      <h2>Settings</h2>
      <form className="card settings-form" onSubmit={handleSubmit}>
        <label>
          Plan
          <select name="plan" defaultValue={user?.plan}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        <label>
          Privacy
          <select name="privacy" defaultValue={user?.privacy}>
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="btn primary" type="submit">
          Save settings
        </button>
        {message && <p className="muted">{message}</p>}
      </form>
    </section>
  )
}

function NotFound() {
  return (
    <section>
      <h2>Page not found</h2>
      <a href="/app">Back to app</a>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestGate>
            <AuthForm mode="login" />
          </GuestGate>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestGate>
            <AuthForm mode="signup" />
          </GuestGate>
        }
      />
      <Route
        path="/app"
        element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="watch" element={<CatalogPage title="Watch" items={watchCatalog} metaKey="audience" />} />
        <Route path="listen" element={<CatalogPage title="Listen" items={listenCatalog} metaKey="mood" />} />
        <Route path="play" element={<CatalogPage title="Play" items={playCatalog} metaKey="difficulty" />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
