import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  fetchContentById,
  fetchLikeStatus,
  likeContent,
  unlikeContent,
  fetchComments,
  addComment,
  deleteComment,
  deleteContent,
} from '../lib/contentApi'

function VideoPlayer({ item }) {
  const videoRef = useRef(null)
  const isYoutube =
    item.media_url?.includes('youtube.com') || item.media_url?.includes('youtu.be')

  if (item.type === 'mini') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black text-white">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-2xl font-bold">Mini Experience</p>
      </div>
    )
  }

  if (isYoutube) {
    const embedUrl = item.media_url
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'youtube.com/embed/')
    return (
      <iframe
        title={item.title}
        src={`${embedUrl}?autoplay=1&controls=1`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (item.media_url) {
    return (
      <video
        ref={videoRef}
        src={item.media_url}
        className="h-full w-full object-contain bg-black"
        controls
        autoPlay
        loop
        playsInline
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-white px-8 text-center">
      <div className="text-5xl mb-4">📚</div>
      <p className="text-xl font-bold">{item.title}</p>
      <p className="mt-2 text-white/60 text-sm">{item.description}</p>
    </div>
  )
}

export default function VideoPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const bottomRef = useRef(null)

  const isOwner = user && item?.user_id && user.id === item.user_id

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [content, commentsData] = await Promise.all([
        fetchContentById(id),
        fetchComments(id),
      ])
      setItem(content)
      setLikeCount(content?.like_count ?? 0)
      setComments(commentsData)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!user?.id || !id) return
    fetchLikeStatus(user.id, id).then(setLiked)
  }, [user?.id, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleLike() {
    if (!user) { navigate('/auth'); return }
    const nowLiked = !liked
    setLiked(nowLiked)
    setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(prev - 1, 0)))
    if (nowLiked) await likeContent(user.id, id)
    else await unlikeContent(user.id, id)
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setPosting(true)
    try {
      const newComment = await addComment({
        userId: user.id,
        contentId: id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'anon',
        body: body.trim(),
      })
      setComments((prev) => [...prev, newComment])
      setBody('')
    } finally {
      setPosting(false)
    }
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteContent(id)
      navigate('/dashboard')
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleting(false)
    }
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: item?.title, url }).catch(() => {})
    else navigator.clipboard.writeText(url)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-xl">Video not found.</p>
        <Link to="/dashboard" className="text-pink-400 underline">Back to feed</Link>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen bg-[#0f0f0f] text-white">
      {/* Back nav */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-black/80 backdrop-blur px-4 py-3 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        <p className="text-sm font-semibold text-white/80 line-clamp-1 flex-1">{item.title}</p>
        {isOwner && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-red-400 text-xs font-semibold hover:bg-red-500/30"
          >
            🗑 Delete
          </button>
        )}
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Video */}
        <div className="w-full bg-black" style={{ aspectRatio: '9/16', maxHeight: '80vh' }}>
          <VideoPlayer item={item} />
        </div>

        {/* Info + actions */}
        <div className="px-4 pt-4 pb-2">
          {item.username && (
            <Link
              to={`/u/${item.username}`}
              className="inline-flex items-center gap-2 mb-2 hover:underline"
            >
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-xs font-bold">
                {item.username[0].toUpperCase()}
              </span>
              <span className="font-semibold text-base">@{item.username}</span>
            </Link>
          )}
          <h1 className="text-xl font-bold leading-snug">{item.title}</h1>
          {item.description && (
            <p className="mt-1 text-white/60 text-sm leading-relaxed">{item.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs capitalize">
              {item.type}
            </span>
            {item.category && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                {item.category}
              </span>
            )}
          </div>

          {/* Like / Share row */}
          <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              <span className="text-xl">↗️</span>
              Share
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="px-4 pb-24 mt-2 border-t border-white/10">
          <h2 className="py-3 font-semibold text-base">{comments.length} Comments</h2>

          <div className="space-y-4">
            {comments.length === 0 && (
              <p className="text-white/30 text-sm text-center py-6">
                No comments yet. Be the first!
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {(c.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-xs font-semibold mb-0.5">@{c.username}</p>
                  <p className="text-white text-sm leading-snug break-words">{c.body}</p>
                  <p className="text-white/25 text-xs mt-1">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-white/25 hover:text-red-400 text-xs flex-shrink-0 mt-1"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Comment input */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/10 px-4 py-3">
            <div className="mx-auto max-w-2xl">
              {user ? (
                <form onSubmit={handlePost} className="flex gap-2">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-full bg-white/10 px-4 py-2 text-white text-sm placeholder-white/30 outline-none focus:bg-white/15"
                  />
                  <button
                    type="submit"
                    disabled={posting || !body.trim()}
                    className="rounded-full bg-pink-500 px-4 py-2 text-white text-sm font-semibold disabled:opacity-40"
                  >
                    Post
                  </button>
                </form>
              ) : (
                <p className="text-white/40 text-sm text-center">
                  <Link to="/auth" className="text-pink-400 underline">Log in</Link> to comment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-[#1a1a1a] rounded-2xl p-6 w-80 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-bold text-lg mb-2">Delete this video?</p>
            <p className="text-white/50 text-sm mb-5">
              This can't be undone. The video will be removed permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-white/20 py-2 text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 py-2 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
