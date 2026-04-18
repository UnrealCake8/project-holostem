import { useEffect, useState } from 'react'
import { createContent, getProfile } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

function isMp4Url(value) {
  try {
    const url = new URL(value)
    return url.pathname.toLowerCase().endsWith('.mp4')
  } catch {
    return false
  }
}

export default function VideoLinkPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState(user.user_metadata?.username || '')

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile(user.id)
      if (profile?.username) setUsername(profile.username)
    }
    loadProfile()
  }, [user.id])

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const mediaUrl = String(formData.get('media_url') || '').trim()

    if (!isMp4Url(mediaUrl)) {
      setStatus('Please provide a direct MP4 link that ends with .mp4.')
      return
    }

    setSubmitting(true)
    setStatus('Publishing video link...')

    try {
      if (!username) {
        throw new Error('Set a username in Profile before publishing.')
      }

      await createContent({
        user_id: user.id,
        title: formData.get('title'),
        description: formData.get('description'),
        username,
        type: 'video',
        media_url: mediaUrl,
        category: formData.get('category') || 'General',
        points: Number(formData.get('points')) || 20,
        recommended: false,
        is_trending: false,
      })

      event.currentTarget.reset()
      setStatus('Video link published to the feed.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed. Please try again.'
      setStatus(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-pink-600">Publish MP4 link</h1>
      <p className="text-black/60">Post videos by pasting a direct MP4 URL.</p>
      <p className="text-sm text-black/50">Posting as @{username || 'set-username-in-profile'}</p>

      <form className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
        <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="title" placeholder="Caption / title" required />
        <textarea className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="description" placeholder="Description" required />
        <input
          className="rounded-xl border border-black/10 bg-black/5 px-3 py-2"
          name="media_url"
          type="url"
          placeholder="https://example.com/video.mp4"
          required
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="category" placeholder="Category" />
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="points" type="number" min="5" defaultValue="20" />
        </div>
        <button className="rounded-full bg-pink-600 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={submitting}>
          {submitting ? 'Publishing...' : 'Publish video link'}
        </button>
        {status && <p className="text-sm text-black/70">{status}</p>}
      </form>
    </div>
  )
}
