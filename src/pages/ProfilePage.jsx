import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  getProfile,
  saveProfile,
  fetchFollowerCount,
  fetchFollowingCount,
  fetchFollowersForUser,
  fetchFollowingForUser,
  fetchVideosByUsername,
  updateContentPin,
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

function sortPinnedVideos(videos) {
  return [...videos].sort((a, b) => {
    if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
    return new Date(b.pinned_at || b.created_at || 0) - new Date(a.pinned_at || a.created_at || 0)
  })
}

function SocialAccountList({ title, entries, idKey, emptyMessage }) {
  return (
    <div className="mt-5 w-full max-w-sm rounded-2xl bg-white/5 p-4 text-left">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/45">{title}</p>
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-white/45">{emptyMessage}</p>}
        {entries.map((entry) => {
          const account = entry.profiles
          const username = account?.username || 'user'
          return (
            <Link key={entry[idKey]} to={`/u/${username}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10">
              {account?.avatar_url ? (
                <img src={account.avatar_url} alt={`${username} avatar`} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#151a17] text-base font-black text-white/45">
                  {(account?.display_name || username || '?')[0].toUpperCase()}
                </span>
              )}
              <span>
                <span className="block text-sm font-bold text-white">{account?.display_name || username}</span>
                <span className="block text-xs text-white/50">@{username}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ProfileAvatar({ profile }) {
  if (profile.avatar_url && isSupportedAvatarUrl(profile.avatar_url)) {
    return <img src={profile.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
  }

  return (
    <span className="grid h-full w-full place-items-center rounded-full bg-[#151a17] text-4xl font-black text-white/30">
      {(profile.display_name || profile.username || '?')[0].toUpperCase()}
    </span>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ display_name: '', username: '', avatar_url: '', bio: '', age_group: 'all' })
  const [status, setStatus] = useState('')
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [videos, setVideos] = useState([])
  const [activeSocialList, setActiveSocialList] = useState('')

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

  useEffect(() => {
    if (!profile.username) return
    fetchVideosByUsername(profile.username).then((items) => setVideos(sortPinnedVideos(items))).catch(() => setVideos([]))
  }, [profile.username])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupportedAvatarUrl(profile.avatar_url || '')) {
      setStatus('Profile picture URL must point to an image (png, jpg, jpeg, svg, gif, webp, avif).')
      return
    }
    await saveProfile(user.id, profile)
    setStatus('Profile saved.')
  }

  const displayName = profile.display_name || profile.username || 'Creator'
  const handle = profile.username || user.email?.split('@')[0] || 'user'
  const totalLikes = videos.reduce((sum, video) => sum + Number(video.like_count || 0), 0)

  async function handleTogglePin(video) {
    const nextPinned = !video.is_pinned
    setVideos((current) => sortPinnedVideos(current.map((item) => (item.id === video.id ? { ...item, is_pinned: nextPinned, pinned_at: nextPinned ? new Date().toISOString() : null } : item))))
    try {
      const updated = await updateContentPin({ contentId: video.id, userId: user.id, isPinned: nextPinned })
      if (updated) {
        setVideos((current) => sortPinnedVideos(current.map((item) => (item.id === video.id ? { ...item, ...updated } : item))))
      }
    } catch {
      setVideos((current) => sortPinnedVideos(current.map((item) => (item.id === video.id ? { ...item, is_pinned: !nextPinned } : item))))
    }
  }

  return (
    <div className="theme-app-bg space-y-4 p-4 lg:p-4">
      <section className="-mx-4 -mt-4 min-h-screen bg-[#121212] px-4 pb-28 pt-20 text-white lg:hidden">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-20 w-20 rounded-full border border-white/20 bg-[#151a17]">
            <ProfileAvatar profile={profile} />
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-leaf)] text-2xl font-black text-white">+</span>
          </div>
          <div className="mt-4 flex max-w-full items-center justify-center gap-2">
            <span className="text-xl">▣</span>
            <h1 className="truncate text-2xl font-black tracking-tight">{displayName}</h1>
            <button className="rounded-full bg-white/15 px-4 py-1.5 text-base font-bold">Edit</button>
          </div>
          <p className="text-lg text-white/55">@{handle}</p>
          <div className="mt-6 grid w-full max-w-sm grid-cols-3 divide-x divide-white/10">
            <button type="button" onClick={() => setActiveSocialList((current) => (current === 'following' ? '' : 'following'))}>
              <p className="text-3xl font-black">{followingCount}</p>
              <p className="text-lg text-white/55">Following</p>
            </button>
            <button type="button" onClick={() => setActiveSocialList((current) => (current === 'followers' ? '' : 'followers'))}>
              <p className="text-3xl font-black">{followersCount}</p>
              <p className="text-lg text-white/55">Followers</p>
            </button>
            <div>
              <p className="text-3xl font-black">{totalLikes}</p>
              <p className="text-lg text-white/55">Likes</p>
            </div>
          </div>
          {profile.bio ? <p className="mt-5 text-xl">{profile.bio}</p> : <p className="mt-5 text-base text-white/45">No bio yet.</p>}
          {activeSocialList === 'following' && (
            <SocialAccountList title="Following" entries={following} idKey="following_id" emptyMessage="Not following anyone yet." />
          )}
          {activeSocialList === 'followers' && (
            <SocialAccountList title="Followers" entries={followers} idKey="follower_id" emptyMessage="No followers yet." />
          )}
        </div>
        <div className="mt-8 grid grid-cols-5 items-end border-b border-white/20 text-white/55">
          {['▦', '▣', '↕', '♡', '♡'].map((icon, index) => (
            <button key={`${icon}-${index}`} className={`pb-3 text-3xl ${index === 0 ? 'border-b-2 border-white text-white' : ''}`}>
              {icon}
            </button>
          ))}
        </div>
        {videos.length === 0 ? (
          <div className="border-t border-white/10 py-12 text-center text-white/50">
            <p className="text-lg font-semibold">No posts yet</p>
            <Link to="/upload" className="mt-3 inline-block rounded-full bg-[var(--brand-olive)] px-5 py-2 text-sm font-bold text-white">Create your first post</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-black">
            {videos.map((video) => {
              const isDirectVideo = video.media_url?.toLowerCase().endsWith('.mp4')
              return (
                <Link key={video.id} to={`/video/${video.id}`} className="relative aspect-[9/14] overflow-hidden bg-zinc-900">
                  {isDirectVideo ? (
                    <video src={video.media_url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black p-2 text-center text-xs font-semibold text-white/70">
                      {video.title}
                    </div>
                  )}
                  {video.is_pinned && <span className="absolute left-0 top-3 bg-[var(--brand-leaf)] px-2 py-0.5 text-xs font-black">Pinned</span>}
                  <button
                    type="button"
                    onClick={(event) => { event.preventDefault(); handleTogglePin(video) }}
                    className="absolute right-1 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black text-white"
                  >
                    {video.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <span className="absolute bottom-2 left-2 text-xs font-bold drop-shadow">▷ {video.like_count || 0}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-neon-cyan">Profile</h1>
      </div>
      <section className="theme-card hidden rounded-xl border p-4 lg:block">
        <div className="flex gap-6 text-sm text-white">
          <button type="button" onClick={() => setActiveSocialList('followers')}><span className="font-bold">{followersCount}</span> followers</button>
          <button type="button" onClick={() => setActiveSocialList('following')}><span className="font-bold">{followingCount}</span> following</button>
        </div>
      </section>
      <form className="theme-card hidden space-y-3 rounded-xl border p-4 lg:block" onSubmit={handleSubmit}>
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
        <section className="theme-card hidden rounded-xl border p-4 lg:block">
          <p className="mb-2 text-sm theme-muted">Profile picture preview</p>
          <img src={profile.avatar_url} alt="Profile preview" className="h-20 w-20 rounded-full object-cover" />
        </section>
      )}
      <section className="hidden gap-3 md:grid-cols-2 lg:grid">
        <div className="theme-card rounded-xl border p-4">
          <p className="mb-2 text-sm text-slate-300">Followers</p>
          <div className="space-y-1 text-sm text-slate-200">
            {followers.length === 0 && <p className="text-slate-400">No followers yet.</p>}
            {followers.slice(0, 10).map((entry) => (
              <Link key={entry.follower_id} to={`/u/${entry.profiles?.username || 'user'}`} className="block hover:text-white">@{entry.profiles?.username || 'user'}</Link>
            ))}
          </div>
        </div>
        <div className="theme-card rounded-xl border p-4">
          <p className="mb-2 text-sm text-slate-300">Following</p>
          <div className="space-y-1 text-sm text-slate-200">
            {following.length === 0 && <p className="text-slate-400">Not following anyone yet.</p>}
            {following.slice(0, 10).map((entry) => (
              <Link key={entry.following_id} to={`/u/${entry.profiles?.username || 'user'}`} className="block hover:text-white">@{entry.profiles?.username || 'user'}</Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
