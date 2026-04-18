import { useEffect, useState } from 'react'
import { createContent, getProfile, uploadVideoAsset } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

export default function UploadPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState(user.user_metadata?.username || '')
  const [selectedFiles, setSelectedFiles] = useState([])

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile(user.id)
      if (profile?.username) setUsername(profile.username)
    }
    loadProfile()
  }, [user.id])

  async function handleSubmit(event) {
    event.preventDefault()
    if (selectedFiles.length === 0) {
      setStatus('Please choose at least one video file.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const baseTitle = formData.get('title')
    const description = formData.get('description')
    const category = formData.get('category') || 'General'
    const points = Number(formData.get('points')) || 20

    setUploading(true)

    try {
      if (!username) {
        throw new Error('Set a username in Profile before uploading.')
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setStatus(`Uploading video ${i + 1} of ${selectedFiles.length}: ${file.name}...`)

        const mediaUrl = await uploadVideoAsset({ file, userId: user.id })
        const title = selectedFiles.length > 1 ? `${baseTitle} (Part ${i + 1})` : baseTitle

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
      }

      event.currentTarget.reset()
      setSelectedFiles([])
      setStatus(`Successfully uploaded ${selectedFiles.length} videos. They are now live in the feed.`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  return (
    <div className="p-4 mx-auto max-w-2xl space-y-4 lg:p-8">
      <h1 className="text-3xl font-bold text-pink-600">Upload video</h1>
      <p className="text-black/60">Post short videos directly to HoloStem like TikTok-style uploads. Select multiple files for bulk upload.</p>
      <p className="text-sm text-black/50">Posting as @{username || 'set-username-in-profile'}</p>

      <form className="grid gap-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Caption / Title</label>
          <input className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500" name="title" placeholder="e.g. My Science Experiment" required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Description</label>
          <textarea className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500" name="description" placeholder="What is this video about?" required rows={3} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Category</label>
            <input className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500" name="category" placeholder="e.g. Physics" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Points</label>
            <input className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500" name="points" type="number" min="5" defaultValue="20" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Select Videos</label>
          <input
            className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            type="file"
            name="video"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            required
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-2 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">{selectedFiles.length} files selected:</p>
            <ul className="max-h-32 overflow-y-auto space-y-1">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="text-xs text-gray-500 flex justify-between">
                  <span className="truncate">{file.name}</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="mt-4 rounded-full bg-pink-600 px-6 py-3 font-bold text-white transition-all hover:bg-pink-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed" disabled={uploading}>
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processing Bulk Upload...
            </div>
          ) : `Publish ${selectedFiles.length > 1 ? selectedFiles.length + ' Videos' : 'Video'}`}
        </button>

        {status && (
          <div className={`mt-2 rounded-lg p-3 text-sm font-medium ${status.includes('Successfully') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  )
}
