import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchContent, getDashboardData } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

// ─── Video / Embed Player ────────────────────────────────────────────────────
function FeedPlayer({ item, isActive }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isActive])

  if (!item) return null

  const isYoutube =
    item.media_url?.includes('youtube.com') || item.media_url?.includes('youtu.be')

  if (item.type === 'mini') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black text-white">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-2xl font-bold">Mini Experience</p>
        <p className="mt-2 max-w-xs text-center text-white/70 text-base">
          Tap the button below to play and earn points
        </p>
      </div>
    )
  }

  if (isYoutube) {
    // Convert watch URL to embed URL
    const embedUrl = item.media_url
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'youtube.com/embed/')
    const src = isActive ? `${embedUrl}?autoplay=1&mute=0&controls=0&loop=1` : embedUrl

    return (
      <iframe
        key={isActive ? 'active' : 'inactive'}
        title={item.title}
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (item.media_url) {
    return (
      <video
        ref={videoRef}
        src={item.media_url}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={false}
      />
    )
  }

  // Fallback: lesson or no media
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white px-8 text-center">
      <div className="text-5xl mb-4">📚</div>
      <p className="text-xl font-bold">{item.title}</p>
      <p className="mt-2 text-white/60 text-sm">{item.description}</p>
    </div>
  )
}

// ─── Action Rail ─────────────────────────────────────────────────────────────
function ActionRail({ item, onLike, liked, likeCount }) {
  return (
    <div className="flex flex-col items-center gap-5 pb-4">
      {/* Creator avatar */}
      <div className="relative">
        <Link to={item?.username ? `/u/${item.username}` : '#'}>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
            {(item?.username || '?')[0].toUpperCase()}
          </div>
        </Link>
        {/* Follow "+" badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold border border-white">
          +
        </div>
      </div>

      {/* Like */}
      <button
        onClick={onLike}
        className="flex flex-col items-center gap-1 group"
        aria-label="Like"
      >
        <div className={`text-3xl transition-transform group-active:scale-125 ${liked ? 'scale-110' : ''}`}>
          {liked ? '❤️' : '🤍'}
        </div>
        <span className="text-white text-xs font-semibold drop-shadow">{likeCount}</span>
      </button>

      {/* Comment */}
      <Link
        to={item?.id ? `/content/${item.id}` : '#'}
        className="flex flex-col items-center gap-1"
        aria-label="Comment"
      >
        <div className="text-3xl">💬</div>
        <span className="text-white text-xs font-semibold drop-shadow">
          {item?.comment_count ?? 0}
        </span>
      </Link>

      {/* Share */}
      <button
        className="flex flex-col items-center gap-1"
        aria-label="Share"
        onClick={() => {
          if (navigator.share && item) {
            navigator.share({ title: item.title, url: window.location.href }).catch(() => {})
          }
        }}
      >
        <div className="text-3xl">↗️</div>
        <span className="text-white text-xs font-semibold drop-shadow">Share</span>
      </button>

      {/* Open full */}
      <Link
        to={item?.id ? `/content/${item.id}` : '#'}
        className="flex flex-col items-center gap-1"
        aria-label="Open"
      >
        <div className="text-3xl">⤢</div>
        <span className="text-white text-xs font-semibold drop-shadow">Open</span>
      </Link>
    </div>
  )
}

// ─── Single Feed Item ─────────────────────────────────────────────────────────
function FeedItem({ item, isActive, index }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item?.like_count ?? 0)

  function handleLike() {
    if (!user) return
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    // TODO: persist like to Supabase user_likes table
  }

  return (
    <div className="relative h-screen w-full flex-shrink-0 bg-black snap-start snap-always overflow-hidden">
      {/* Media fills the whole screen */}
      <div className="absolute inset-0">
        <FeedPlayer item={item} isActive={isActive} />
      </div>

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Bottom left: creator + caption */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 text-white">
        {item?.username && (
          <Link
            to={`/u/${item.username}`}
            className="mb-1 inline-flex items-center gap-1.5 font-bold text-base hover:underline"
          >
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-xs font-bold">
              {item.username[0].toUpperCase()}
            </span>
            @{item.username}
          </Link>
        )}
        <p className="text-base font-semibold leading-snug drop-shadow-md line-clamp-2">
          {item?.title}
        </p>
        {item?.description && (
          <p className="mt-0.5 text-sm text-white/75 line-clamp-2 leading-snug">
            {item.description}
          </p>
        )}
        <span className="mt-2 inline-block rounded-full bg-white/20 backdrop-blur px-2 py-0.5 text-xs capitalize">
          {item?.type}
        </span>
      </div>

      {/* Right action rail */}
      <div className="absolute bottom-6 right-2 flex flex-col items-center">
        <ActionRail item={item} onLike={handleLike} liked={liked} likeCount={likeCount} />
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [, browseData] = await Promise.all([
        getDashboardData(user?.id),
        fetchContent({ search: '', category: 'all' }),
      ])
      setFeed(browseData)
      setLoading(false)
    }
    load()
  }, [user?.id])

  // IntersectionObserver: track which slide is visible
  useEffect(() => {
    if (!containerRef.current || feed.length === 0) return

    observerRef.current?.disconnect()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index)
            setActiveIndex(idx)
          }
        })
      },
      { root: containerRef.current, threshold: 0.6 }
    )

    observerRef.current = observer

    const children = containerRef.current.querySelectorAll('[data-index]')
    children.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [feed])

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

  if (feed.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
        <div className="text-5xl">📭</div>
        <p className="text-xl font-semibold">No content yet</p>
        <Link to="/upload" className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white">
          Upload the first video
        </Link>
      </div>
    )
  }

  return (
    // Full-screen snap-scroll container — overrides the parent padding
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {feed.map((item, index) => (
        <div key={item.id} data-index={index} className="h-screen w-full snap-start snap-always">
          <FeedItem item={item} isActive={index === activeIndex} index={index} />
        </div>
      ))}
    </div>
  )
}
