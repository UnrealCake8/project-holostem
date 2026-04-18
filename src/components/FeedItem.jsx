import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  likeContent,
  unlikeContent,
  fetchLikeStatus,
  fetchLikeCount,
  fetchComments,
  addComment,
  deleteComment,
  deleteContent,
  followUser,
  unfollowUser,
  fetchFollowStatus,
} from '../lib/contentApi'

// ─── Video / Embed Player ─────────────────────────────────────────────────────
function FeedPlayer({ item, isActive, isPaused }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive && !isPaused) videoRef.current.play().catch(() => {})
    else videoRef.current.pause()
  }, [isActive, isPaused])

  if (!item) return null

  const isYoutube =
    item.media_url?.includes('youtube.com') || item.media_url?.includes('youtu.be')

  if (item.type === 'mini') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black text-white">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-2xl font-bold">Mini Experience</p>
        <p className="mt-2 max-w-xs text-center text-white/70 text-base">
          Tap Open to play and earn points
        </p>
      </div>
    )
  }

  if (isYoutube) {
    const embedUrl = item.media_url
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'youtube.com/embed/')
    const src = isActive && !isPaused
      ? `${embedUrl}?autoplay=1&mute=0&controls=0&loop=1&playlist=${embedUrl.split('/').pop()}`
      : embedUrl
    return (
      <iframe
        key={isActive && !isPaused ? 'active' : 'inactive'}
        title={item.title}
        src={src}
        className="h-full w-full pointer-events-none"
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
        className="h-full w-full object-cover"
        loop
        playsInline
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white px-8 text-center">
      <div className="text-5xl mb-4">📚</div>
      <p className="text-xl font-bold">{item.title}</p>
      <p className="mt-2 text-white/60 text-sm">{item.description}</p>
    </div>
  )
}

// ─── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ item, onClose, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchComments(item.id).then((data) => {
      setComments(data)
      setLoading(false)
    })
  }, [item.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handlePost(e) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setPosting(true)
    try {
      const newComment = await addComment({
        userId: user.id,
        contentId: item.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'anon',
        body: body.trim(),
      })
      setComments((prev) => [...prev, newComment])
      setBody('')
      onCommentAdded?.()
    } finally {
      setPosting(false)
    }
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    onCommentDeleted?.()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      {/* Drawer panel */}
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[#1a1a1a] flex flex-col"
        style={{ height: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white font-semibold text-base">
            {loading ? '...' : `${comments.length} comments`}
          </p>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading && (
            <p className="text-white/40 text-sm text-center mt-8">Loading comments…</p>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-white/40 text-sm text-center mt-8">
              No comments yet. Be the first!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {(c.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs font-semibold mb-0.5">@{c.username}</p>
                <p className="text-white text-sm leading-snug break-words">{c.body}</p>
                <p className="text-white/30 text-xs mt-1">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-white/30 hover:text-red-400 text-xs flex-shrink-0 mt-1"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handlePost}
          className="flex gap-2 px-4 py-3 border-t border-white/10"
        >
          {user ? (
            <>
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
            </>
          ) : (
            <p className="text-white/40 text-sm w-full text-center py-1">
              <Link to="/auth" className="text-pink-400 underline">Log in</Link> to comment
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onCancel}
    >
      <div
        className="bg-[#1a1a1a] rounded-2xl p-6 w-80 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white font-bold text-lg mb-2">Delete this video?</p>
        <p className="text-white/50 text-sm mb-5">
          This can't be undone. The video will be removed from the feed permanently.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/20 py-2 text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-red-500 py-2 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main FeedItem ────────────────────────────────────────────────────────────
export default function FeedItem({ item, isActive, onDeleted }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item?.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(item?.comment_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwner = user && item?.user_id && user.id === item.user_id

  // Reset pause state when becoming active/inactive
  useEffect(() => {
    setIsPaused(false)
  }, [isActive])

  // Fetch real like status and counts on mount
  useEffect(() => {
    if (!item?.id) return
    if (user?.id) {
      fetchLikeStatus(user.id, item.id).then(setLiked)
      if (item.user_id) {
        fetchFollowStatus(user.id, item.user_id).then(setIsFollowing)
      }
    }
  }, [user?.id, item?.id, item.user_id])

  // Sync counts on mount or when item changes
  useEffect(() => {
    if (!item?.id) return
    fetchLikeCount(item.id).then((count) => setLikeCount(count))
    fetchComments(item.id).then((comments) => setCommentCount(comments.length))
  }, [item?.id])

  async function handleToggleFollow() {
    if (!user || !item?.user_id || isOwner) return
    if (isFollowing) {
      await unfollowUser(user.id, item.user_id)
      setIsFollowing(false)
    } else {
      await followUser(user.id, item.user_id)
      setIsFollowing(true)
    }
  }

  async function handleLike() {
    if (!user) {
      navigate('/auth')
      return
    }
    const nowLiked = !liked
    setLiked(nowLiked)
    setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(prev - 1, 0)))
    if (nowLiked) await likeContent(user.id, item.id)
    else await unlikeContent(user.id, item.id)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteContent(item.id)
      setShowDeleteModal(false)
      onDeleted?.(item.id)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/video/${item.id}`
    if (navigator.share) {
      navigator.share({ title: item.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <>
      <div className="relative h-full w-full bg-black overflow-hidden">
        {/* Media */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setIsPaused(!isPaused)}
        >
          <FeedPlayer item={item} isActive={isActive} isPaused={isPaused} />
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-black/40 text-white text-3xl">
                ▶️
              </div>
            </div>
          )}
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Bottom-left: creator info + caption */}
        <div className="absolute bottom-0 left-0 right-16 p-4 pb-8 text-white">
          {item?.username && (
            <Link
              to={`/u/${item.username}`}
              className="mb-1 inline-flex items-center gap-2 font-bold text-base hover:underline"
            >
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-xs font-bold border border-white/30">
                {item.username[0].toUpperCase()}
              </span>
              @{item.username}
            </Link>
          )}
          <p className="text-base font-semibold leading-snug drop-shadow-md line-clamp-2">
            {item?.title}
          </p>
          {item?.description && (
            <p className="mt-0.5 text-sm text-white/70 line-clamp-2 leading-snug simple-mode-hidden">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-block rounded-full bg-white/15 backdrop-blur px-2.5 py-0.5 text-xs capitalize">
              {item?.type}
            </span>
            <Link
              to={`/video/${item.id}`}
              className="inline-block rounded-full bg-pink-500/80 backdrop-blur px-2.5 py-0.5 text-xs font-semibold hover:bg-pink-500"
            >
              View page ↗
            </Link>
          </div>
        </div>

        {/* Right action rail */}
        <div className="absolute right-2 bottom-8 flex flex-col items-center gap-5 pb-2">
          {/* Creator avatar + follow */}
          <div className="relative">
            <Link to={item?.username ? `/u/${item.username}` : '#'}>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
                {(item?.username || '?')[0].toUpperCase()}
              </div>
            </Link>
            {!isOwner && user && (
              <button
                onClick={handleToggleFollow}
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white transition-colors ${
                  isFollowing ? 'bg-gray-500' : 'bg-pink-500'
                }`}
              >
                {isFollowing ? '✓' : '+'}
              </button>
            )}
          </div>

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group"
            aria-label="Like"
          >
            <span
              className={`text-3xl transition-transform duration-150 ${liked ? 'scale-125' : 'group-active:scale-125'}`}
            >
              {liked ? '❤️' : '🤍'}
            </span>
            <span className="text-white text-xs font-semibold drop-shadow simple-mode-hidden">{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1"
            aria-label="Comments"
          >
            <span className="text-3xl">💬</span>
            <span className="text-white text-xs font-semibold drop-shadow simple-mode-hidden">{commentCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1"
            aria-label="Share"
          >
            <span className="text-3xl">↗️</span>
            <span className="text-white text-xs font-semibold drop-shadow simple-mode-hidden">Share</span>
          </button>

          {/* Delete (owner only) */}
          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex flex-col items-center gap-1"
              aria-label="Delete"
            >
              <span className="text-2xl">🗑️</span>
              <span className="text-white text-xs font-semibold drop-shadow simple-mode-hidden">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Comments drawer */}
      {showComments && (
        <CommentsDrawer
          item={{ ...item, comment_count: commentCount }}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount((prev) => prev + 1)}
          onCommentDeleted={() => setCommentCount((prev) => Math.max(0, prev - 1))}
        />
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
