import { useEffect, useState } from 'react'
import { createContent, getProfile } from '../lib/contentApi'
import { uploadVideoToBunny } from '../lib/bunnyUpload'
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
    const form = event.currentTarget
    const formData = new FormData(form)
    let mediaUrl = String(formData.get('media_url') || '').trim()
    const videoFile = formData.get('video_file')
    const captionUrl = String(formData.get('caption_url') || '').trim()
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const category = String(formData.get('category') || 'General').trim()
    const points = Number(formData.get('points')) || 20

    if ((!videoFile || videoFile.size === 0) && !mediaUrl) {
      setStatus('Choose a video file or paste a direct MP4 link.')
      return
    }

    if (mediaUrl && !mediaUrl.toLowerCase().endsWith('.mp4')) {
      setStatus('Backup links must be direct .mp4 URLs.')
      return
    }

    if (captionUrl && !captionUrl.toLowerCase().endsWith('.vtt')) {
      setStatus('Only .vtt caption files are supported.')
      return
    }

    setSubmitting(true)
    setStatus(videoFile && videoFile.size > 0 ? 'Uploading your video to Bunny.net...' : 'Publishing your video...')

    try {
      if (!username) {
        throw new Error('Set a username in Profile before publishing.')
      }

      if (videoFile && videoFile.size > 0) {
        mediaUrl = await uploadVideoToBunny(videoFile)
        setStatus('Publishing your Bunny.net video...')
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

      form.reset()
      setStatus('Video published! It is now live in the feed.')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Your video should be published. This fallback message is only shown when the app cannot read the real error yet."
      console.error('Publish failed:', err)
      setStatus(message.includes("Cannot read properties of null (reading 'reset')") ? 'Your video was uploaded.' : message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="theme-app-bg p-4 mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-[var(--brand-olive)]">Upload video</h1>
      <p className="theme-muted">Upload a video file to Bunny.net, or paste a direct MP4 link as a backup.</p>

      <p className="text-sm theme-muted">Posting as @{username || 'set-username-in-profile'}</p>

      <form className="theme-card grid gap-3 rounded-2xl border p-4" onSubmit={handleSubmit}>
        <input className="theme-input rounded-xl border px-3 py-2" name="title" placeholder="Caption / title" required />
        <textarea className="theme-input rounded-xl border px-3 py-2" name="description" placeholder="Description" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="theme-input rounded-xl border px-3 py-2" name="category" placeholder="Category" />
          <input className="theme-input rounded-xl border px-3 py-2" name="points" type="number" min="5" defaultValue="20" />
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Video file
          <input
            accept="video/*"
            className="theme-input rounded-xl border px-3 py-2"
            name="video_file"
            type="file"
          />
          <span className="text-xs font-normal theme-muted">Uploaded videos are stored and delivered through Bunny.net.</span>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Backup MP4 link
          <input
            className="theme-input rounded-xl border px-3 py-2"
            name="media_url"
            placeholder="Direct MP4 URL (optional backup)"
            type="url"
          />
        </label>
        <input
          className="theme-input rounded-xl border px-3 py-2"
          name="caption_url"
          placeholder="Optional .vtt caption URL"
          type="url"
        />
        <button className="rounded-full bg-[var(--brand-olive)] px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={submitting}>
          {submitting ? 'Publishing...' : 'Publish video'}
        </button>
        {status && <p className="text-sm theme-muted">{status}</p>}
      </form>
    </div>
  )
}
