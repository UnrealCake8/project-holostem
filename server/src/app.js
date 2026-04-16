import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import videosRoutes from './routes/videos.routes.js'

export const app = express()
const origin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin }))
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'holostem-api',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
  })
  res.json({ status: 'ok', service: 'holostem-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/videos', videosRoutes)

app.use((error, _req, res, _next) => {
  console.error(error)

  const status = Number(error?.status || error?.statusCode || 500)
  const message =
    status >= 500 && isProduction
      ? 'Internal server error'
      : error?.message || 'Internal server error'

  res.status(status).json({
    message,
    code: error?.code || undefined,
  })
  res.status(500).json({ message: 'Internal server error' })
})
