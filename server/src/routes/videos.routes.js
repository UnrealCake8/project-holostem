import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const uploadPayloadSchema = z.object({
  caption: z.string().trim().min(1, 'Caption is required').max(280),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
  videoUrl: z.url('A valid cloud video URL is required'),
  thumbnail: z.url('A valid cloud thumbnail URL is required').optional(),
})

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

router.post('/upload', requireAuth, async (req, res) => {
  const parsed = uploadPayloadSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || 'Invalid upload payload',
    })
  }

  const { caption, visibility, videoUrl, thumbnail } = parsed.data

  const video = await prisma.video.create({
    data: {
      userId: req.user.id,
      caption,
      visibility,
      videoUrl,
      thumbnail,
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
