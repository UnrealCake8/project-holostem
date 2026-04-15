import { useMemo } from 'react'
import { NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import {
  listenCatalog,
  playCatalog,
  socialFeatures,
  watchCatalog,
} from './features/content/mockCatalog'
import { appConfig } from './config/appConfig'

function DashboardPanel() {
  const stats = useMemo(
    () => [
      { label: 'Watch items', value: watchCatalog.length },
      { label: 'Listen items', value: listenCatalog.length },
      { label: 'Games', value: playCatalog.length },
      { label: 'View mode', value: 'Guest enabled' },
    ],
    [],
  )

  return (
    <section>
      <h2>Activity Dashboard</h2>
      <p className="muted">Quick overview of your HoloStem activity area.</p>
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

function ListPanel({ title, items, metaKey }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="grid cards">
        {items.map((item) => (
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

function SocialPanel() {
  return (
    <section>
      <h2>Social</h2>
      <p className="muted">Core capabilities for chat, sharing, and community.</p>
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

function ProfilePanel() {
  return (
    <section>
      <h2>Profile</h2>
      <div className="card">
        <p>
          <strong>Name:</strong> Guest User
        </p>
        <p>
          <strong>Email:</strong> guest@holostem.app
        </p>
        <p>
          <strong>Plan:</strong> Free
        </p>
        <p>
          <strong>Privacy:</strong> Friends only
        </p>
      </div>
    </section>
  )
}

function SettingsPanel() {
  return (
    <section>
      <h2>Settings</h2>
      <form className="card settings-form">
        <label>
          Plan
          <select name="plan" defaultValue="free">
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        <label>
          Privacy
          <select name="privacy" defaultValue="friends">
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="btn primary" type="button">Save settings</button>
        <p className="muted">Your real backend settings can be connected later.</p>
      </form>
    </section>
  )
}

const activityTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'social', label: 'Social' },
  { id: 'profile', label: 'Profile' },
  { id: 'play', label: 'Play' },
  { id: 'listen', label: 'Listen' },
  { id: 'settings', label: 'Settings' },
]

function ActivityPage() {
  const { section = 'dashboard' } = useParams()

  const panelMap = {
    dashboard: <DashboardPanel />,
    social: <SocialPanel />,
    profile: <ProfilePanel />,
    play: <ListPanel title="Play" items={playCatalog} metaKey="difficulty" />,
    listen: <ListPanel title="Listen" items={listenCatalog} metaKey="mood" />,
    settings: <SettingsPanel />,
  }

  const panel = panelMap[section] || <DashboardPanel />

  return (
    <div className="activity-wrap">
      <div className="activity-tabs">
        {activityTabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={`/activity/${tab.id}`}
            className={({ isActive }) => `activity-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      {panel}
    </div>
  )
}

function WatchPage() {
  return (
    <section className="watch-layout">
      <div className="phone-frame">
        <div className="feed-video">
          <div className="feed-top-bar" />
          <img
            src="/favicon.svg"
            alt="Video cover"
            className="feed-preview"
          />
          <div className="feed-overlay">
            <p className="feed-handle">@holostem</p>
            <p>No account required - scroll style feed is public.</p>
          </div>
        </div>
      </div>
      <div className="feed-actions">
        <button type="button" className="bubble">Like</button>
        <button type="button" className="bubble">Comment</button>
        <button type="button" className="bubble">Share</button>
      </div>
    </section>
  )
}

function AppShell() {
  const navItems = [
    { to: '/watch', label: 'For You' },
    { to: '/activity/dashboard', label: 'Activity' },
  ]

  return (
    <div className="tt-shell">
      <aside className="tt-sidebar">
        <h1>{appConfig.appName}</h1>
        <input className="search" placeholder="Search" />
        <nav className="tt-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `tt-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="tt-main">
        <Routes>
          <Route path="/watch" element={<WatchPage />} />
          <Route path="/activity/:section" element={<ActivityPage />} />
          <Route path="/activity" element={<Navigate to="/activity/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/watch" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <aside className="tt-right">
        <div className="ghost-circle" />
        <div className="ghost-circle" />
        <div className="ghost-circle" />
        <div className="ghost-circle" />
      </aside>
    </div>
  )
}

function NotFound() {
  return (
    <section>
      <h2>Page not found</h2>
      <a href="/watch">Back to feed</a>
    </section>
  )
}

export default function App() {
  return <AppShell />
}
