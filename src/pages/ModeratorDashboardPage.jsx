import { useEffect, useState } from 'react'
import { fetchModeratorQueue, fetchReports, updateContentModeration, updateReportStatus, getProfile, addUserStrike } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function ModeratorDashboardPage() {
  const { user } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [queue, setQueue] = useState([])
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({ status: '', moderation_method: '', target_type: '', report_status: 'open' })

  async function load() {
    const [q, r] = await Promise.all([
      fetchModeratorQueue({ status: filters.status || undefined, moderation_method: filters.moderation_method || undefined }),
      fetchReports({ status: filters.report_status || undefined, target_type: filters.target_type || undefined }),
    ])
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

  if (!allowed) return <div className="p-6">Moderator/admin access only.</div>

  return <div className="p-4 space-y-4"><h1 className="text-2xl font-bold">Moderator dashboard</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{['status','moderation_method','target_type','report_status'].map((k)=><input key={k} placeholder={k} className="theme-input rounded border p-2" value={filters[k]} onChange={(e)=>setFilters((f)=>({...f,[k]:e.target.value}))} />)}</div>
    <h2 className="font-semibold">Pending/AI escalated reviews</h2>
    {queue.map((item)=><div key={item.id} className="theme-card border rounded p-3"><p>{item.title} · {item.status} · {item.moderation_method}</p><div className="flex gap-2 mt-2">{['published','rejected','removed'].map((s)=><button key={s} className="px-2 py-1 border rounded" onClick={()=>updateContentModeration(item.id,{status:s,reviewed_at:new Date().toISOString(),moderation_completed_at:new Date().toISOString()}).then(load)}>{s==='published'?'approve':s}</button>)}</div></div>)}
    <h2 className="font-semibold">Open reports</h2>
    {reports.map((r)=><div key={r.id} className="theme-card border rounded p-3"><p>{r.target_type} · {r.reason} · {r.status}</p><p className="text-sm">{r.details}</p><div className="flex gap-2 mt-2"><button className="px-2 py-1 border rounded" onClick={()=>updateReportStatus(r.id,'dismissed').then(load)}>dismiss report</button><button className="px-2 py-1 border rounded" onClick={()=>addUserStrike({user_id:r.target_user_id,notes:'Report strike'}).then(()=>updateReportStatus(r.id,'resolved')).then(load)}>add strike to user</button></div></div>)}
  </div>
}
