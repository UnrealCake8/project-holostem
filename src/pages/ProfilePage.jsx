import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getProfile, saveProfile } from '../lib/contentApi'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ display_name: '', username: '', bio: '', age_group: 'all' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    async function load() {
      const data = await getProfile(user.id)
      if (data) setProfile(data)
      else setProfile((prev) => ({
        ...prev,
        display_name: user.user_metadata?.full_name ?? '',
        username: user.user_metadata?.username ?? '',
      }))
    }
    load()
  }, [user.id, user.user_metadata?.full_name, user.user_metadata?.username])

  async function handleSubmit(event) {
    event.preventDefault()
    await saveProfile(user.id, profile)
    setStatus('Profile saved.')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neon-cyan">Profile</h1>
      <form className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Display name</span>
          <input className="w-full rounded-md bg-slate-800 p-2" value={profile.display_name || ''} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Username</span>
          <input className="w-full rounded-md bg-slate-800 p-2" value={profile.username || ''} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Bio</span>
          <textarea className="w-full rounded-md bg-slate-800 p-2" value={profile.bio || ''} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Age group</span>
          <select className="w-full rounded-md bg-slate-800 p-2" value={profile.age_group || 'all'} onChange={(e) => setProfile((p) => ({ ...p, age_group: e.target.value }))}>
            <option value="all">All ages</option>
            <option value="kids">Kids</option>
            <option value="teens">Teens</option>
            <option value="adults">Adults</option>
          </select>
        </label>
        <button className="rounded-md bg-neon-cyan px-3 py-2 font-semibold text-slate-900">Save</button>
        {status && <p className="text-emerald-300">{status}</p>}
      </form>
    </div>
  )
}
