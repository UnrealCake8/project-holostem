import { useState } from 'react'
import { createContent, uploadVideoAsset } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function UploadPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get('video')

    if (!(file instanceof File) || file.size === 0) {
      setStatus('Please choose a video file.')
      return
    }

    setUploading(true)
    setStatus('Uploading video...')

    try {
      const mediaUrl = await uploadVideoAsset({ file, userId: user.id })

      await createContent({
        user_id: user.id,
        title: formData.get('title'),
        description: formData.get('description'),
        type: 'video',
        media_url: mediaUrl,
        category: formData.get('category') || 'General',
        points: Number(formData.get('points')) || 20,
        recommended: false,
        is_trending: false,
      })

      event.currentTarget.reset()
      setStatus('Upload complete. Your video is now live in the feed.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-pink-600">Upload video</h1>
      <p className="text-black/60">Post short videos directly to HoloStem like TikTok-style uploads.</p>

      <form className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
        <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="title" placeholder="Caption / title" required />
        <textarea className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="description" placeholder="Description" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="category" placeholder="Category" />
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="points" type="number" min="5" defaultValue="20" />
        </div>
        <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" type="file" name="video" accept="video/*" required />
        <button className="rounded-full bg-pink-600 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Publish video'}
        </button>
        {status && <p className="text-sm text-black/70">{status}</p>}
      </form>
    </div>
  )
}
