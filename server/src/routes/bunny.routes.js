import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
})

function getBunnyConfig() {
  const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
  const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL
  const region = process.env.BUNNY_STORAGE_REGION || ''

  if (!storageZone || !accessKey || !pullZoneUrl) {
    return null
  }

  const storageHost = region
    ? `${region}.storage.bunnycdn.com`
    : 'storage.bunnycdn.com'

  return {
    storageZone,
    accessKey,
    pullZoneUrl: pullZoneUrl.replace(/\/$/, ''),
    storageHost,
  }
}

function safeFileName(originalName = 'video.mp4') {
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'mp4'
  const baseName = originalName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'video'

  return `${Date.now()}-${randomUUID()}-${baseName}.${extension}`
}

router.post('/upload', upload.single('video'), async (req, res) => {
  const config = getBunnyConfig()
  if (!config) {
    return res.status(503).json({
      message: 'Bunny.net uploads are not configured yet. Use a direct MP4 link instead.',
    })
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Choose a video file to upload.' })
  }

  if (!req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ message: 'Only video files can be uploaded.' })
  }

  const fileName = safeFileName(req.file.originalname)
  const objectPath = `holostem/${fileName}`
  const storageUrl = `https://${config.storageHost}/${config.storageZone}/${objectPath}`

  const bunnyResponse = await fetch(storageUrl, {
    method: 'PUT',
    headers: {
      AccessKey: config.accessKey,
      'Content-Type': req.file.mimetype,
    },
    body: req.file.buffer,
  })

  if (!bunnyResponse.ok) {
    const detail = await bunnyResponse.text().catch(() => '')
    return res.status(502).json({
      message: detail || 'Bunny.net could not store this video. Use a direct MP4 link instead.',
    })
  }

  return res.status(201).json({
    mediaUrl: `${config.pullZoneUrl}/${objectPath}`,
    fileName,
  })
})

export default router
