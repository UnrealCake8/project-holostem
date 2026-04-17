import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import {
  fetchVideosByUsername,
  getProfileByUsername,
  getUserIdByUsername,
  fetchFollowStatus,
  followUser,
  unfollowUser,
  fetchFollowerCount,
  fetchFollowingCount,
  fetchFollowersForUser,
  fetchFollowingForUser,
} from '../lib/contentApi'

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [profileUserId, setProfileUserId] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const isSelf = Boolean(user?.id && profileUserId && user.id === profileUserId)

  useEffect(() => {
    async function load() {
      const [profileData, videosData, userId] = await Promise.all([
        getProfileByUsername(username),
        fetchVideosByUsername(username),
        getUserIdByUsername(username),
      ])
      setProfile(profileData)
      setVideos(videosData)
      setProfileUserId(userId)
    }
    load()
  }, [username])

  useEffect(() => {
    if (!profileUserId) return
    async function loadSocialStats() {
      const [followerCount, followingCountValue, followersData, followingData] = await Promise.all([
        fetchFollowerCount(profileUserId),
        fetchFollowingCount(profileUserId),
        fetchFollowersForUser(profileUserId),
        fetchFollowingForUser(profileUserId),
      ])
      setFollowersCount(followerCount)
      setFollowingCount(followingCountValue)
      setFollowers(followersData)
      setFollowing(followingData)
      if (user?.id && user.id !== profileUserId) {
        const status = await fetchFollowStatus(user.id, profileUserId)
        setIsFollowing(status)
      } else {
        setIsFollowing(false)
      }
    }
    loadSocialStats()
  }, [profileUserId, user?.id])

  async function handleFollowToggle() {
    if (!user?.id || !profileUserId || isSelf) return
    const next = !isFollowing
    setIsFollowing(next)
    setFollowersCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)))
    try {
      if (next) await followUser(user.id, profileUserId)
      else await unfollowUser(user.id, profileUserId)
    } catch {
      setIsFollowing(!next)
      setFollowersCount((prev) => (!next ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  return (
    <div className="p-4 space-y-4">
      <section className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pink-600">@{username}</h1>
            <p className="text-black/60">{profile?.display_name || 'HoloStem creator'}</p>
            <p className="text-sm text-black/50">{profile?.bio || 'No bio yet.'}</p>
          </div>
          {!isSelf && (
            <button
              onClick={handleFollowToggle}
              disabled={!user?.id || !profileUserId}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isFollowing ? 'bg-black/10 text-black' : 'bg-pink-600 text-white'
              } disabled:opacity-50`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <p><span className="font-bold">{videos.length}</span> posts</p>
          <p><span className="font-bold">{followersCount}</span> followers</p>
          <p><span className="font-bold">{followingCount}</span> following</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-black/60">Followers</p>
          <div className="space-y-2">
            {followers.length === 0 && <p className="text-sm text-black/40">No followers yet.</p>}
            {followers.slice(0, 8).map((entry) => (
              <p key={entry.follower_id} className="text-sm text-black/70">
                @{entry.profiles?.username || 'user'} · {entry.profiles?.display_name || 'HoloStem user'}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-black/60">Following</p>
          <div className="space-y-2">
            {following.length === 0 && <p className="text-sm text-black/40">Not following anyone yet.</p>}
            {following.slice(0, 8).map((entry) => (
              <p key={entry.following_id} className="text-sm text-black/70">
                @{entry.profiles?.username || 'user'} · {entry.profiles?.display_name || 'HoloStem user'}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Link key={video.id} to={`/content/${video.id}`} className="rounded-xl border border-black/10 bg-white p-3 hover:bg-black/5">
            <p className="text-xs uppercase text-black/50">{video.type}</p>
            <p className="font-semibold">{video.title}</p>
            <p className="text-sm text-black/60 line-clamp-2">{video.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
