import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import videosRoutes from './routes/videos.routes.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const origin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin }))
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'holostem-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/videos', videosRoutes)

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
