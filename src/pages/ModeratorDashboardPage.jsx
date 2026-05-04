import { useEffect, useMemo, useState } from 'react'
import { addUserStrike, fetchModeratorQueue, fetchProfilesByIds, fetchReports, getProfile, updateContentModeration, updateReportStatus } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function ModeratorDashboardPage() {
  const { user } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [queue, setQueue] = useState([])
  const [reports, setReports] = useState([])
  const [profileMap, setProfileMap] = useState({})
  const [filters, setFilters] = useState({ status: '', moderation_method: '', target_type: '', report_status: 'open' })

  async function load() {
    const [q, r] = await Promise.all([
      fetchModeratorQueue({ status: filters.status || undefined, moderation_method: filters.moderation_method || undefined }),
      fetchReports({ status: filters.report_status || undefined, target_type: filters.target_type || undefined }),
    ])
    const ids = [...new Set([...q.map((i) => i.user_id), ...r.map((i) => i.reporter_id), ...r.map((i) => i.target_user_id)].filter(Boolean))]
    const profiles = await fetchProfilesByIds(ids)
    setProfileMap(profiles)
    setQueue(q)
    setReports(r)
  }

  useEffect(() => {
    async function init() {
      if (!user?.id) return
      const profile = await getProfile(user.id)
      setAllowed(profile?.role === 'moderator' || profile?.role === 'admin')
    }
    init()
  }, [user?.id])

  useEffect(() => { if (allowed) load() }, [allowed, filters.status, filters.moderation_method, filters.target_type, filters.report_status])

  const pendingHuman = useMemo(() => queue.filter((i) => i.status === 'pending_review'), [queue])
  const aiEscalated = useMemo(() => queue.filter((i) => i.moderation_method === 'ai_escalated'), [queue])

  if (!allowed) return <div className="p-6">Moderator/admin access only.</div>

  return <div className="p-4 space-y-4">
    <h1 className="text-2xl font-bold">Moderator dashboard</h1>
    <p className="text-sm theme-muted">Review queue for human moderation, AI escalations, and user reports.</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{['status','moderation_method','target_type','report_status'].map((k)=><input key={k} placeholder={`Filter ${k}`} className="theme-input rounded border p-2" value={filters[k]} onChange={(e)=>setFilters((f)=>({...f,[k]:e.target.value}))} />)}</div>
    <h2 className="font-semibold">Pending human reviews ({pendingHuman.length}) + AI escalated ({aiEscalated.length})</h2>
    {queue.map((item)=>{
      const owner = profileMap[item.user_id]
      return <div key={item.id} className="theme-card border rounded p-3">
        <p className="font-semibold">{item.title || 'Untitled post'}</p>
        <p className="text-sm theme-muted">Status: {item.status} · Method: {item.moderation_method}</p>
        <p className="text-sm">Posted by: @{owner?.username || item.username || 'unknown'} · {owner?.email || 'email unavailable'}</p>
        <div className="flex gap-2 mt-2">{['published','rejected','removed'].map((s)=><button key={s} className="px-2 py-1 border rounded" onClick={()=>updateContentModeration(item.id,{status:s,reviewed_at:new Date().toISOString(),moderation_completed_at:new Date().toISOString()}).then(load)}>{s==='published'?'approve':s}</button>)}</div>
      </div>
    })}
    <h2 className="font-semibold">Open reports</h2>
    {reports.map((r)=>{
      const reporter = profileMap[r.reporter_id]
      const target = profileMap[r.target_user_id]
      return <div key={r.id} className="theme-card border rounded p-3">
        <p className="font-semibold">{r.target_type} report · {r.reason}</p>
        <p className="text-sm">Reporter: {r.reporter_email || reporter?.email || 'email unavailable'}</p>
        <p className="text-sm">Target user: {r.target_user_email || target?.email || 'email unavailable'}</p>
        <p className="text-sm theme-muted">{r.details || 'No details provided.'}</p>
        <div className="flex gap-2 mt-2"><button className="px-2 py-1 border rounded" onClick={()=>updateReportStatus(r.id,'dismissed').then(load)}>dismiss report</button><button className="px-2 py-1 border rounded" onClick={()=>addUserStrike({user_id:r.target_user_id,notes:'Report strike'}).then(()=>updateReportStatus(r.id,'resolved')).then(load)}>add strike to user</button></div>
      </div>
    })}
  </div>
}
