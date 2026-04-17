import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchContent, getDashboardData } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

function FeedPreview({ active }) {
  if (!active) return <p className="p-4 text-white">No content yet.</p>

  if (active.type === 'mini') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black text-center text-white">
        <p className="text-2xl font-semibold">Mini Experience</p>
        <p className="mt-3 max-w-xs text-xl text-white/80">Open this card to play the interactive tap challenge and earn points.</p>
      </div>
    )
  }

  return (
    <iframe
      title={active.title}
      src={active.media_url}
      className="h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [state, setState] = useState({ recommended: [], trending: [], recent: [], progress: null })
  const [browse, setBrowse] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [dashboardData, browseData] = await Promise.all([
        getDashboardData(user.id),
        fetchContent({ search, category }),
      ])

      setState(dashboardData)
      setBrowse(browseData)
      setActiveId((prev) => prev || browseData[0]?.id || '')
      setLoading(false)
    }
    load()
  }, [user.id, search, category])

  const active = useMemo(() => browse.find((item) => item.id === activeId) || browse[0], [activeId, browse])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(320px,480px)_minmax(320px,1fr)]">
        <article className="rounded-2xl border border-black/10 bg-white p-4">
          <h1 className="text-[2rem] font-bold text-pink-600">For You</h1>
          <p className="text-xl text-black/55">Recommended, recent, and trending content for {user.user_metadata?.full_name || user.email}.</p>

          <div className="mt-4 flex flex-col gap-2">
            <input
              className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xl"
              placeholder="Search videos, lessons, experiences"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xl"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="video">Videos</option>
              <option value="lesson">Interactive lessons</option>
              <option value="mini">Mini experiences</option>
            </select>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-lg">
            <div className="rounded-lg bg-pink-50 p-2">Points: {state.progress?.points ?? 0}</div>
            <div className="rounded-lg bg-pink-50 p-2">Completed: {state.progress?.completed_count ?? 0}</div>
            <div className="rounded-lg bg-pink-50 p-2">Level: {state.progress?.level ?? 1}</div>
          </div>

          <div className="mt-5 space-y-2">
            {browse.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${active?.id === item.id ? 'border-pink-400 bg-pink-50' : 'border-black/10 bg-white hover:bg-black/5'}`}
              >
                <p className="text-xs uppercase text-black/45">{item.type}</p>
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="text-sm text-black/60 line-clamp-1">{item.description}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="flex justify-center rounded-2xl border border-black/10 bg-white p-4">
          <div>
            <div className="h-[74vh] w-[360px] overflow-hidden rounded-[1.7rem] bg-black shadow-2xl">
              <div className="h-14 bg-black" />
              <div className="h-[calc(74vh-7rem)] bg-black">
                <FeedPreview active={active} />
              </div>
              <div className="h-14 bg-black" />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <div>
                <p className="text-xl font-semibold">{active?.title || 'Pick content'}</p>
                <p className="max-w-[340px] text-sm text-black/60">{active?.description}</p>
              </div>
              {active && (
                <Link
                  to={`/content/${active.id}`}
                  className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open
                </Link>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white p-3">
          <h2 className="mb-2 text-xl font-semibold">Recommended</h2>
          <ul className="space-y-2 text-sm">
            {state.recommended.slice(0, 4).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3">
          <h2 className="mb-2 text-xl font-semibold">Recently Viewed</h2>
          <ul className="space-y-2 text-sm">
            {state.recent.slice(0, 4).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3">
          <h2 className="mb-2 text-xl font-semibold">Trending</h2>
          <ul className="space-y-2 text-sm">
            {state.trending.slice(0, 4).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </article>
      </section>

      {loading ? <p className="text-center">Loading feed…</p> : null}
    </div>
  )
}
