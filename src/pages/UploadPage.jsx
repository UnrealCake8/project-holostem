import { useEffect, useState } from 'react'
import { createContent, getProfile } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function UploadPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState(user?.user_metadata?.username || '')

  useEffect(() => {
    if (user?.id) {
      async function loadProfile() {
        const profile = await getProfile(user.id)
        if (profile?.username) setUsername(profile.username)
      }
      loadProfile()
    }
  }, [user?.id])

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const mediaUrl = String(formData.get('media_url') || '').trim()
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const category = String(formData.get('category') || 'General').trim()
    const points = Number(formData.get('points')) || 20

    if (!mediaUrl) {
      setStatus('Please provide a video URL.')
      return
    }

    if (!mediaUrl.toLowerCase().endsWith('.mp4')) {
      setStatus('Only direct .mp4 links are supported.')
      return
    }

    setSubmitting(true)
    setStatus('Publishing video...')

    try {
      if (!username) {
        throw new Error('Set a username in Profile before publishing.')
      }

      await createContent({
        user_id: user.id,
        title,
        description,
        username,
        type: 'video',
        media_url: mediaUrl,
        category,
        points,
        recommended: false,
        is_trending: false,
      })

      event.currentTarget.reset()
      setStatus('Video link published! It is now live in the feed.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Your video should be published. This error message is irrelevant but the app can't restrict it at the moment.'
      console.error('Publish failed:', err)
      setStatus(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-pink-600">Publish video link</h1>
      <p className="text-black/60">Share a direct .mp4 link to the HoloStem feed.</p>
      <p className="text-sm text-black/70">
        Need help creating one?{' '}
        <a
          className="font-semibold text-pink-600 underline hover:text-pink-700"
          href="https://unrealcake8.github.io/project-holostem/uploader.html"
          rel="noreferrer"
          target="_blank"
        >
          HoloStem MP4 Generator
        </a>
      </p>
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h2 className="text-base font-semibold text-black">What is an MP4 link and how can I generate it without using HoloStem MP4 Generator?</h2>
        <p className="mt-2 text-sm text-black/70">
          An MP4 link is a direct URL that points straight to a video file ending in <code>.mp4</code>. You can generate one by uploading your video to
          a cloud storage service (for example Supabase Storage, Cloudinary, Amazon S3, or Google Cloud Storage), then copying the public file URL for
          that uploaded video. Make sure the file is publicly accessible and the URL opens or downloads the MP4 directly.
        </p>
      </div>
      <p className="text-sm text-black/50">Posting as @{username || 'set-username-in-profile'}</p>

      <form className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
        <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="title" placeholder="Caption / title" required />
        <textarea className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="description" placeholder="Description" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="category" placeholder="Category" />
          <input className="rounded-xl border border-black/10 bg-black/5 px-3 py-2" name="points" type="number" min="5" defaultValue="20" />
        </div>
        <input
          className="rounded-xl border border-black/10 bg-black/5 px-3 py-2"
          name="media_url"
          placeholder="Direct MP4 URL (e.g. https://example.com/video.mp4)"
          type="url"
          required
        />
        <button className="rounded-full bg-pink-600 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={submitting}>
          {submitting ? 'Publishing...' : 'Add video link'}
        </button>
        {status && <p className="text-sm text-black/70">{status}</p>}
      </form>
    </div>
  )
}
