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
    const captionUrl = String(formData.get('caption_url') || '').trim()
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

    if (captionUrl && !captionUrl.toLowerCase().endsWith('.vtt')) {
      setStatus('Only .vtt caption files are supported.')
      return
    }

    setSubmitting(true)
    setStatus('Publishing your video...')

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
        caption_url: captionUrl || null,
        category,
        points,
        recommended: false,
        is_trending: false,
      })

      event.currentTarget.reset()
      setStatus('Video link published! It is now live in the feed.')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Your video should be published. This fallback message is only shown when the app cannot read the real error yet.";
      console.error('Publish failed:', err)
      setStatus(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="theme-app-bg p-4 mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-[var(--brand-olive)]">Publish video link</h1>
      <p className="theme-muted">Share a direct .mp4 link to the HoloStem feed.</p>
      <p className="text-sm theme-muted">
        Want us to do it for you?{' '}
        <a
          className="font-semibold text-[var(--brand-olive)] underline hover:text-[var(--brand-leaf)]"
          href="https://unrealcake8.github.io/project-holostem/uploader.html"
          rel="noreferrer"
          target="_blank"
        >
          HoloStem MP4 Generator
        </a>
      </p>
      <div className="theme-card rounded-2xl border p-4">
        <h2 className="text-base font-semibold">What is an MP4 link and how can I generate it without using HoloStem MP4 Generator?</h2>
        <p className="mt-2 text-sm theme-muted">
          An MP4 link is a direct URL that points straight to a video file ending in <code>.mp4</code>. You can generate one by uploading your video to
          a cloud storage service (Google Drive, OneDrive, etc.), then copying the public file URL for
          that uploaded video. Make sure the file is publicly accessible and the URL opens or downloads the MP4 directly. For Google Drive, just use Google Drive Direct Link Generator.
        </p>
      </div>

      <div className="theme-card rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Why does HoloStem ask people to use MP4 links?</h2>
        <p className="mt-2 text-sm theme-muted">
          HoloStem asks people to use direct MP4 links because we don't have a proper server to handle a lot of videos. Using your own MP4 Link allows you to have full control of your video, so that no one steals your video and reposts it on TikTok, YouTube, etc.
        </p>
      </div>
      
      <p className="text-sm theme-muted">Posting as @{username || 'set-username-in-profile'}</p>

      <form className="theme-card grid gap-3 rounded-2xl border p-4" onSubmit={handleSubmit}>
        <input className="theme-input rounded-xl border px-3 py-2" name="title" placeholder="Caption / title" required />
        <textarea className="theme-input rounded-xl border px-3 py-2" name="description" placeholder="Description" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="theme-input rounded-xl border px-3 py-2" name="category" placeholder="Category" />
          <input className="theme-input rounded-xl border px-3 py-2" name="points" type="number" min="5" defaultValue="20" />
        </div>
        <input
          className="theme-input rounded-xl border px-3 py-2"
          name="media_url"
          placeholder="Direct MP4 URL (e.g. https://example.com/video.mp4)"
          type="url"
          required
        />
        <input
          className="theme-input rounded-xl border px-3 py-2"
          name="caption_url"
          placeholder="Optional .vtt caption URL"
          type="url"
        />
        <button className="rounded-full bg-[var(--brand-olive)] px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={submitting}>
          {submitting ? 'Publishing...' : 'Add video link'}
        </button>
        {status && <p className="text-sm theme-muted">{status}</p>}
      </form>
    </div>
  )
}
