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
    fetchVideosByUsername(profile.username).then(setVideos).catch(() => setVideos([]))
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

  return (
    <div className="theme-app-bg space-y-4 p-4 lg:p-4">
      <section className="-mx-4 -mt-4 bg-[#121212] px-4 pb-0 pt-20 text-white lg:hidden">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 rounded-full border border-white/20 bg-[#151a17]">
            <ProfileAvatar profile={profile} />
            <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-sky-400 text-3xl font-black text-white">+</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xl">▣</span>
            <h1 className="text-2xl font-black tracking-tight">{displayName}</h1>
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-rose-500 px-2 text-base font-black">3</span>
            <button className="rounded-full bg-white/15 px-5 py-2 text-lg font-bold">Edit</button>
          </div>
          <p className="text-lg text-white/55">@{handle}</p>
          <div className="mt-6 grid w-full max-w-sm grid-cols-3 divide-x divide-white/10">
            <div>
              <p className="text-3xl font-black">{followingCount}</p>
              <p className="text-lg text-white/55">Following</p>
            </div>
            <div>
              <p className="text-3xl font-black">{followersCount}</p>
              <p className="text-lg text-white/55">Followers</p>
            </div>
            <div>
              <p className="text-3xl font-black">{totalLikes}</p>
              <p className="text-lg text-white/55">Likes</p>
            </div>
          </div>
          <p className="mt-5 text-xl">{profile.bio || 'tweet'}</p>
        </div>
        <div className="mt-10 grid grid-cols-5 items-end border-b border-white/20 text-white/55">
          {['▦', '▣', '↕', '♡', '♡'].map((icon, index) => (
            <button key={`${icon}-${index}`} className={`pb-3 text-4xl ${index === 0 ? 'border-b-2 border-white text-white' : ''}`}>
              {icon}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-px bg-black">
          {(videos.length ? videos : Array.from({ length: 9 }, (_, index) => ({ id: `placeholder-${index}`, title: 'No video yet', media_url: '', like_count: index === 0 ? 50 : index + 12 }))).map((video, index) => (
            <Link key={video.id} to={video.id?.startsWith?.('placeholder') ? '/upload' : `/video/${video.id}`} className="relative aspect-[9/14] overflow-hidden bg-zinc-900">
              {video.media_url ? (
                <video src={video.media_url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-800 via-zinc-700 to-black" />
              )}
              {index === 0 && <span className="absolute left-0 top-3 bg-rose-600 px-2 py-0.5 text-sm font-black">Pinned</span>}
              <span className="absolute right-2 top-2 rounded-md bg-white text-white">▢</span>
              <span className="absolute bottom-2 left-2 text-sm font-bold drop-shadow">▷ {video.like_count || 0}</span>
              <p className="absolute bottom-8 left-1 right-1 line-clamp-2 text-center text-sm font-semibold drop-shadow">{video.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-neon-cyan">Profile</h1>
      </div>
      <section className="theme-card hidden rounded-xl border p-4 lg:block">
        <div className="flex gap-6 text-sm text-white">
          <p><span className="font-bold">{followersCount}</span> followers</p>
          <p><span className="font-bold">{followingCount}</span> following</p>
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
