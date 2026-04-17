import { fallbackContent } from '../data/fallbackContent'
import { hasSupabaseConfig, supabase } from './supabase'

export async function fetchContent({ search = '', category = 'all' } = {}) {
  if (!hasSupabaseConfig) return fallbackContent

  let query = supabase.from('contents').select('*').order('created_at', { ascending: false })

  if (category !== 'all') query = query.eq('type', category)
  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchContentById(id) {
  if (!hasSupabaseConfig) return fallbackContent.find((item) => item.id === id)
  const { data, error } = await supabase.from('contents').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

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

  const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', userId).single()

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
  if (!hasSupabaseConfig || !userId) {
    return {
      recommended: fallbackContent,
      trending: fallbackContent.filter((item) => item.is_trending),
      recent: fallbackContent.slice(0, 2),
      progress: { points: 0, completed_count: 0, level: 1 },
    }
  }

  const [allRes, recentRes, progressRes] = await Promise.all([
    supabase.from('contents').select('*').order('created_at', { ascending: false }).limit(12),
    supabase
      .from('user_views')
      .select('viewed_at, contents(*)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(6),
    supabase.from('user_progress').select('*').eq('user_id', userId).single(),
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

export async function saveProfile(userId, values) {
  if (!hasSupabaseConfig || !userId) return
  await supabase.from('profiles').upsert({ id: userId, ...values })
}

export async function getProfile(userId) {
  if (!hasSupabaseConfig || !userId) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function createContent(payload) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('contents').insert(payload)
  if (error) throw error
}
