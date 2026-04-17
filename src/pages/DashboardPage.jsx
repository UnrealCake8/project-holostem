import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchContent, getDashboardData } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

function ContentCard({ item }) {
  return (
    <Link
      to={`/content/${item.id}`}
      className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
    >
      <p className="mb-1 text-xs uppercase text-slate-400">{item.type}</p>
      <h3 className="font-semibold">{item.title}</h3>
      <p className="mt-1 text-sm text-slate-300 line-clamp-2">{item.description}</p>
      <p className="mt-2 text-xs text-emerald-300">+{item.points ?? 10} points</p>
    </Link>
  )
}

function ContentRow({ title, items }) {
  if (!items?.length) return null
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-neon-cyan">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [state, setState] = useState({ recommended: [], trending: [], recent: [], progress: null })
  const [browse, setBrowse] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [dashboardData, browseData] = await Promise.all([
        getDashboardData(user.id),
        fetchContent({ search, category }),
      ])
      setState(dashboardData)
      setBrowse(browseData)
      setLoading(false)
    }
    load()
  }, [user.id, search, category])

  const progressPct = useMemo(() => {
    const points = state.progress?.points ?? 0
    return Math.min(100, points % 100)
  }, [state.progress?.points])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 p-4">
        <p className="text-sm text-slate-300">Welcome back</p>
        <h1 className="text-2xl font-bold">{user.user_metadata?.full_name || user.email}</h1>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-white/10 p-2">Points: {state.progress?.points ?? 0}</div>
          <div className="rounded-lg bg-white/10 p-2">Completed: {state.progress?.completed_count ?? 0}</div>
          <div className="rounded-lg bg-white/10 p-2">Level: {state.progress?.level ?? 1}</div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/20">
          <div className="h-2 rounded-full bg-neon-cyan" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold text-neon-cyan">Interactive Content Library</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-md bg-slate-800 p-2"
            placeholder="Search videos, lessons, experiences"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded-md bg-slate-800 p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All types</option>
            <option value="video">Videos</option>
            <option value="lesson">Interactive lessons</option>
            <option value="mini">Mini experiences</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {browse.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {loading ? <p>Loading feed…</p> : null}
      <ContentRow title="Recommended for you" items={state.recommended} />
      <ContentRow title="Recently viewed" items={state.recent} />
      <ContentRow title="Trending" items={state.trending} />
    </div>
  )
}
