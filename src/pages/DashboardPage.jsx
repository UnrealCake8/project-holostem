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
  acknowledgeSessionPrompt,
  addExtension,
  addUsageSeconds,
  getDayString,
  markVideoSeen,
  readUsageSettings,
  readUsageState,
  resetSession,
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
      : type === 'session'
        ? 'Session complete'
        : 'You reached your watch goal'

  const body =
    type === 'eighty'
      ? `Today: ${Math.round(usage.minutesUsed)} / ${settings.dailyLimitMinutes} minutes.`
      : type === 'session'
        ? `You watched ${usage.sessionVideos} videos in this session.`
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
  const [videosPerSession, setVideosPerSession] = useState(10)

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
        <label className="mt-3 block text-sm">
          Videos per session
          <select className="theme-input mt-1 w-full rounded-lg border p-2" value={videosPerSession} onChange={(e) => setVideosPerSession(Number(e.target.value))}>
            <option value={5}>5 videos</option>
            <option value={10}>10 videos</option>
            <option value={20}>20 videos</option>
          </select>
        </label>
        <button
          className="mt-4 w-full rounded-full bg-pink-600 px-4 py-2 font-semibold text-white"
          onClick={() => onSave({ onboarded: true, dailyLimitMinutes, videosPerSession })}
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
    const nextUsage = markVideoSeen(activeItem.id, dayKey)
    setTimeout(() => setUsageState(nextUsage), 0)
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
    if (usageState.sessionVideos >= usageSettings.videosPerSession && usageState.sessionPromptShownAt !== usageState.sessionVideos) {
      setTimeout(() => setModalType('session'), 0)
      acknowledgeSessionPrompt(usageState.sessionVideos, dayKey)
    }
  }, [dayKey, modalType, usageRatio, usageSettings.onboarded, usageSettings.videosPerSession, usageState.limitPromptShown, usageState.prompt80Shown, usageState.sessionPromptShownAt, usageState.sessionVideos])

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
    const next = resetSession(dayKey)
    setUsageState(next)
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
    const suggested = [
      { name: 'edmondx', hint: 'Suggested for you', avatar: '☠', tone: 'from-cyan-400 to-emerald-300' },
      { name: 'malekkalt', hint: 'From your contacts', avatar: '⚽', tone: 'from-yellow-300 to-lime-500' },
      { name: 'daily_stem', hint: 'Followed by creators', avatar: '🧪', tone: 'from-pink-400 to-purple-500' },
    ]

    return (
      <div className="theme-app-bg mx-auto max-w-2xl p-4 pt-20 lg:p-4">
        <section className="hidden theme-card rounded-2xl border p-4 lg:block">
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

        <section className="-mx-4 -mt-20 min-h-screen bg-black pb-28 pt-20 text-white lg:hidden">
          <div className="flex gap-7 overflow-x-auto px-5 pb-6 pt-4" style={{ scrollbarWidth: 'none' }}>
            <div className="w-24 flex-none text-center">
              <div className="relative mx-auto h-24 w-24 rounded-full border border-white/15 bg-[#171b17]">
                <span className="absolute -top-3 left-4 rounded-2xl bg-zinc-700 px-3 py-2 text-left text-lg font-black leading-tight text-white/70">What's<br />good?</span>
                <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-sky-400 text-3xl font-black">+</span>
              </div>
              <p className="mt-3 text-base font-bold">Create</p>
            </div>
            {suggested.map((story) => (
              <div key={story.name} className="w-24 flex-none text-center">
                <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br ${story.tone} p-1`}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white text-4xl text-black">{story.avatar}</div>
                </div>
                <p className="mt-3 truncate text-base font-bold">{story.name}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6 px-5">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-sky-500 text-4xl">♟</div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl">New followers</p>
                <p className="truncate text-xl text-white/55">
                  {notifications[0]?.profiles?.username ? `${notifications[0].profiles.username} started following you.` : 'No new followers yet.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-rose-500 text-4xl">♥</div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl">Activity</p>
                <p className="truncate text-xl text-white/55">Likes, comments, replies, and mentions.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-zinc-800 text-4xl">▰</div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl">System notifications</p>
                <p className="truncate text-xl text-white/55">Screen time reminders · 4d</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#171717] px-5 py-6">
            <h2 className="mb-5 text-2xl font-black">Suggested accounts <span className="text-lg">ⓘ</span></h2>
            <div className="space-y-8">
              {suggested.map((account) => (
                <div key={`suggested-${account.name}`} className="flex items-center gap-4">
                  <div className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${account.tone} text-3xl`}>{account.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold">{account.name}</p>
                    <p className="truncate text-base text-white/55">{account.hint}</p>
                  </div>
                  <button className="rounded-full bg-rose-500 px-8 py-2 text-xl font-bold">Follow</button>
                  <button className="text-4xl text-white/40">×</button>
                </div>
              ))}
            </div>
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
      {!usageSettings.onboarded && <div className="hidden lg:block"><UsageOnboarding onSave={handleSaveOnboarding} /></div>}
      {modalType && (
        <div className="hidden lg:block">
        <MindfulModal
          type={modalType}
          settings={usageSettings}
          usage={usageState}
          onClose={() => setModalType('')}
          onTakeBreak={handleTakeBreak}
          onContinue={handleContinue}
        />
        </div>
      )}

      <div className="pointer-events-none fixed left-3 top-3 z-30 hidden rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur lg:block">
        {Math.round(usageState.minutesUsed)}m / {usageSettings.dailyLimitMinutes + usageState.extraMinutes}m
      </div>
      <button
        onClick={() => cycleMode(1)}
        className="fixed left-1/2 top-3 z-30 hidden -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur lg:block"
      >
        {tab === 'for-you' ? 'For You' : tab === 'following' ? 'Following' : 'Explore'} · Swipe ↔
      </button>

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
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
