# HoloStem Full-Stack Scaffold (Vercel + Cloud)

HoloStem is configured to run as a single Vercel project with:

- Vite/React frontend
- Express API served from Vercel Functions (`/api/*`)
- Prisma + PostgreSQL for cloud database
- Cloudinary for cloud-hosted video and image files

## Why direct-to-cloud uploads

Vercel serverless functions have request body limits, so uploading large videos through your API is fragile.
This project uploads media **directly from the browser to Cloudinary**, then saves only the resulting URLs in your database.

## API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- User profile: `/api/users/:username`, `/api/users/me/profile`
- Videos: `/api/videos/feed`, `/api/videos/upload` (metadata-only save)
- Engagement: `/api/videos/:videoId/like`, `/api/videos/:videoId/comments`

## Local Development

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev:full
```

Frontend: `http://localhost:5173`
API: `http://localhost:4000/api`

## Deploy to Vercel

1. Create a managed PostgreSQL database (Neon/Supabase/Railway/etc.).
2. Create a Cloudinary account and an unsigned upload preset.
3. Add all variables from `.env.example` in Vercel project settings.
4. Deploy the app.
5. Push Prisma schema to production DB once:

```bash
DATABASE_URL="your-production-postgres-url" npx prisma db push
```

## Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - your deployed frontend origin
- `VITE_API_BASE_URL` - use `/api` in Vercel
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` - unsigned preset for direct browser uploads

## Architecture Notes

- `/api/*` is routed to `api/index.js` (Vercel function), while all non-API routes rewrite to SPA entry.
- Video and avatar media are stored in Cloudinary; DB stores URLs only.
- Prisma datasource uses PostgreSQL for cloud-native deployment.
