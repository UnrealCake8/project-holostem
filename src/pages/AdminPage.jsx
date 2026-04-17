import { useState } from 'react'
import { createContent } from '../lib/contentApi'

export default function AdminPage() {
  const [status, setStatus] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      media_url: formData.get('media_url'),
      points: Number(formData.get('points')),
      category: formData.get('category'),
      recommended: formData.get('recommended') === 'on',
      is_trending: formData.get('is_trending') === 'on',
    }

    try {
      await createContent(payload)
      setStatus('Content created.')
      event.currentTarget.reset()
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neon-cyan">Admin Content Uploader</h1>
      <form className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
        <input className="rounded-md bg-slate-800 p-2" name="title" placeholder="Title" required />
        <textarea className="rounded-md bg-slate-800 p-2" name="description" placeholder="Description" required />
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-md bg-slate-800 p-2" name="type" defaultValue="video">
            <option value="video">Video</option>
            <option value="lesson">Interactive lesson</option>
            <option value="mini">Mini experience</option>
          </select>
          <input className="rounded-md bg-slate-800 p-2" name="category" placeholder="Category" required />
        </div>
        <input className="rounded-md bg-slate-800 p-2" name="media_url" placeholder="Media URL (YouTube embed for video/lesson)" />
        <input className="rounded-md bg-slate-800 p-2" name="points" type="number" min="5" defaultValue="20" required />
        <label className="text-sm"><input name="recommended" type="checkbox" className="mr-2" />Recommended</label>
        <label className="text-sm"><input name="is_trending" type="checkbox" className="mr-2" />Trending</label>
        <button className="rounded-md bg-neon-violet/70 px-3 py-2 font-semibold">Create content</button>
        {status && <p className="text-sm text-emerald-300">{status}</p>}
      </form>
    </div>
  )
}
