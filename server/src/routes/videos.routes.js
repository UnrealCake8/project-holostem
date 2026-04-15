import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'public/uploads'),
  filename: (_, file, cb) => {
    const timestamp = Date.now()
    const sanitized = file.originalname.replace(/\s+/g, '-').toLowerCase()
    cb(null, `${timestamp}-${sanitized}`)
  },
})

const upload = multer({ storage })

router.get('/feed', async (_req, res) => {
  const videos = await prisma.video.findMany({
    where: { visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  })
  return res.json({ videos })
})

router.post('/upload', requireAuth, upload.single('video'), async (req, res) => {
  const file = req.file
  const { caption, visibility } = req.body

  if (!file || !caption) {
    return res.status(400).json({ message: 'Caption and video file are required' })
  }

  const video = await prisma.video.create({
    data: {
      userId: req.user.id,
      caption,
      visibility: visibility || 'public',
      videoUrl: `/uploads/${file.filename}`,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return res.status(201).json({ video })
})

router.post('/:videoId/like', requireAuth, async (req, res) => {
  const { videoId } = req.params
  const existing = await prisma.videoLike.findUnique({
    where: { videoId_userId: { videoId, userId: req.user.id } },
  })

  if (existing) {
    await prisma.videoLike.delete({ where: { id: existing.id } })
    return res.json({ liked: false })
  }

  await prisma.videoLike.create({
    data: {
      videoId,
      userId: req.user.id,
    },
  })

  return res.json({ liked: true })
})

router.post('/:videoId/comments', requireAuth, async (req, res) => {
  const { videoId } = req.params
  const { content } = req.body
  if (!content) {
    return res.status(400).json({ message: 'Comment content required' })
  }

  const comment = await prisma.comment.create({
    data: {
      videoId,
      userId: req.user.id,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  })
  return res.status(201).json({ comment })
})

router.get('/:videoId/comments', async (req, res) => {
  const { videoId } = req.params
  const comments = await prisma.comment.findMany({
    where: { videoId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
    take: 50,
  })
  return res.json({ comments })
})

export default router
