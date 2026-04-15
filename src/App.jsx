import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import { appConfig } from './config/appConfig'
import { useAuth } from './features/auth/AuthContext'
import { apiRequest } from './lib/apiClient'

function AuthPanel() {
  const { signIn, signUp, user, signOut } = useAuth()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    try {
      if (mode === 'register') {
        await signUp(payload)
      } else {
        await signIn(payload)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="auth-box">
        <p className="muted">Signed in as</p>
        <strong>{user.username}</strong>
        <button type="button" className="btn slim" onClick={signOut}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-box">
      <div className="auth-tabs">
        <button
          type="button"
          className={`activity-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`activity-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <input name="fullName" placeholder="Full name" required />
            <input name="username" placeholder="Username" required />
          </>
        )}
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" minLength={8} required />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn">
          {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Login'}
        </button>
      </form>
    </div>
  )
}

function WatchPage() {
  const { user, token } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [activeVideoId, setActiveVideoId] = useState('')

  async function loadFeed() {
    setLoading(true)
    setFeedError('')
    try {
      const data = await apiRequest('/videos/feed')
      setVideos(data.videos || [])
      if (data.videos?.length) {
        setActiveVideoId((current) => current || data.videos[0].id)
      }
    } catch (err) {
      setFeedError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  useEffect(() => {
    async function loadComments() {
      if (!activeVideoId) return
      try {
        const data = await apiRequest(`/videos/${activeVideoId}/comments`)
        setComments(data.comments || [])
      } catch {
        setComments([])
      }
    }
    loadComments()
  }, [activeVideoId])

  async function toggleLike(videoId) {
    if (!token) return
    try {
      await apiRequest(`/videos/${videoId}/like`, { method: 'POST', token })
      loadFeed()
    } catch {
      // no-op
    }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!token || !activeVideoId || !commentText.trim()) return
    try {
      await apiRequest(`/videos/${activeVideoId}/comments`, {
        method: 'POST',
        token,
        body: { content: commentText.trim() },
      })
      setCommentText('')
      const data = await apiRequest(`/videos/${activeVideoId}/comments`)
      setComments(data.comments || [])
      loadFeed()
    } catch {
      // no-op
    }
  }

  const activeVideo = videos.find((video) => video.id === activeVideoId) || videos[0]

  return (
    <section className="watch-layout">
      <div>
        <div className="phone-frame">
          <div className="feed-video">
            {loading ? (
              <div className="feed-overlay">
                <p>Loading feed...</p>
              </div>
            ) : feedError ? (
              <div className="feed-overlay">
                <p>{feedError}</p>
              </div>
            ) : activeVideo ? (
              <>
                <video
                  src={activeVideo.videoUrl}
                  className="video-player"
                  controls
                  autoPlay
                  muted
                  loop
                />
                <div className="feed-overlay">
                  <p className="feed-handle">@{activeVideo.author.username}</p>
                  <p>{activeVideo.caption}</p>
                </div>
              </>
            ) : (
              <div className="feed-overlay">
                <p>No public videos yet. Upload one from Activity.</p>
              </div>
            )}
          </div>
        </div>

        <div className="feed-list">
          {videos.map((video) => (
            <button
              key={video.id}
              type="button"
              className={`feed-list-item ${video.id === activeVideo?.id ? 'active' : ''}`}
              onClick={() => setActiveVideoId(video.id)}
            >
              <strong>@{video.author.username}</strong>
              <span>{video.caption}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="feed-actions">
        <button type="button" className="bubble" onClick={() => activeVideo && toggleLike(activeVideo.id)}>
          Like {activeVideo?._count?.likes || 0}
        </button>
        <div className="bubble info">Comments {activeVideo?._count?.comments || 0}</div>
        <form className="comment-form" onSubmit={submitComment}>
          <input
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder={user ? 'Add a comment' : 'Login to comment'}
            disabled={!user}
          />
          <button type="submit" className="btn slim" disabled={!user}>
            Send
          </button>
        </form>
        <div className="comment-list">
          {comments.slice(0, 5).map((comment) => (
            <p key={comment.id}>
              <strong>@{comment.user.username}</strong> {comment.content}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

function UploadPanel() {
  const { token } = useAuth()
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    if (!token || !file) return
    const formData = new FormData()
    formData.append('caption', caption)
    formData.append('video', file)
    formData.append('visibility', 'public')

    try {
      setStatus('Uploading...')
      await apiRequest('/videos/upload', {
        method: 'POST',
        token,
        body: formData,
        isFormData: true,
      })
      setStatus('Uploaded')
      setCaption('')
      setFile(null)
      navigate('/watch')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <section>
      <h2>Upload video</h2>
      <form className="card settings-form" onSubmit={handleSubmit}>
        <label>
          Caption
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write your caption"
            required
          />
        </label>
        <label>
          Video file
          <input
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            required
          />
        </label>
        <button className="btn" type="submit">
          Publish video
        </button>
        {status && <p className="muted">{status}</p>}
      </form>
    </section>
  )
}

function ProfilePanel() {
  const { user, token, updateProfile } = useAuth()
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    privacy: user?.privacy || 'public',
  })
  const [videos, setVideos] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    setProfile({
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      privacy: user?.privacy || 'public',
    })
  }, [user])

  useEffect(() => {
    async function loadOwnProfile() {
      if (!user?.username) return
      try {
        const data = await apiRequest(`/users/${user.username}`)
        setVideos(data.user?.videos || [])
      } catch {
        setVideos([])
      }
    }
    loadOwnProfile()
  }, [user?.username])

  async function saveProfile(event) {
    event.preventDefault()
    if (!token) return
    try {
      await updateProfile(profile)
      setStatus('Profile saved')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <section>
      <h2>Your profile</h2>
      <form className="card settings-form" onSubmit={saveProfile}>
        <label>
          Full name
          <input
            value={profile.fullName}
            onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
            required
          />
        </label>
        <label>
          Bio
          <input
            value={profile.bio}
            onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
          />
        </label>
        <label>
          Avatar URL
          <input
            value={profile.avatarUrl}
            onChange={(event) => setProfile((prev) => ({ ...prev, avatarUrl: event.target.value }))}
          />
        </label>
        <label>
          Privacy
          <select
            value={profile.privacy}
            onChange={(event) => setProfile((prev) => ({ ...prev, privacy: event.target.value }))}
          >
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="btn" type="submit">Save profile</button>
        {status && <p className="muted">{status}</p>}
      </form>

      <h3>Your videos</h3>
      <div className="grid cards">
        {videos.map((video) => (
          <article key={video.id} className="card">
            <p>{video.caption}</p>
            <video src={video.videoUrl} controls className="small-preview" />
          </article>
        ))}
      </div>
    </section>
  )
}

function DashboardPanel() {
  const { user } = useAuth()
  const stats = useMemo(
    () => [
      { label: 'Access', value: user ? 'Authenticated' : 'Guest' },
      { label: 'Public feed', value: 'Enabled' },
      { label: 'Profiles', value: 'Enabled' },
      { label: 'Uploads', value: user ? 'Enabled' : 'Login required' },
    ],
    [user],
  )

  return (
    <section>
      <h2>Activity Dashboard</h2>
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

function ActivityPage() {
  const { section = 'dashboard' } = useParams()
  const { user } = useAuth()

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'Profile' },
    { id: 'upload', label: 'Upload' },
  ]

  const panelMap = {
    dashboard: <DashboardPanel />,
    profile: user ? <ProfilePanel /> : <p>Login to manage your profile.</p>,
    upload: user ? <UploadPanel /> : <p>Login to upload videos.</p>,
  }

  return (
    <div className="activity-wrap">
      <div className="activity-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={`/activity/${tab.id}`}
            className={({ isActive }) => `activity-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      {panelMap[section] || <DashboardPanel />}
    </div>
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
        <p className="muted small">Backend-connected MVP</p>
        <AuthPanel />
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
          <Route path="*" element={<Navigate to="/watch" replace />} />
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

export default function App() {
  return <AppShell />
}
