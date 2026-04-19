import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  fetchContent,
  fetchFollowingIds,
  fetchFollowNotifications,
  fetchProfileAvatarsByUserIds,
  getDashboardData,
} from '../lib/contentApi'
import { useAuth } from '../context/useAuth'
import FeedItem from '../components/FeedItem'

export default function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [notifications, setNotifications] = useState([])
  const containerRef = useRef(null)
  const tab = new URLSearchParams(location.search).get('tab') || 'for-you'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [, browseData, followingIds, followNotifications] = await Promise.all([
        getDashboardData(user?.id),
        fetchContent({ search: '', category: 'all' }),
        tab === 'following' && user?.id ? fetchFollowingIds(user.id) : Promise.resolve([]),
        tab === 'activity' && user?.id ? fetchFollowNotifications(user.id) : Promise.resolve([]),
      ])
      if (tab === 'following') {
        const filtered = browseData.filter((item) => followingIds.includes(item.user_id))
        const avatarMap = await fetchProfileAvatarsByUserIds(filtered.map((item) => item.user_id))
        setFeed(filtered.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      } else if (tab === 'explore') {
        const exploreOnly = browseData.filter((item) => item.username === 'holostemexplore')
        const avatarMap = await fetchProfileAvatarsByUserIds(exploreOnly.map((item) => item.user_id))
        setFeed(exploreOnly.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      } else if (tab === 'activity') {
        setFeed([])
        setNotifications(followNotifications)
      } else {
        const avatarMap = await fetchProfileAvatarsByUserIds(browseData.map((item) => item.user_id))
        setFeed(browseData.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      }
      setLoading(false)
      setActiveIndex(0)
    }
    load()
  }, [user?.id, tab])

  useEffect(() => {
    if (!containerRef.current || feed.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIndex(Number(entry.target.dataset.feedIndex))
        })
      },
      { root: containerRef.current, threshold: 0.6 },
    )
    const children = containerRef.current.querySelectorAll('[data-feed-index]')
    children.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [feed])

  useEffect(() => {
    if (feed[activeIndex]) {
      window.history.replaceState(null, '', `/video/${feed[activeIndex].id}`)
    }
  }, [activeIndex, feed])

  function handleDeleted(id) {
    setFeed((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Loading feed…</p>
        </div>
      </div>
    )
  }

  if (tab === 'activity') {
    return (
      <div className="theme-app-bg mx-auto max-w-2xl p-4">
        <section className="theme-card rounded-2xl border p-4">
          <h1 className="text-2xl font-bold text-pink-600">Activity</h1>
          <p className="mt-1 text-sm theme-muted">Recent follows</p>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 && (
              <p className="text-sm theme-muted">No one has followed you yet.</p>
            )}
            {notifications.map((notification) => (
              <div
                key={`${notification.follower_id}-${notification.created_at}`}
                className="rounded-xl border border-black/10 bg-black/10 p-3"
              >
                <p className="text-sm">
                  <span className="font-semibold">
                    @{notification.profiles?.username || 'user'}
                  </span>{' '}
                  started following you.
                </p>
                <p className="mt-1 text-xs theme-muted">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
        <div className="text-5xl">📭</div>
        <p className="text-xl font-semibold">
          {tab === 'following'
            ? 'No posts from people you follow yet'
            : tab === 'explore'
              ? 'No explore posts yet from @holostemexplore'
              : 'No content yet'}
        </p>
        {tab === 'following' || tab === 'explore' ? (
          <Link to="/dashboard" className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white">
            Browse For You feed
          </Link>
        ) : (
          <Link to="/upload" className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white">
            Upload the first video
          </Link>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
      {feed.map((item, index) => (
        <div
          key={item.id}
          data-feed-index={index}
          className="h-screen w-full snap-start snap-always"
        >
          <FeedItem
            item={item}
            isActive={index === activeIndex}
            onDeleted={handleDeleted}
          />
        </div>
      ))}
    </div>
  )
}
