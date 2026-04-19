import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import {
  getProfile,
  saveProfile,
  fetchFollowerCount,
  fetchFollowingCount,
  fetchFollowersForUser,
  fetchFollowingForUser,
} from '../lib/contentApi'

function isSupportedAvatarUrl(value) {
  if (!value) return true
  try {
    const parsed = new URL(value)
    return /\.(png|jpe?g|svg|gif|webp|avif)(\?.*)?$/i.test(parsed.pathname + parsed.search)
  } catch {
    return false
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ display_name: '', username: '', avatar_url: '', bio: '', age_group: 'all' })
  const [status, setStatus] = useState('')
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])

  useEffect(() => {
    async function load() {
      const data = await getProfile(user.id)
      if (data) setProfile(data)
      else setProfile((prev) => ({
        ...prev,
        display_name: user.user_metadata?.full_name ?? '',
        username: user.user_metadata?.username ?? '',
      }))
    }
    load()
  }, [user.id, user.user_metadata?.full_name, user.user_metadata?.username])

  useEffect(() => {
    async function loadSocialData() {
      const [followerCount, followingCountValue, followersData, followingData] = await Promise.all([
        fetchFollowerCount(user.id),
        fetchFollowingCount(user.id),
        fetchFollowersForUser(user.id),
        fetchFollowingForUser(user.id),
      ])
      setFollowersCount(followerCount)
      setFollowingCount(followingCountValue)
      setFollowers(followersData)
      setFollowing(followingData)
    }
    loadSocialData()
  }, [user.id])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupportedAvatarUrl(profile.avatar_url || '')) {
      setStatus('Profile picture URL must point to an image (png, jpg, jpeg, svg, gif, webp, avif).')
      return
    }
    await saveProfile(user.id, profile)
    setStatus('Profile saved.')
  }

  return (
    <div className="theme-app-bg p-4 space-y-4">
      <h1 className="text-2xl font-bold text-neon-cyan">Profile</h1>
      <section className="theme-card rounded-xl border p-4">
        <div className="flex gap-6 text-sm text-white">
          <p><span className="font-bold">{followersCount}</span> followers</p>
          <p><span className="font-bold">{followingCount}</span> following</p>
        </div>
      </section>
      <form className="theme-card space-y-3 rounded-xl border p-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Display name</span>
          <input className="theme-input w-full rounded-md border p-2" value={profile.display_name || ''} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Username</span>
          <input className="theme-input w-full rounded-md border p-2" value={profile.username || ''} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Profile picture URL</span>
          <input
            className="theme-input w-full rounded-md border p-2"
            value={profile.avatar_url || ''}
            onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value.trim() }))}
            placeholder="https://example.com/avatar.png"
            type="url"
          />
          <span className="mt-1 block text-xs theme-muted">Supports .jpg, .jpeg, .png, .svg, .gif, .webp, and .avif links.</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Bio</span>
          <textarea className="theme-input w-full rounded-md border p-2" value={profile.bio || ''} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Age group</span>
          <select className="theme-input w-full rounded-md border p-2" value={profile.age_group || 'all'} onChange={(e) => setProfile((p) => ({ ...p, age_group: e.target.value }))}>
            <option value="all">All ages</option>
            <option value="kids">Kids</option>
            <option value="teens">Teens</option>
            <option value="adults">Adults</option>
          </select>
        </label>
        <button className="rounded-md bg-neon-cyan px-3 py-2 font-semibold text-slate-900">Save</button>
        {status && <p className="text-emerald-300">{status}</p>}
      </form>
      {profile.avatar_url && isSupportedAvatarUrl(profile.avatar_url) && (
        <section className="theme-card rounded-xl border p-4">
          <p className="mb-2 text-sm theme-muted">Profile picture preview</p>
          <img src={profile.avatar_url} alt="Profile preview" className="h-20 w-20 rounded-full object-cover" />
        </section>
      )}
      <section className="grid gap-3 md:grid-cols-2">
        <div className="theme-card rounded-xl border p-4">
          <p className="mb-2 text-sm text-slate-300">Followers</p>
          <div className="space-y-1 text-sm text-slate-200">
            {followers.length === 0 && <p className="text-slate-400">No followers yet.</p>}
            {followers.slice(0, 10).map((entry) => (
              <p key={entry.follower_id}>@{entry.profiles?.username || 'user'}</p>
            ))}
          </div>
        </div>
        <div className="theme-card rounded-xl border p-4">
          <p className="mb-2 text-sm text-slate-300">Following</p>
          <div className="space-y-1 text-sm text-slate-200">
            {following.length === 0 && <p className="text-slate-400">Not following anyone yet.</p>}
            {following.slice(0, 10).map((entry) => (
              <p key={entry.following_id}>@{entry.profiles?.username || 'user'}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
