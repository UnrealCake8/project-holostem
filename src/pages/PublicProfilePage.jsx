import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchVideosByUsername, getProfileByUsername } from '../lib/contentApi'

export default function PublicProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])

  useEffect(() => {
    async function load() {
      const [profileData, videosData] = await Promise.all([
        getProfileByUsername(username),
        fetchVideosByUsername(username),
      ])
      setProfile(profileData)
      setVideos(videosData)
    }
    load()
  }, [username])

  return (
    <div className="p-4 space-y-4">
      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <h1 className="text-3xl font-bold text-pink-600">@{username}</h1>
        <p className="text-black/60">{profile?.display_name || 'HoloStem creator'}</p>
        <p className="text-sm text-black/50">{profile?.bio || 'No bio yet.'}</p>
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
