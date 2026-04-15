import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      videos: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          caption: true,
          videoUrl: true,
          thumbnail: true,
          createdAt: true,
        },
      },
      _count: {
        select: { videos: true },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ user })
})

router.patch('/me/profile', requireAuth, async (req, res) => {
  const { fullName, bio, avatarUrl, privacy } = req.body
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      fullName,
      bio,
      avatarUrl,
      privacy,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      bio: true,
      avatarUrl: true,
      privacy: true,
      createdAt: true,
    },
  })

  return res.json({ user })
})

export default router
