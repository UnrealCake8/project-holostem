import { fallbackContent } from '../data/fallbackContent'
import { hasSupabaseConfig, supabase } from './supabase'

// ─── Content ──────────────────────────────────────────────────────────────────

export async function fetchContent({ search = '', category = 'all' } = {}) {
  if (!hasSupabaseConfig) return fallbackContent

  let query = supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  if (category !== 'all') query = query.eq('type', category)
  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchContentById(id) {
  if (!hasSupabaseConfig) return fallbackContent.find((item) => item.id === id)
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchVideosByUsername(username) {
  if (!hasSupabaseConfig) {
    return fallbackContent.filter((item) => item.username === username)
  }

  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteContent(contentId) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('contents').delete().eq('id', contentId)
  if (error) throw error
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function fetchLikeStatus(userId, contentId) {
  if (!hasSupabaseConfig || !userId) return false
  const { data } = await supabase
    .from('liked_videos')
    .select('user_id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle()
  return Boolean(data)
}

export async function likeContent(userId, contentId) {
  if (!hasSupabaseConfig || !userId) return
  await supabase
    .from('liked_videos')
    .upsert({ user_id: userId, content_id: contentId }, { onConflict: 'user_id,content_id' })
}

export async function unlikeContent(userId, contentId) {
  if (!hasSupabaseConfig || !userId) return
  await supabase
    .from('liked_videos')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)
}

export async function fetchLikeCount(contentId) {
  if (!hasSupabaseConfig) return 0
  const { count, error } = await supabase
    .from('liked_videos')
    .select('*', { count: 'exact', head: true })
    .eq('content_id', contentId)
  if (error) {
    console.error('Error fetching like count:', error)
    return 0
  }
  return count ?? 0
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(contentId) {
  if (!hasSupabaseConfig) return []
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    user_handle: row.user_handle || row.username || 'user',
  }))
}

export async function addComment({ userId, contentId, username, body }) {
  if (!hasSupabaseConfig || !userId) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, content_id: contentId, user_handle: username, body })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId) {
  if (!hasSupabaseConfig) return
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
  if (error) throw error
}

// ─── Progress / Views ─────────────────────────────────────────────────────────

export async function markContentViewed(userId, contentId) {
  if (!hasSupabaseConfig || !userId) return
  await supabase.from('user_views').upsert(
    {
      user_id: userId,
      content_id: contentId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,content_id' },
  )
}

export async function completeContent({ userId, content }) {
  if (!hasSupabaseConfig || !userId || !content) return

  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  const newPoints = (progress?.points ?? 0) + (content.points ?? 10)
  const completed = (progress?.completed_count ?? 0) + 1

  await supabase.from('user_progress').upsert({
    user_id: userId,
    points: newPoints,
    completed_count: completed,
    level: Math.max(1, Math.floor(newPoints / 100) + 1),
    updated_at: new Date().toISOString(),
  })
}

export async function getDashboardData(userId) {
  if (!hasSupabaseConfig) {
    return {
      recommended: fallbackContent,
      trending: fallbackContent.filter((item) => item.is_trending),
      recent: fallbackContent.slice(0, 2),
      progress: { points: 0, completed_count: 0, level: 1 },
    }
  }

  const [allRes, recentRes, progressRes] = await Promise.all([
    supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12),
    userId
      ? supabase
          .from('user_views')
          .select('viewed_at, contents(*)')
          .eq('user_id', userId)
          .order('viewed_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null }),
    userId
      ? supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single()
      : Promise.resolve({
          data: { points: 0, completed_count: 0, level: 1 },
          error: null,
        }),
  ])

  if (allRes.error) throw allRes.error

  const all = allRes.data ?? []
  const trending = all.filter((item) => item.is_trending)
  const recommended = all.filter((item) => item.recommended).slice(0, 8)
  const recent = (recentRes.data ?? []).map((item) => item.contents).filter(Boolean)

  return {
    recommended: recommended.length ? recommended : all.slice(0, 8),
    trending,
    recent,
    progress: progressRes.data ?? { points: 0, completed_count: 0, level: 1 },
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function saveProfile(userId, values) {
  if (!hasSupabaseConfig || !userId) return
  await supabase.from('profiles').upsert({ id: userId, ...values })
}

export async function getProfile(userId) {
  if (!hasSupabaseConfig || !userId) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function getProfileByUsername(username) {
  if (!username) return null
  if (!hasSupabaseConfig) {
    const firstVideo = fallbackContent.find((item) => item.username === username)
    return firstVideo
      ? { username, display_name: username, bio: 'Demo creator profile' }
      : null
  }
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  return data
}

export async function getUserIdByUsername(username) {
  if (!username) return null
  if (!hasSupabaseConfig) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

// ─── Following / Followers ───────────────────────────────────────────────────

export async function fetchFollowStatus(followerId, followingId) {
  if (!hasSupabaseConfig || !followerId || !followingId) return false
  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  return Boolean(data)
}

export async function followUser(followerId, followingId) {
  if (!hasSupabaseConfig || !followerId || !followingId || followerId === followingId) return
  const { error } = await supabase
    .from('user_follows')
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: 'follower_id,following_id' })
  if (error) throw error
}

export async function unfollowUser(followerId, followingId) {
  if (!hasSupabaseConfig || !followerId || !followingId) return
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw error
}

export async function fetchFollowerCount(userId) {
  if (!hasSupabaseConfig || !userId) return 0
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  if (error) throw error
  return count ?? 0
}

export async function fetchFollowingCount(userId) {
  if (!hasSupabaseConfig || !userId) return 0
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  if (error) throw error
  return count ?? 0
}

export async function fetchFollowingIds(userId) {
  if (!hasSupabaseConfig || !userId) return []
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => row.following_id).filter(Boolean)
}

export async function fetchFollowersForUser(userId) {
  if (!hasSupabaseConfig || !userId) return []
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      follower_id,
      profiles!user_follows_follower_id_fkey (
        username,
        display_name
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchFollowingForUser(userId) {
  if (!hasSupabaseConfig || !userId) return []
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      following_id,
      profiles!user_follows_following_id_fkey (
        username,
        display_name
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchFollowNotifications(userId) {
  if (!hasSupabaseConfig || !userId) return []
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      follower_id,
      created_at,
      profiles!user_follows_follower_id_fkey (
        username,
        display_name
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data ?? []
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function createContent(payload) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('contents').insert(payload)
  if (error) throw error
}

export async function uploadVideoAsset({ file, userId }) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured.')
  if (!file) throw new Error('Select a video file first.')
  if (!userId) throw new Error('You must be logged in to upload videos.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'video/mp4',
    })

  if (uploadError) {
    const reason = uploadError.message || 'Unknown storage error.'
    throw new Error(`Video upload failed: ${reason}`)
  }

  const { data } = supabase.storage.from('videos').getPublicUrl(path)
  return data.publicUrl
}
