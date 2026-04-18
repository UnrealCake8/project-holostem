import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  fetchVideosByUsername,
  getProfileByUsername,
  followUser,
  unfollowUser,
  fetchFollowStatus,
  fetchFollowCounts,
} from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })

  useEffect(() => {
    async function load() {
      const profileData = await getProfileByUsername(username)
      setProfile(profileData)

      if (profileData) {
        const [videosData, followCounts] = await Promise.all([
          fetchVideosByUsername(username),
          fetchFollowCounts(profileData.id),
        ])
        setVideos(videosData)
        setCounts(followCounts)

        if (user) {
          const status = await fetchFollowStatus(user.id, profileData.id)
          setIsFollowing(status)
        }
      }
    }
    load()
  }, [username, user])

  async function handleToggleFollow() {
    if (!user || !profile) return
    if (isFollowing) {
      await unfollowUser(user.id, profile.id)
      setIsFollowing(false)
      setCounts((prev) => ({ ...prev, followers: prev.followers - 1 }))
    } else {
      await followUser(user.id, profile.id)
      setIsFollowing(true)
      setCounts((prev) => ({ ...prev, followers: prev.followers + 1 }))
    }
  }

  return (
    <div className="p-4 space-y-4 lg:p-8">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
              {(username || '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">@{username}</h1>
              <p className="text-gray-500 font-medium">{profile?.display_name || 'HoloStem creator'}</p>
            </div>
          </div>
          {user && user.id !== profile?.id && (
            <button
              onClick={handleToggleFollow}
              className={`rounded-full px-8 py-2 font-bold transition-all ${
                isFollowing
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-6 border-t border-gray-50 pt-6">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{counts.followers}</p>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{counts.following}</p>
            <p className="text-sm text-gray-500">Following</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-700 leading-relaxed">{profile?.bio || 'No bio yet.'}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <Link
            key={video.id}
            to={`/video/${video.id}`}
            className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-black/5 bg-gray-100 transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            {video.media_url ? (
              <div className="h-full w-full bg-black">
                {/* Simplified preview if it was a real video, here just a placeholder */}
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  ▶️
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800 text-white p-4 text-center">
                <span className="text-4xl mb-2">📄</span>
                <p className="font-bold line-clamp-2">{video.title}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
              <p className="text-xs font-bold uppercase text-pink-400 mb-1">{video.type}</p>
              <p className="font-bold text-white line-clamp-2 leading-tight">{video.title}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
