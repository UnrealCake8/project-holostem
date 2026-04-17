import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { completeContent, fetchContentById, markContentViewed } from '../lib/contentApi'
import { useAuth } from '../context/useAuth'

function MiniExperience() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [running, timeLeft])


  function start() {
    setRunning(true)
    setTimeLeft(10)
    setScore(0)
  }

  return (
    <div className="space-y-3 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4">
      <h3 className="font-semibold">Mini Experience: Tap challenge</h3>
      <p>Tap as many times as possible in 10 seconds.</p>
      <p className="text-sm text-slate-300">Time left: {timeLeft}s • Score: {score}</p>
      <div className="flex gap-2">
        <button className="rounded-md bg-neon-violet/60 px-3 py-2" onClick={start}>Start</button>
        <button className="rounded-md bg-neon-cyan px-3 py-2 text-slate-950" disabled={!running} onClick={() => setScore((s) => s + 1)}>
          Tap +1
        </button>
      </div>
    </div>
  )
}

export default function ContentViewerPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [content, setContent] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    async function load() {
      const data = await fetchContentById(id)
      setContent(data)
      if (data) await markContentViewed(user.id, data.id)
    }
    load()
  }, [id, user.id])

  async function handleComplete() {
    if (!content) return
    await completeContent({ userId: user.id, content })
    setStatus(`Completed! +${content.points ?? 10} points`)
  }

  if (!content) return <p>Loading content...</p>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase text-slate-400">{content.type}</p>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="mt-1 text-slate-300">{content.description}</p>
      </div>

      {content.type === 'mini' ? (
        <MiniExperience />
      ) : content.media_url?.includes('youtube.com') || content.media_url?.includes('youtu.be') ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          <iframe
            title={content.title}
            src={content.media_url}
            className="h-[220px] w-full md:h-[420px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          <video src={content.media_url} className="h-[220px] w-full object-cover md:h-[420px]" controls autoPlay loop />
        </div>
      )}

      <button className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-900" onClick={handleComplete}>
        Mark as complete
      </button>
      {status && <p className="text-emerald-300">{status}</p>}
    </div>
  )
}
