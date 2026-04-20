import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchContent,
  fetchFollowingIds,
  fetchFollowNotifications,
  fetchProfileAvatarsByUserIds,
  getDashboardData,
} from '../lib/contentApi'
import { useAuth } from '../context/useAuth'
import FeedItem from '../components/FeedItem'
import {
  acknowledge80,
  acknowledgeLimit,
  addExtension,
  addUsageSeconds,
  getDayString,
  readUsageSettings,
  readUsageState,
  saveUsageSettings,
} from '../lib/usageLimits'

const feedModes = ['for-you', 'following', 'explore']

function MindfulModal({
  type,
  settings,
  usage,
  onClose,
  onTakeBreak,
  onContinue,
}) {
  const [confirming, setConfirming] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!confirming) return
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [confirming, countdown])

  function handleConfirmContinue() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    if (countdown > 0) return
    onContinue()
  }

  const title =
    type === 'eighty'
      ? 'You are close to today\'s watch goal'
      : 'You reached your watch goal'

  const body =
    type === 'eighty'
      ? `Today: ${Math.round(usage.minutesUsed)} / ${settings.dailyLimitMinutes} minutes.`
      : `Today: ${Math.round(usage.minutesUsed)} / ${settings.dailyLimitMinutes + usage.extraMinutes} minutes.`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="theme-card w-full max-w-md rounded-2xl border p-4" onClick={(event) => event.stopPropagation()}>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm theme-muted">{body}</p>
        <div className="mt-4 grid gap-2">
          <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={onTakeBreak}>Take a short break</button>
          <button className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white" onClick={handleConfirmContinue}>
            {confirming
              ? countdown > 0
                ? `Breathe ${countdown}s to continue`
                : `Continue for ${settings.extensionMinutes} more minutes`
              : `Continue mindfully (+${settings.extensionMinutes} min)`}
          </button>
          <button className="rounded-full border border-white/20 px-4 py-2 text-sm" onClick={onClose}>Done for now</button>
        </div>
      </div>
    </div>
  )
}

function UsageOnboarding({ onSave }) {
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="theme-card w-full max-w-lg rounded-2xl border p-4">
        <p className="text-lg font-semibold">Set your mindful defaults</p>
        <p className="mt-1 text-sm theme-muted">These are reminders, not hard locks. You can adjust anytime in Settings.</p>
        <label className="mt-3 block text-sm">
          Daily watch goal
          <select className="theme-input mt-1 w-full rounded-lg border p-2" value={dailyLimitMinutes} onChange={(e) => setDailyLimitMinutes(Number(e.target.value))}>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </label>
        <button
          className="mt-4 w-full rounded-full bg-pink-600 px-4 py-2 font-semibold text-white"
          onClick={() => onSave({ onboarded: true, dailyLimitMinutes })}
        >
          Start with mindful defaults
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [usageSettings, setUsageSettings] = useState(readUsageSettings)
  const [usageState, setUsageState] = useState(() => readUsageState(getDayString()))
  const [modalType, setModalType] = useState('')
  const [touchStart, setTouchStart] = useState(null)
  const containerRef = useRef(null)
  const tab = new URLSearchParams(location.search).get('tab') || 'for-you'
  const searchQuery = new URLSearchParams(location.search).get('q') || ''
  const dayKey = getDayString()

  const usageRatio = useMemo(() => {
    const total = usageSettings.dailyLimitMinutes + usageState.extraMinutes
    return total > 0 ? usageState.minutesUsed / total : 0
  }, [usageSettings.dailyLimitMinutes, usageState.extraMinutes, usageState.minutesUsed])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [, browseData, followingIds, followNotifications] = await Promise.all([
        getDashboardData(user?.id),
        fetchContent({ search: searchQuery, category: 'all' }),
        tab === 'following' && user?.id ? fetchFollowingIds(user.id) : Promise.resolve([]),
        tab === 'activity' && user?.id ? fetchFollowNotifications(user.id) : Promise.resolve([]),
      ])
      if (tab === 'following') {
        const filtered = browseData.filter((item) => followingIds.includes(item.user_id))
        const avatarMap = await fetchProfileAvatarsByUserIds(filtered.map((item) => item.user_id))
        setFeed(filtered.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      } else if (tab === 'explore') {
        const exploreOnly = browseData.filter((item) => item.username === 'holostemexplore')
        const avatarMap = await fetchProfileAvatarsByUserIds(exploreOnly.map((item) => item.user_id))
        setFeed(exploreOnly.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      } else if (tab === 'activity') {
        setFeed([])
        setNotifications(followNotifications)
      } else {
        const avatarMap = await fetchProfileAvatarsByUserIds(browseData.map((item) => item.user_id))
        setFeed(browseData.map((item) => ({ ...item, avatar_url: avatarMap[item.user_id] || '' })))
      }
      setLoading(false)
      setActiveIndex(0)
    }
    load()
  }, [user?.id, tab, searchQuery])

  useEffect(() => {
    if (!containerRef.current || feed.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIndex(Number(entry.target.dataset.feedIndex))
        })
      },
      { root: containerRef.current, threshold: 0.6 },
    )
    const children = containerRef.current.querySelectorAll('[data-feed-index]')
    children.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [feed])

  useEffect(() => {
    const activeItem = feed[activeIndex]
    if (!activeItem) return
    window.history.replaceState(null, '', `/video/${activeItem.id}`)
  }, [activeIndex, dayKey, feed])

  useEffect(() => {
    if (tab === 'activity' || feed.length === 0) return undefined
    const timer = setInterval(() => {
      const next = addUsageSeconds(5, dayKey)
      setUsageState(next)
    }, 5000)
    return () => clearInterval(timer)
  }, [dayKey, feed.length, tab])

  useEffect(() => {
    if (modalType) return
    if (!usageSettings.onboarded) return
    if (usageRatio >= 1 && !usageState.limitPromptShown) {
      setTimeout(() => setModalType('limit'), 0)
      acknowledgeLimit(dayKey)
      return
    }
    if (usageRatio >= 0.8 && !usageState.prompt80Shown) {
      setTimeout(() => setModalType('eighty'), 0)
      acknowledge80(dayKey)
      return
    }
  }, [dayKey, modalType, usageRatio, usageSettings.onboarded, usageState.limitPromptShown, usageState.prompt80Shown])

  function handleDeleted(id) {
    setFeed((prev) => prev.filter((item) => item.id !== id))
  }

  function updateMode(nextTab) {
    const params = new URLSearchParams(location.search)
    if (nextTab === 'for-you') params.delete('tab')
    else params.set('tab', nextTab)
    const query = params.toString()
    navigate(`/dashboard${query ? `?${query}` : ''}`)
  }

  function cycleMode(direction) {
    const currentIndex = feedModes.indexOf(tab)
    if (currentIndex === -1) return
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= feedModes.length) return
    updateMode(feedModes[nextIndex])
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  function handleTouchEnd(event) {
    if (!touchStart || tab === 'activity') return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - touchStart.x
    const dy = Math.abs(touch.clientY - touchStart.y)
    if (Math.abs(dx) < 60 || dy > 80) return
    if (dx < 0) cycleMode(1)
    else cycleMode(-1)
  }

  function handleContinue() {
    const next = addExtension(usageSettings.extensionMinutes, dayKey)
    setUsageState(next)
    setModalType('')
  }

  function handleTakeBreak() {
    setModalType('')
  }

  function handleSaveOnboarding(nextSettings) {
    saveUsageSettings(nextSettings)
    setUsageSettings(readUsageSettings())
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Loading feed…</p>
        </div>
      </div>
    )
  }

  if (tab === 'activity') {
    return (
      <div className="theme-app-bg mx-auto max-w-2xl p-4">
        <section className="theme-card rounded-2xl border p-4">
          <h1 className="text-2xl font-bold text-pink-600">Activity</h1>
          <p className="mt-1 text-sm theme-muted">Recent follows</p>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 && (
              <p className="text-sm theme-muted">No one has followed you yet.</p>
            )}
            {notifications.map((notification) => (
              <div
                key={`${notification.follower_id}-${notification.created_at}`}
                className="rounded-xl border border-black/10 bg-black/10 p-3"
              >
                <p className="text-sm">
                  <span className="font-semibold">
                    @{notification.profiles?.username || 'user'}
                  </span>{' '}
                  started following you.
                </p>
                <p className="mt-1 text-xs theme-muted">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
        <div className="text-5xl">📭</div>
        <p className="text-xl font-semibold">
          {tab === 'following'
            ? (searchQuery ? 'No matching posts from people you follow yet' : 'No posts from people you follow yet')
            : tab === 'explore'
              ? (searchQuery ? 'No matching explore posts yet from @holostemexplore' : 'No explore posts yet from @holostemexplore')
              : (searchQuery ? 'No videos matched your search' : 'No content yet')}
        </p>
        {tab === 'following' || tab === 'explore' ? (
          <Link to="/dashboard" className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white">
            Browse For You feed
          </Link>
        ) : (
          <Link to="/upload" className="rounded-full bg-pink-500 px-6 py-2 font-semibold text-white">
            Upload the first video
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      {!usageSettings.onboarded && <UsageOnboarding onSave={handleSaveOnboarding} />}
      {modalType && (
        <MindfulModal
          type={modalType}
          settings={usageSettings}
          usage={usageState}
          onClose={() => setModalType('')}
          onTakeBreak={handleTakeBreak}
          onContinue={handleContinue}
        />
      )}

      <div className="pointer-events-none fixed left-3 top-3 z-30 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
        {Math.round(usageState.minutesUsed)}m / {usageSettings.dailyLimitMinutes + usageState.extraMinutes}m
      </div>
      <button
        onClick={() => cycleMode(1)}
        className="fixed left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
      >
        {tab === 'for-you' ? 'For You' : tab === 'following' ? 'Following' : 'Explore'} · Swipe ↔
      </button>

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {feed.map((item, index) => (
          <div
            key={item.id}
            data-feed-index={index}
            className="h-screen w-full snap-start snap-always"
          >
            <FeedItem
              item={item}
              isActive={index === activeIndex}
              onDeleted={handleDeleted}
            />
          </div>
        ))}
      </div>
    </>
  )
}
