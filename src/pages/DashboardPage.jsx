import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { fetchContent, getDashboardData } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'
import FeedItem from '../components/FeedItem'

export default function DashboardPage() {
  const { user } = useAuth()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

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
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory"
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
